#!/usr/bin/env perl

use strict;
use warnings;
use 5.014;
use utf8;

use Astro::Sunrise;
use DateTime;
use DateTime::Duration;
use Encode qw(decode);
use File::Slurp qw(read_file write_file);
use List::Util qw(sum);
use Mojolicious::Lite;
use Storable qw(retrieve lock_nstore lock_retrieve);

no if $] >= 5.018, warnings => "experimental::smartmatch";

our $VERSION = qx{git describe --dirty} || '0.03';
my $locations   = {};
my $coordinates = {};
my $gpiomap     = {};
my $presets     = {};
my $remotemap   = {};
my $shortcuts   = {};

my $shutdownfile = '/tmp/is_shutdown';
my $tsdir        = '/tmp/dorfmap-ts';

my $auto_prefix   = '/etc/automatic_light_control';
my $store_prefix  = '/srv/www/stored';
my $bgdata_prefix = '/srv/www/bgdata';

my @dd_layers = map { [ "/?layer=$_", $_ ] } qw(control caution wiki);
my ( @dd_shortcuts, @dd_presets );
my (@killswitches);

# ref (1):
# some browsers send unsolicited HEAD requests e.g. when updating their
# hestory. Do not allow these to change anything.

#{{{ primitive helpers

sub slurp {
	my ($file) = @_;

	my $content = read_file( $file, err_mode => 'quiet' );
	if ( defined $content ) {
		chomp $content;
	}
	return $content;
}

sub spew {
	my ( $file, $value ) = @_;

	return write_file( $file, { err_mode => 'quiet' }, $value );
}

sub gpio {
	my ($index) = @_;

	return "/sys/class/gpio/gpio${index}/value";
}

sub get_ratelimit_delay {
	my ($id) = @_;
	if ( not $coordinates->{$id}->{ratelimit} or not -e "${tsdir}/${id}" ) {
		return -1;
	}
	my $last_use = ( stat("${tsdir}/${id}") )[9];
	my $now      = time;
	return ( $coordinates->{$id}->{ratelimit} - ( $now - $last_use ) );
}

sub set_remote {
	my ( $path, $value ) = @_;

	spew( $path, "${value}\n" );
	my $bus = ( split( qr{ / }ox, $path ) )[2];    # /tmp/$bus/$id
	system( 'avrshift', $bus );
}

sub set_device {
	my ( $id, $value, %opt ) = @_;

	$opt{force} //= 0;

	my $tsfile = "${tsdir}/${id}";

	if ( not -e $tsdir ) {
		mkdir($tsdir);
	}

	# force (and turning something off) shall always work
	if ( get_ratelimit_delay($id) > 0 and not $opt{force} and $value > 0 ) {
		return 1;
	}

	spew( $tsfile, $value );

	if ( exists $gpiomap->{$id} ) {
		spew( $gpiomap->{$id}, $value );
	}
	elsif ( $coordinates->{$id}->{type} eq 'charwrite' ) {
		spew( $remotemap->{$id}, "${value}\n" );
		system('update_clocks');
	}
	elsif ( exists $remotemap->{$id} ) {
		set_remote( $remotemap->{$id}, $value );
	}
	elsif ( $id =~ m{^amp..?$} ) {
		$id =~ s{ [ab] $ }{}ox;
		if ( $value == 1 ) {
			system("${id}_on");
		}
		else {
			system("${id}_off");
		}
	}
	else {
		return 0;
	}
	return 1;
}

sub get_device {
	my ( $id, %opt ) = @_;
	my $state = -1;

	if ( $opt{text} ) {
		$state = q{},;
	}

	if ( $coordinates->{$id}->{type} eq 'blinkenlight' ) {
		$state = slurp( $remotemap->{$id} . '/commands' );
		if ( $state =~ m{ ^ .* \n .* \n 0 \n 0 \n 0 \n }ox ) {
			$state = 0;
		}
		else {
			$state = 1;
		}
	}
	elsif ( $coordinates->{$id}->{type} eq 'charwrite' ) {
		$state = slurp( $remotemap->{$id} );
		if ( not $opt{text} ) {
			$state = ( length($state) ? 1 : 0 );
		}
	}
	elsif ( exists $gpiomap->{$id} and -e $gpiomap->{$id} ) {
		$state = slurp( $gpiomap->{$id} );
	}
	elsif ( exists $remotemap->{$id} and -e $remotemap->{$id} ) {
		$state = slurp( $remotemap->{$id} );
	}
	elsif ( $id =~ m{^amp} ) {
		$id =~ s{ [ab] $ }{}ox;
		$state = slurp("${store_prefix}/amp.${id}");
	}

	return $state;
}

sub unshutdown {

	if ( -e $shutdownfile ) {
		unlink($shutdownfile);

		for my $device ( keys %{$coordinates} ) {
			if ( exists $coordinates->{$device}->{default} ) {
				set_device( $device, $coordinates->{$device}->{default} );
			}
		}
	}

	return;
}

#}}}

sub load_coordinates {    #{{{
	my $ccontent = slurp('coordinates');
	$ccontent =~ s{\\\n}{}gs;
	my @lines = split( /\n/, $ccontent );

	my %section;

	for my $line (@lines) {

		if ( $line =~ s{ ^ \[ (.*) \] $ }{$1}ox ) {
			%section = ();
			for my $elem ( split( /\s+/, $line ) ) {
				my ( $key, $value ) = split( /=/, $elem );
				$section{$key} = $value;
			}
			next;
		}

		my ( $id, $left, $top, $right, $bottom, $controlpath, @rest )
		  = split( /\s+/, $line );
		my @text;

		if ( not $id or $id =~ m{^#}o ) {
			next;
		}

		# image areas don't specify right and bottom and are usually 32x32px
		$right  ||= $left + 32;
		$bottom ||= $top + 32;

		if ( exists $coordinates->{$id} ) {
			push(
				@{ $coordinates->{$id}->{duplicates} },
				{
					x1 => $left,
					y1 => $top,
					x2 => $right - $left,
					y2 => $bottom - $top
				}
			);
			next;
		}

		$coordinates->{$id} = {
			x1   => $left,
			y1   => $top,
			x2   => $right - $left,
			y2   => $bottom - $top,
			path => $controlpath,
		};

		for my $key ( keys %section ) {
			$coordinates->{$id}->{$key} //= $section{$key};
		}

		for my $elem (@rest) {
			if ( $elem =~ m{ ^ (?<key> [^=]+ ) = (?<value> .+ ) $ }ox ) {
				$coordinates->{$id}->{ $+{key} } = $+{value};
			}
			else {
				push( @text, $elem );
			}
		}

		if ( $coordinates->{$id}->{default} ) {
			$coordinates->{$id}->{default} =~ tr{*}{ };
		}

		$coordinates->{$id}->{text} = decode( 'UTF-8', join( q{ }, @text ) );

		$controlpath //= q{};
		if ( $controlpath =~ m{ ^ gpio (\d+) $ }ox ) {
			$gpiomap->{$id} = gpio($1);
		}
		elsif ( $controlpath =~ m{ ^ ( donationprint | feedback ) }ox ) {
			$remotemap->{$id} = "/tmp/${controlpath}";
		}

		$coordinates->{$id}->{is_readable}
		  = ( $coordinates->{$id}->{path} ne 'none' ) ? 1 : 0;
		$coordinates->{$id}->{is_writable}
		  = (     $coordinates->{$id}->{path} ne 'none'
			  and $id !~ m{ _ (?: au | r o ) $}ox ) ? 1 : 0;

		if (    $coordinates->{$id}->{type}
			and $coordinates->{$id}->{type} eq 'killswitch' )
		{
			push( @killswitches, $id );
		}
	}
	return;
}    #}}}

#{{{ storables

sub load_blinkencontrol {
	my $ret = {};

	if ( -e 'blinkencontrol.db' ) {
		$ret = lock_retrieve('blinkencontrol.db');
	}

	return $ret;
}

sub load_presets {
	if ( -e 'presets.db' ) {
		$presets = lock_retrieve('presets.db');

		@dd_presets = (
			[ '/presets?', 'manage' ],
			map { [ "/presets/apply/$_?", $_ ] } (
				reverse sort {
					$presets->{$a}->{timestamp} <=> $presets->{$b}->{timestamp}
				} ( keys %{$presets} )
			)
		);
	}

	return;
}

sub save_blinkencontrol {
	my ($bc_presets) = @_;

	lock_nstore( $bc_presets, 'blinkencontrol.db' );

	return;
}

sub save_presets {
	lock_nstore( $presets, 'presets.db' );

	return;
}

#}}}

#{{{ other helpers

sub device_actionlink {
	my ($id) = @_;
	my $type = $coordinates->{$id}->{type};

	if ( $type eq 'amp' ) {
		$id =~ s{ [ab] $}{}ox;
	}

	my $action = device_status($id) ? 'off' : 'on';

	given ($type) {
		when ('blinkenlight') { $action = 'blinkencontrol' }
		when ( [qw[charwrite killswitch]] )      { $action = $type }
		when ( [qw[phone printer server wifi]] ) { $action = 'on' }
		when ('light_au') { $action = 'toggle' }
	}

	return "/${action}/${id}";
}

sub device_status {
	my ($id) = @_;
	my $type = $coordinates->{$id}->{type};

	if ( ( $type ~~ [qw[phone printer server wifi]] )
		and get_device($id) == -1 )
	{
		return slurp("/srv/www/${id}.ping") || 0;
	}

	return get_device($id);
}

sub device_image {
	my ($id) = @_;
	my $type = $coordinates->{$id}->{type};

	if ( not $type ) {
		return;
	}

	if ( $type eq 'amp' ) {
		$id =~ s{ [ab] $}{}ox;
	}

	my $state  = device_status($id);
	my $prefix = $type;
	my $suffix = q{};

	if ( $type ~~ [qw[light_au light_ro]] ) {
		$prefix = 'light';
	}

	if ( -e "public/${id}_on.png" and -e "public/${id}_off.png" ) {
		$prefix = $id;
	}

	if ( $type ~~ [qw[phone printer server wifi]] ) {

		# unknown => off
		$suffix = '_off';
	}

	if ( $state == 1 or $state == 255 ) {
		$suffix = '_on';
	}
	elsif ( $state == 0 ) {
		$suffix = '_off';
	}

	if ( $type eq 'light_au' ) {
		$suffix .= ( -e "/tmp/automatic_${id}" ) ? '_auto' : '_noauto';
	}

	return "static/${prefix}${suffix}.png";
}

sub amp {
	my ($id) = @_;

	return
	  sprintf(
'<a href="%s" id="link%s" class="toggle"><img id="img%s" src="/%s" class="%s" title="%s" alt="amp" /></a>',
		device_actionlink($id), $id, $id, device_image($id), 'amp', 'amp' );
}

sub blinkenlight {
	my ($light) = @_;

	my $ret = sprintf( '<a href="%s" id="link%s">', device_actionlink($light),
		$light );

	$ret
	  .= sprintf( '<img src="/%s" id="img%s" class="blinklight %s" alt="%s" />',
		device_image($light), $light, $light, $light );

	$ret .= '</a>';

	return $ret;
}

sub charwrite {
	my ($id) = @_;

	my $ret
	  = sprintf( '<a href="%s" id="link%s">', device_actionlink($id), $id );

	$ret
	  .= sprintf(
'<img src="/static/charwrite.png" class="charwrite %s" id="img%s" alt="%s" />',
		$id, $id, $id );
	$ret .= '</a>';

	return $ret;
}

sub estimated_power_consumption {
	my $consumption = sum map { $coordinates->{$_}->{watts} }
	  grep { status_number($_) and status_number($_) > 0 } keys %{$coordinates};
	return $consumption // 0;
}

sub sprintf_wattage {
	my ($value) = @_;

	return sprintf(
		'<span class="wattage %s">%s</span>',
		$value > 0 ? q{} : 'error',
		$value > 0 ? sprintf( '%dW', $value ) : '?'
	);
}

sub infotext {
	my $buf;

	my $is_shutdown = ( -e '/tmp/is_shutdown' );

	$buf .= sprintf(
		'<span class="shutdown%s">Shutdown: %s</span><br/>',
		$is_shutdown ? 'yes' : 'no',
		$is_shutdown ? 'Yes' : 'No',
	);

	if ( $is_shutdown and get_device('outdoor') == 1 ) {
		$buf
		  .= 'Außenbeleuchtung geht in wenigen Minuten automatisch aus<br/>';
	}

	if ( -e "${bgdata_prefix}/hosts_dynamic" ) {
		$buf .= sprintf(
			'<span class="onlinegueststext">Online IPs</span>'
			  . '<span class="onlineguests">%d</span> guests / '
			  . ' <span class="onlineguests">%d</span> total<br/>',
			slurp("${bgdata_prefix}/hosts_dynamic"),
			slurp("${bgdata_prefix}/hosts_total")
		);
	}

	my $power_p1 = slurp('/srv/www/flukso/30_p1');
	my $power_p2 = slurp('/srv/www/flukso/30_p2');
	my $power_p3 = slurp('/srv/www/flukso/30_p3');

	$buf .= '<span class="wattagetext">Verbrauch</span>';
	$buf .= sprintf_wattage( $power_p1 + $power_p2 + $power_p3 );
	$buf .= '<br/><ul>';
	$buf .= '<li><span class="wattagetext">Phasen</span>';

	$buf .= join( ' + ',
		map { sprintf_wattage($_) } ( $power_p1, $power_p2, $power_p3 ) );
	$buf .= '</li>';

	if ( -e "${store_prefix}/power_serverraum" ) {
		$buf .= '<li><span class="wattagetext">Serverraum (USV)</span>';
		$buf .= sprintf_wattage( slurp("${store_prefix}/power_serverraum") );
		$buf .= '</li>';
	}

	$buf .= sprintf(
		'<li><span class="wattagetext">Beleuchtung</span>'
		  . '<span class="wattage">ca. %dW</span></li>',
		estimated_power_consumption
	);
	$buf .= '</ul>';

	for my $cb (@killswitches) {
		if ( get_device($cb) == 0 ) {
			$buf
			  .= sprintf(
				'<img src="/static/warning.png" alt="!" /> Bus Circuit Breaker '
				  . '<a href="/killswitch/%s">%s</a> is disconnected - '
				  . 'some devices will not work<br/>',
				$cb, $cb );
		}
	}

	for my $h ( keys %{$coordinates} ) {
		if ( exists $coordinates->{$h}->{dorfmap}
			and device_status($h) == 0 )
		{
			my $prefix = $coordinates->{$h}->{dorfmap};
			$buf .= sprintf(
'<img style="float: left;" src="/static/warning.png" alt="!" /> %s is offline — '
				  . 'some devices may not work <ul><li>%s</li></ul><br/>',
				$h,
				join( '</li><li>',
					grep { $coordinates->{$_}->{path} =~ m{ ^ $h }x }
					  keys %{$coordinates} )
			);
		}
	}

	return $buf;
}

sub json_status {
	my ( $id, $embed ) = @_;

	my $ret = {
		auto => ( -e "/tmp/automatic_${id}" ? 1 : 0 ),
		rate_delay  => get_ratelimit_delay($id),
		status      => status_number($id),
		status_text => status_text($id),
		infoarea    => infotext(),
	};

	if ( $coordinates->{$id}->{type} eq 'charwrite' ) {
		$ret->{charwrite_text} = get_device( $id, text => 1 );
	}

	return $ret;
}

sub killswitch {
	my ($cb) = @_;

	my $ret
	  = sprintf( '<a href="%s" id="link%s">', device_actionlink($cb), $cb );

	$ret
	  .= sprintf( '<img src="/%s" id="img%s" class="killswitch %s" alt="%s" />',
		device_image($cb), $cb, $cb, $cb );

	$ret .= '</a>';

	return $ret;
}

sub light {
	my ( $light, $is_rw ) = @_;

	my $ret = q{};

	if ($is_rw) {
		$ret .= sprintf( '<a href="%s" id="link%s" class="toggle">',
			device_actionlink($light), $light );
	}

	$ret
	  .= sprintf( '<img src="/%s" id="img%s" class="light ro %s" alt="%s" />',
		device_image($light), $light, $light, $light, $light );

	if ($is_rw) {
		$ret .= sprintf('</a>');
	}

	return $ret;
}

sub muninlink {
	my ( $plugin, $name ) = @_;

	return
	  sprintf(
'<a href="https://intern.chaosdorf.de/munin/chaosdorf.dn42/figurehead.chaosdorf.dn42/%s.html">%s</a>',
		$plugin, $name // $plugin );
}

sub pingdevice {
	my ( $type, $host, $label ) = @_;

	if ( exists $gpiomap->{$host} or exists $remotemap->{$host} ) {
		return
		  sprintf(
'<a href="/on/%s" id="link%s"><img src="/%s" id="img%s" class="%s ro %s" title="%s" alt="%s" /></a>',
			$host, $host, device_image($host), $host, $type, $host, $label,
			$host );
	}
	else {
		return
		  sprintf(
			'<img src="/%s" id="img%s" class="%s ro %s" title="%s" alt="%s" />',
			device_image($host), $host, $type, $host, $label, $host, );
	}

}

sub pump {
	my ($id) = @_;

	return
	  sprintf(
'<a href="%s" class="link%s" class="toggle"><img id="img%s" src="/%s" class="%s" title="%s" alt="amp" /></a>',
		device_actionlink($id), $id, $id, device_image($id), 'pump', 'pump' );
}

sub status_number {
	my ($id) = @_;
	my $type = $coordinates->{$id}->{type};

	given ($type) {
		when ('door') {
			return ( slurp('/srv/www/doorstatus') eq 'open' ? 1 : 0 )
		}
		default { return device_status($id) }
	}

	return -1;
}

sub status_text {
	my ($location) = @_;

	my $type  = $coordinates->{$location}->{type};
	my $extra = q{};

	if ( get_ratelimit_delay($location) > 0 ) {
		$extra = sprintf( ' (rate limited - wait %d seconds)',
			get_ratelimit_delay($location) );
	}

	if ( $type eq 'rtext' ) {
		return slurp("${store_prefix}/${location}");
	}
	if ( $type eq 'infoarea' ) {
		return infotext();
	}
	if ( $type eq 'light_au' ) {
		return $coordinates->{$location}->{text} . '<br/>'
		  . auto_text($location);
	}
	return $coordinates->{$location}->{text} . $extra;
}

sub auto_text {

	my ($id) = @_;

	my $now = DateTime->now( time_zone => 'Europe/Berlin' );
	my $delta = DateTime::Duration->new(
		minutes => ( slurp("${auto_prefix}/${id}") || 0 ) );

	my ( $rise_str, $set_str )
	  = sunrise( $now->year, $now->month, $now->day, 6.47, 51.14,
		$now->offset / 3600, 0 );

	my ( $rise_h, $rise_m ) = ( $rise_str =~ m{(..):(..)} );
	my ( $set_h,  $set_m )  = ( $set_str =~ m{(..):(..)} );

	my $sunrise = $now->clone->set(
		hour   => $rise_h,
		minute => $rise_m
	);
	my $sunset = $now->clone->set(
		hour   => $set_h,
		minute => $set_m
	);

	$sunrise->add_duration($delta);
	$sunset->subtract_duration($delta);

	return sprintf(
		'Automatik: %s → %s %s',
		$sunset->strftime('%H:%M'),
		$sunrise->strftime('%H:%M'),
		( -e "/tmp/automatic_${id}" ) ? q{} : '(deaktiviert)',
	);

}

sub wikilink {
	my ($site) = @_;
	my $name   = $site;
	my $image  = undef;

	if ( $name =~ s{ ^ Host : }{}ox ) {
		$image = '/static/host.png';
	}

	return sprintf(
		'%s<a href="https://wiki.chaosdorf.de/%s">%s</a>',
		$image ? "<img src=\"/$image\" alt=\"wl\" />" : q{},
		$site, $name
	);
}

#}}}

#{{{ Shortcuts

sub make_shortcuts {
	@dd_shortcuts = map { [ "/action/$_?", $_ ] } ( sort keys %{$shortcuts} );
}

$shortcuts->{'amps on'} = sub {
	my ($self) = @_;

	unshutdown;
	for my $amp (qw(amp0 amp1 amp2 amp3)) {
		set_device( $amp, 1 );
	}

	return;
};

$shortcuts->{'amps off'} = sub {
	my ($self) = @_;

	for my $amp (qw(amp0 amp1 amp2 amp3)) {
		set_device( $amp, 0 );
	}

	return;
};

$shortcuts->{makeprivate} = sub {
	my ($self) = @_;

	system(qw(ssh private@door));

	return $?;
};

$shortcuts->{shutdown} = sub {
	my ($self) = @_;
	my @errors;
	my @delayed;

	system('shutdown-announce');

	spew( $shutdownfile, q{} );

	for my $device ( keys %{$coordinates} ) {
		my $type = $coordinates->{$device}->{type};

		# delayed poweroff so the shutdown announcement has sufficient time
		if ( $type ~~ [qw[amp]] ) {
			push( @delayed, $device );
			next;
		}

		# do not trip circuit breakers
		if ( $type ~~ [qw[killswitch]] ) {
			next;
		}

		if ( $type eq 'blinkenlight' ) {
			my $path = $remotemap->{$device};
			if ( $path =~ m{donationprint}o ) {
				spew( "${path}/commands", "0\n255\n0\n0\n0\n0\n1\n" );
				system('blinkencontrol-donationprint');
			}
			elsif ( $path =~ m{feedback}o ) {
				spew( "${path}/commands", "0\n255\n0\n0\n0\n0\n8\n" );
				system('blinkencontrol-feedback');
			}
		}
		elsif ( $type eq 'printer'
			and slurp("/srv/www/${device}.ping") == 1
			and not set_device( $device, 0, force => 1 ) )
		{
			push( @errors, "please turn off printer ${device}" );
		}
		elsif ( $type eq 'charwrite' ) {
			set_device( $device, q{ }, force => 1 );
		}
		else {
			set_device( $device, 0, force => 1 );
		}
	}

	system(qw(ssh private@door));

	for my $device (@delayed) {
		set_device( $device, 0, force => 1 );
	}

	if ( $? != 0 ) {
		push( @errors,
			    "CRITICAL: private\@door returned $?: $! --"
			  . ' please make sure the door is set to non-public' );
	}
	elsif (@errors) {
		unshift( @errors,
			    'shutdown successful. however, the following '
			  . 'warnings were generated:' );
	}

	return @errors;
};

$shortcuts->{unshutdown} = sub {
	my ($self) = @_;

	unshutdown;

	return;
};

#}}}

#{{{ Helpers

helper has_location => sub {
	my ( $self, $location ) = @_;

	my $ret    = q{};
	my $prefix = 'http://wiki.chaosdorf.de/Special:URIResolver/';

	for my $item ( @{ $locations->{"${prefix}${location}"} // [] } ) {
		my ($name) = ( $item =~ m{ ^ $prefix (.*) $ }x );
		$name =~ s{ - ( [0-9A-F] {2} ) }{ chr(hex($1)) }egx;
		$name = decode( 'UTF-8', $name );
		$ret .= sprintf( "<li><a href=\"%s\">%s</a></li>\n", $item, $name );
	}

	return $ret;
};

helper statusclass => sub {
	my ( $self, $type, $location ) = @_;

	if ( $type eq 'door' ) {
		return slurp('/srv/www/doorstatus') || 'unknown';
	}
	if ( $type eq 'rtext' ) {
		return 'rtext';
	}

	return q{};
};

helper statuslink => sub {
	my ( $self, $type ) = @_;

	return device_actionlink($type);
};

helper status_number => sub {
	my ( $self, $location ) = @_;

	return status_number($location);
};

helper status_image => sub {
	my ( $self, $location ) = @_;

	return device_image($location);
};

helper statusimage => sub {
	my ( $self, $type, $location ) = @_;

	given ($type) {
		when ('amp')          { return amp($location) }
		when ('blinkenlight') { return blinkenlight($location) }
		when ('charwrite')    { return charwrite($location) }
		when ('killswitch')   { return killswitch($location) }
		when ('light')        { return light( $location, 1 ) }
		when ('light_au')     { return light( $location, 2 ) }
		when ('light_ro')     { return light( $location, 0 ) }
		when ('pump')         { return pump($location) }
		when ( [qw[phone printer server wifi]] ) {
			return pingdevice( $type, $location, $location )
		}
	}

	return q{};
};

helper statustext => sub {
	my ( $self, $type, $location ) = @_;

	return status_text($location);
};

#}}}

#{{{ Routes

get '/' => sub {
	my ($self) = @_;
	my $layer = $self->param('layer') // 'control';

	load_presets();

	if ( -e 'locations.db' ) {
		$locations = retrieve('locations.db');
	}

	$self->render(
		'overview-angular',
		version     => $VERSION,
		about       => 1,
		coordinates => $coordinates,
		shortcuts   => \@dd_shortcuts,
		errors      => [ $self->param('error') || () ],
		presets     => \@dd_presets,
		refresh     => 1,
		layer       => $layer,
		layers      => \@dd_layers,
	);
	return;
};

get '/action/:action' => sub {
	my ($self) = @_;
	my $action = $self->stash('action');
	my $layer = $self->param('layer') // 'control';
	my @errors = ('no such action');

	# see (1)
	if ( exists $shortcuts->{$action} and $self->req->method eq 'GET' ) {
		@errors = &{ $shortcuts->{$action} }($self);
	}

	if (@errors) {
		$self->render(
			'overview',
			about       => 1,
			version     => $VERSION,
			coordinates => $coordinates,
			shortcuts   => \@dd_shortcuts,
			errors      => \@errors,
			presets     => \@dd_presets,
			refresh     => 0,
			layer       => $layer,
			layers      => \@dd_layers,
		);
	}
	else {
		$self->redirect_to('/');
	}
	return;
};

get '/ajax/blinkencontrol' => sub {
	my ($self) = @_;

	my $bc_presets = load_blinkencontrol();
	my @json;

	for my $bc_preset ( sort keys %{ $bc_presets->{blinkencontrol1} } ) {
		push(
			@json,
			{
				name       => $bc_preset,
				raw_string => $bc_presets->{blinkencontrol1}->{$bc_preset},
			}
		);
	}

	$self->render(
		json => \@json,
	);
};

get '/ajax/charwrite' => sub {
	my ($self) = @_;

	$self->render(
		json => [
			{
				name        => 'blank',
				description => 'Blank',
			},
			{
				name        => 'clock',
				description => 'Clock',
			},
			{
				name        => 'date',
				description => 'Date',
			},
			{
				name        => 'hosts',
				description => 'Online Hosts',
			},
			{
				name        => 'power',
				description => 'Power Consumption',
			},
		]
	);
};

get '/ajax/infoarea' => sub {
	my ($self) = @_;

	$self->render( inline => infotext() );
	return;
};

get '/ajax/statustext/:id' => sub {
	my ($self) = @_;
	my $id = $self->stash('id');

	my $result = q{};
	if ( exists $coordinates->{$id} ) {
		$result = $self->statustext( $coordinates->{$id}->{type}, $id );
	}

	$self->render(
		text   => $result,
		format => 'txt'
	);
	return;
};

get '/ajax/rate_limit/:id' => sub {
	my ($self) = @_;
	my $id = $self->stash('id');

	$self->render( json => get_ratelimit_delay($id) );
	return;
};

get '/ajax/has_location/:id' => sub {
	my ($self) = @_;
	my $id = $self->stash('id');

	$self->render( json => $self->has_location($id) );
	return;
};

get '/ajax/menu' => sub {
	my ($self) = @_;

	$self->render(
		json => {
			shortcuts => \@dd_shortcuts,
			presets   => \@dd_presets,
			layers    => \@dd_layers,
		}
	);
	return;
};

get '/blinkencontrol/:device' => sub {
	my ($self) = @_;
	my $device = $self->stash('device');
	my $layer = $self->param('layer') // 'control';

	my $red     = $self->param('red');
	my $green   = $self->param('green');
	my $blue    = $self->param('blue');
	my $speed   = $self->param('speed') // 254;
	my $opmode  = $self->param('opmode');
	my $command = $self->param('command') // q{};
	my $cmdname = $self->param('cmdname') // q{};
	my $action  = $self->param('action') // q{};
	my $mobile  = $self->param('m') // q{};
	my $rawmode = 0;

	my $bc_presets = load_blinkencontrol();

	my $controlpath = $remotemap->{$device};

	if ( defined $speed ) {
		$speed = 255 - $speed;

		if ( $speed == 0 ) {
			$speed = 1;
		}
	}

	if ( not $controlpath ) {
		$self->render(
			'overview',
			about       => 1,
			version     => $VERSION,
			coordinates => $coordinates,
			shortcuts   => \@dd_shortcuts,
			errors      => ['no such device'],
			presets     => \@dd_presets,
			refresh     => 0,
			layer       => $layer,
			layers      => \@dd_layers,
		);
		return;
	}

	if (    length($command) == 0
		and defined $red
		and defined $green
		and defined $blue
		and defined $speed )
	{
		$command = join( ',', $speed, $red, $green, $blue );
	}

	# see (1)
	if ( length($command) and $self->req->method eq 'GET' ) {
		my $ctext = q{};
		my $id    = 0;
		my $addr  = 1;

		if ( $controlpath =~ m{feedback}o ) {
			$addr = 8;
		}

		for my $part ( split( / /, $command ) ) {
			my ( $speed, $red, $green, $blue ) = split( /,/, $part );
			$ctext
			  .= "${id}\n${speed}\n${red}\n${green}\n${blue}\n0\n${addr}\npush\n";
			$id++;
		}

		spew( "${controlpath}/commands", $ctext );

		if ( $controlpath =~ m{donationprint}o ) {
			system('blinkencontrol-donationprint');
		}
		elsif ( $controlpath =~ m{feedback}o ) {
			system('blinkencontrol-feedback');
		}

		if ( length($cmdname) ) {
			$bc_presets->{blinkencontrol1}->{$cmdname} = $command;
			save_blinkencontrol($bc_presets);
		}
	}
	elsif ( $cmdname and $action eq 'delete' and $self->req->method eq 'GET' ) {
		delete $bc_presets->{blinkencontrol1}->{$cmdname};
		save_blinkencontrol($bc_presets);
		$bc_presets = load_blinkencontrol();
	}

	$self->respond_to(
		any => {
			template => 'blinkencontrol' . ( $mobile ? '-m' : q{} ),
			about => !$mobile,
			coordinates => {},
			device      => $device,
			errors      => [],
			version     => $VERSION,
			refresh     => 0,
			bc_presets  => $bc_presets,
		},
		json => {
			json => {
				red    => 0,
				green  => 0,
				blue   => 0,
				speed  => 0,
				opmode => 0,
			}
		},
	);
};

post '/ajax/charwrite' => sub {
	my ($self) = @_;
	my $device = $self->param('device');
	my $text   = $self->param('text');

	if ( defined $text and defined $device ) {
		set_device( $device, $text );
	}

	$self->render(
		data   => q{},
		status => 204
	);
};

get '/charwrite/:device' => sub {
	my ($self) = @_;
	my $device = $self->stash('device');
	my $layer  = $self->param('layer') // 'control';
	my $mobile = $self->param('m')     // q{};

	my $text = $self->param('disptext');

	my $controlpath = $remotemap->{$device};

	if ( not $controlpath ) {
		$self->render(
			'overview',
			about       => 1,
			version     => $VERSION,
			coordinates => $coordinates,
			shortcuts   => \@dd_shortcuts,
			errors      => ['no such device'],
			presets     => \@dd_presets,
			refresh     => 0,
			layer       => $layer,
			layers      => \@dd_layers,
		);
		return;
	}

	# see (1)
	if ( defined $text and $self->req->method eq 'GET' ) {
		set_device( $device, $text );
	}
	else {
		$self->param( disptext => ( slurp($controlpath) // 'clock' ) );
	}

	$self->respond_to(
		any => {
			template => 'charwrite' . ( $mobile ? '-m' : q{} ),
			about => !$mobile,
			coordinates => {},
			device      => $device,
			errors      => [],
			version     => $VERSION,
			refresh     => 0,
		},
		json => {
			json => {
				text => scalar $self->param('disptext'),
			}
		},
	);
};

get '/get/:id' => sub {
	my ($self) = @_;
	my $id = $self->stash('id');

	$self->respond_to(
		json => {
			json => {
				status => json_status( $id, 1 ),
				auto => ( -e "/tmp/automatic_${id}" ? 1 : 0 )
			}
		},
		txt => { text => status_number($id) . "\n" },
		png => sub    { $self->render_static( device_image($id) ) },
		any => {
			data   => status_number($id),
			status => 406
		},
	);

	return;
};

get '/get_power_consumption' => sub {
	my ($self) = @_;

	my $power_p1 = slurp('/srv/www/flukso/30_p1');
	my $power_p2 = slurp('/srv/www/flukso/30_p2');
	my $power_p3 = slurp('/srv/www/flukso/30_p3');

	$self->respond_to(
		json => {
			json => {
				power => estimated_power_consumption,
				p1    => $power_p1,
				p2    => $power_p2,
				p3    => $power_p3
			}
		},
		txt => { text => estimated_power_consumption },
		any => {
			data   => estimated_power_consumption,
			status => 406
		},
	);

	return;
};

get '/killswitch/:device' => sub {
	my ($self) = @_;
	my $device = $self->stash('device');
	my $action = $self->param('action');

	my $controlpath = $remotemap->{$device};

	if ( not $controlpath ) {
		$self->render(
			'overview',
			about       => 1,
			version     => $VERSION,
			coordinates => $coordinates,
			shortcuts   => \@dd_shortcuts,
			errors      => ['no such device'],
			presets     => \@dd_presets,
			refresh     => 0,
			layer       => 'caution',
			layers      => \@dd_layers,
		);
		return;
	}

	# see (1)
	if ( $action and $self->req->method eq 'GET' ) {
		if ( $action eq 'on' ) {
			set_device( $device, 1 );
		}
		elsif ( $action eq 'off' ) {
			set_device( $device, 0 );
		}
	}

	$self->respond_to(
		any => {
			template    => 'killswitch',
			about       => 1,
			coordinates => {},
			device      => $device,
			status      => get_device($device),
			errors      => [],
			version     => $VERSION,
			refresh     => 0,
		},
		json => {
			json => {
				status => get_device($device),
			}
		},
	);
};

get '/list/all' => sub {
	my ($self) = @_;
	my $devices = {};

	for my $id ( keys %{$coordinates} ) {
		my $type = $coordinates->{$id}->{type} // q{};
		if ( $coordinates->{$id}->{x1} == 0 and $coordinates->{$id}->{y1} == 0 )
		{
			next;
		}
		$devices->{$id}->{name}        = $id;
		$devices->{$id}->{x1}          = $coordinates->{$id}->{x1};
		$devices->{$id}->{y1}          = $coordinates->{$id}->{y1};
		$devices->{$id}->{x2}          = $coordinates->{$id}->{x2};
		$devices->{$id}->{y2}          = $coordinates->{$id}->{y2};
		$devices->{$id}->{type}        = $coordinates->{$id}->{type};
		$devices->{$id}->{is_readable} = $coordinates->{$id}->{is_readable};
		$devices->{$id}->{is_writable} = $coordinates->{$id}->{is_writable};
		$devices->{$id}->{status}      = status_number($id);
		$devices->{$id}->{auto}        = ( -e "/tmp/automatic_${id}" ? 1 : 0 );
		$devices->{$id}->{desc}        = $coordinates->{$id}->{text};
		$devices->{$id}->{area}        = $coordinates->{$id}->{area};
		$devices->{$id}->{layer}       = $coordinates->{$id}->{layer};
		$devices->{$id}->{duplicates}  = $coordinates->{$id}->{duplicates};
		$devices->{$id}->{status_text}
		  = $self->statustext( $coordinates->{$id}->{type}, $id );
		$devices->{$id}->{rate_delay} = get_ratelimit_delay($id);
		$devices->{$id}->{image}      = device_image($id);

		if ( $type eq 'charwrite' ) {
			$devices->{$id}->{charwrite_text} = get_device( $id, text => 1 );
		}
	}

	$self->respond_to(
		json => { json => $devices },
		txt  => {
			text => join(
				"\n",
				map {
					join( "\t",
						$_,
						@{ $devices->{$_} }
						  {qw[type status is_readable is_writable]} )
				} keys %{$devices}
			)
		},
		any => {
			data   => 'not acceptables. use json or txt',
			status => 406
		},
	);
	return;
};

get '/list/readables' => sub {
	my ($self) = @_;

	my @readables
	  = grep { $coordinates->{$_}->{path} ne 'none' } keys %{$coordinates};

	$self->respond_to(
		json => { json => { devices => \@readables } },
		txt => { text => join( "\n", @readables ) },
		any => {
			data   => 'not acceptable. use json or txt',
			status => 406
		},
	);

	return;
};

get '/list/writables' => sub {
	my ($self) = @_;

	my @writables = grep {
		      $coordinates->{$_}->{path} ne 'none'
		  and $coordinates->{$_}->{type} !~ m{ _ (?: ro | au ) $ }ox
	  }
	  keys %{$coordinates};

	$self->respond_to(
		json => { json => { devices => \@writables } },
		txt => { text => join( "\n", @writables ) },
		any => {
			data   => 'not acceptable. use json or txt.',
			status => 406
		},
	);

	return;
};

any '/presets' => sub {
	my ($self) = @_;
	my $action = $self->param('action') // q{};
	my $name   = $self->param('name')   // q{};
	my $save   = $self->param('save')   // 0;

	load_presets();

	$name =~ tr{[0-9a-zA-Z ]}{}cd;

	# see (1)
	if ( $save and length($name) and $self->req->method ~~ [qw[GET POST]] ) {
		for my $id ( keys %{$coordinates} ) {
			if (    $coordinates->{$id}->{type}
				and $coordinates->{$id}->{type} eq 'light' )
			{
				if ( $self->param($id) ~~ [ -1, 0, 1 ] ) {
					$presets->{$name}->{$id} = $self->param($id);
				}
				else {
					$presets->{$name}->{$id} = -1;
				}
			}
		}
		$presets->{$name}->{timestamp} = time();
		save_presets();
		load_presets();
	}

	# see (1)
	if ( $action eq 'delete' and $name and $self->req->method eq 'GET' ) {
		delete $presets->{$name};
		save_presets();
		$self->redirect_to('/presets');
		return;
	}

	my @toggles;
	for my $id ( keys %{$coordinates} ) {
		if (    $coordinates->{$id}->{type}
			and $coordinates->{$id}->{type} eq 'light' )
		{
			push( @toggles, [ $id, $coordinates->{$id} ] );
			if ( $name and exists $presets->{$name}->{$id} ) {
				$self->param( $id => $presets->{$name}->{$id} );
			}
			else {
				$self->param( $id => status_number($id) );
			}
		}
	}

	$self->render(
		'presets',
		about       => 1,
		coordinates => {},
		errors      => [],
		presetdata  => $presets,
		presets     => \@dd_presets,
		toggles     => \@toggles,
		version     => $VERSION,
		refresh     => 0,
	);

	return;
};

get '/presets/apply/:name' => sub {
	my ($self) = @_;
	my $name = $self->stash('name');

	# see (1)
	if ( $self->req->method ne 'GET' ) {
		$self->redirect_to( $self->param('m') ? '/m' : '/' );
		return;
	}

	load_presets();

	if ( exists $presets->{$name}->{timestamp} ) {
		$presets->{$name}->{timestamp} = time();
		$presets->{$name}->{usecount}++;
		save_presets();
	}

	for my $id ( keys %{$coordinates} ) {
		if ( exists $presets->{$name}->{$id}
			and $presets->{$name}->{$id} != -1 )
		{
			set_device( $id, $presets->{$name}->{$id} );
		}
	}

	$self->redirect_to( $self->param('m') ? '/m' : '/' );
	return;
};

post '/set' => sub {
	my ($self) = @_;

	if ( not -d $store_prefix ) {
		mkdir($store_prefix);
	}

	if ( $self->req->method eq 'POST' ) {
		for my $key ( keys %{$coordinates} ) {
			if ( ( $coordinates->{$key}->{type} // q{} ) eq 'rtext'
				and $self->param($key) )
			{
				spew( "${store_prefix}/${key}", $self->param($key) );
			}
		}
	}

	$self->render(
		data   => q{},
		status => 204
	);
};

get '/space_api' => sub {
	my ($self) = @_;

	my %json = (
		api      => '0.13',
		space    => 'Chaosdorf',
		logo     => 'https://wiki.chaosdorf.de/images/1/1d/ChaosdorfLogo.svg',
		url      => 'https://chaosdorf.de',
		location => {
			address => 'Chaos Computer Club Düsseldorf / Chaosdorf e.V.,'
			  . ' Hüttenstr. 25, 40215 Düsseldorf, Germany',
			lat => 51.21656,
			lon => 6.78347,
		},
		state => {

			# \1 -> json true, \0 -> json false
			open => slurp('/srv/www/doorstatus') eq 'open' ? \1 : \0,
		},
		contact => {
			irc     => 'irc://irc.oftc.net/#chaosdorf',
			twitter => '@chaosdorf',
			email   => 'mail@chaosdorf.de',
		},
		issue_report_channels => ['twitter'],
		feeds                 => {
			blog => {
				url  => 'http://chaosdorf.de/feed/',
				type => 'rss',
			},
			calendar => {
				url  => 'http://flux.derf0.net/cccd.ics',
				type => 'ical',
			},
		},
		projects => [
			'https://wiki.chaosdorf.de/Projects',
			'https://github.com/chaosdorf',
		],
	);

	$self->respond_to(
		json => { json => \%json },
		any  => {
			data   => 'not acceptables. use json',
			status => 406
		},
	);
};

get '/toggle/:id' => sub {
	my ($self) = @_;
	my $id = $self->stash('id');

	# see (1)
	if ( $self->req->method ne 'GET' ) {
		$self->redirect_to('/');
		return;
	}

	if ( $coordinates->{$id}->{type} eq 'light_au' ) {
		if ( -e "/tmp/automatic_${id}" ) {
			unlink("/tmp/automatic_${id}");
		}
		else {
			spew( "/tmp/automatic_${id}", q{} );
		}
		if ( slurp( $gpiomap->{$id} ) == 0 ) {
			$self->redirect_to('/');
			return;
		}
	}
	else {
		unshutdown;
	}

	my $state = get_device($id);
	my $res = set_device( $id, $state ^ 1 );

	if ( $self->param('ajax') ) {
		$self->render( json => json_status($id) );
	}
	elsif ($res) {
		$self->redirect_to('/');
	}
	else {
		$self->redirect_to('/?error=no+such+device');
	}

	return;
};

get '/off/:id' => sub {
	my ($self) = @_;
	my $id = $self->stash('id');

	# see (1)
	if ( $self->req->method ne 'GET' ) {
		$self->redirect_to('/');
		return;
	}

	if ( $coordinates->{$id}->{type} eq 'light_au' ) {
		if ( -e "/tmp/automatic_${id}" ) {
			unlink("/tmp/automatic_${id}");
		}
	}

	my $res = set_device( $id, 0 );

	if ( $self->param('ajax') ) {
		$self->render( json => json_status($id) );
	}
	elsif ($res) {
		$self->redirect_to('/');
	}
	else {
		$self->redirect_to('/?error=no+such+device');
	}

	return;
};

get '/on/:id' => sub {
	my ($self) = @_;
	my $id = $self->stash('id');

	# see (1)
	if ( $self->req->method ne 'GET' ) {
		$self->redirect_to('/');
		return;
	}

	if ( $coordinates->{$id}->{type} eq 'light_au' ) {
		spew( "/tmp/automatic_${id}", q{} );
		$self->redirect_to('/');
		return;
	}

	unshutdown;
	my $res = set_device( $id, 1 );

	if ( $self->param('ajax') ) {
		$self->render( json => json_status($id) );
	}
	elsif ($res) {
		$self->redirect_to('/');
	}
	else {
		$self->redirect_to('/?error=no+such+device');
	}

	return;
};

#}}}

app->config(
	hypnotoad => {
		accept_interval => 0.2,
		listen          => ['http://127.0.0.1:8081'],
		pid_file        => '/tmp/dorfmap.pid',
		workers         => 4,
	},
);
app->defaults( layout => 'default' );

#plugin NYTProf => {
#	nytprof => {
#		profiles_dir => '/tmp/dorfmap-nytprof',
#	},
#};

load_coordinates();
make_shortcuts();
app->types->type( txt  => 'text/plain; charset=utf-8' );
app->types->type( json => 'application/json; charset=utf-8' );
app->plugin('browser_detect');
app->start;
