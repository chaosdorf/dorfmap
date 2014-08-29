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
use List::Util qw(first sum);
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

my @dd_layers = map { { name => $_ } } qw(control caution wiki);
my ( @dd_shortcuts, @dd_presets );

my @charwrite_modes = (
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
);

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

	# do not allow users to turn off a printer (they are automatically
	# turned off after a while)
	if (    $coordinates->{$id}->{type} eq 'printer'
		and $value == 0
		and not $opt{force} )
	{
		return 1;
	}

	# do not allow users to do anything with a device marked as user_readonly
	if ( $coordinates->{$id}->{user_readonly} and not $opt{force} ) {
		return 1;
	}

	if ( $coordinates->{$id}->{inverted} ) {
		$value ^= 1;
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
	my $type  = $coordinates->{$id}->{type};

	if ( $opt{text} ) {
		$state = q{},;
	}

	if ( not $type ) {
		return $state;
	}
	if ( $coordinates->{$id}->{type} eq 'blinkenlight' ) {
		$state = slurp( $remotemap->{$id} . '/commands' );
		if ( $opt{text} ) {
			$state =~ s{ \n }{,}gx;
			$state =~ s{ , push $ }{}gx;
			$state =~ s{ , push , }{ }gx;
			$state
			  =~ s{ [^\s,]+,([^,]+),([^,]+),([^,]+),([^,]+),[^,]+,[^\s,]+ }{$1,$2,$3,$4}gx;
		}
		else {
			if ( $state
				=~ m{ ^ .* \n .* \n 0 \n 0 \n 0 \n \d+ \n \d+ \n push $ }ox )
			{
				$state = 0;
			}
			else {
				$state = 1;
			}
		}
	}
	elsif ( $coordinates->{$id}->{type} eq 'charwrite' ) {
		$state = slurp( $remotemap->{$id} );
		if ( not $opt{text} ) {
			$state = length($state) ? 1 : 0;
		}
	}
	elsif ( exists $gpiomap->{$id} and -e $gpiomap->{$id} ) {
		$state = slurp( $gpiomap->{$id} ) ? 1 : 0;
	}
	elsif ( exists $remotemap->{$id} and -e $remotemap->{$id} ) {
		$state = slurp( $remotemap->{$id} ) ? 1 : 0;
	}
	elsif ( $id =~ m{^amp} ) {
		$id =~ s{ [ab] $ }{}ox;
		$state = slurp("${store_prefix}/amp.${id}") ? 1 : 0;
	}

	if ( $coordinates->{$id}->{inverted} ) {
		$state ^= 1;
	}

	return $state;
}

sub unshutdown {

	if ( -e $shutdownfile ) {
		unlink($shutdownfile);

		for my $device ( keys %{$coordinates} ) {
			if ( exists $coordinates->{$device}->{default} ) {
				set_device( $device, $coordinates->{$device}->{default},
					force => 1 );
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
			  and $id !~ m{ _ (?: au | r o ) $}ox
			  and not $coordinates->{$id}->{user_readonly} ) ? 1 : 0;
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

		@dd_presets = map { { name => $_ } } (
			reverse sort {
				$presets->{$a}->{timestamp} <=> $presets->{$b}->{timestamp}
			} ( keys %{$presets} )
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
		when ('charwrite')    { $action = $type }
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

	if ( -e "public/images/${id}_on.png" and -e "public/images/${id}_off.png" )
	{
		$prefix = $id;
	}

	if ( $type ~~ [qw[phone printer server wifi]] ) {

		# unknown => off
		$suffix = '_off';
	}

	if ( defined $state and ( $state == 1 or $state == 255 ) ) {
		$suffix = '_on';
	}
	elsif ( defined $state and $state == 0 ) {
		$suffix = '_off';
	}

	if ( $type eq 'light_au' ) {
		$suffix .= ( -e "/tmp/automatic_${id}" ) ? '_auto' : '_noauto';
	}

	return "static/images/${prefix}${suffix}.png";
}

sub estimated_power_consumption {
	my $consumption = sum map { $coordinates->{$_}->{watts} // 0 }
	  grep { status_number($_) and status_number($_) > 0 } keys %{$coordinates};
	return $consumption // 0;
}

sub sprintf_wattage {
	my ($value) = @_;

	$value //= -1;

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

	my $power_p1 = slurp('/srv/www/flukso/30_p1') // -1;
	my $power_p2 = slurp('/srv/www/flukso/30_p2') // -1;
	my $power_p3 = slurp('/srv/www/flukso/30_p3') // -1;

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

	for my $h ( keys %{$coordinates} ) {
		if ( exists $coordinates->{$h}->{dorfmap}
			and device_status($h) == 0 )
		{
			my $prefix = $coordinates->{$h}->{dorfmap};
			$buf .= sprintf(
'<img style="float: left;" src="/static/images/warning.png" alt="!" /> %s is offline — '
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

sub json_blinkencontrol {
	my ($device) = @_;
	my $current_string = get_device( $device, text => 1 );
	my $bc_presets = load_blinkencontrol();

	$bc_presets->{blinkencontrol1}->{Off} = '32,0,0,0';

	my $current_name
	  = first { $bc_presets->{blinkencontrol1}->{$_} eq $current_string }
	keys %{ $bc_presets->{blinkencontrol1} };
	my $active_preset;

	if ($current_name) {
		$active_preset = {
			name       => $current_name,
			raw_string => $current_string,
		};
	}

	my @json_presets;

	for my $bc_preset ( sort keys %{ $bc_presets->{blinkencontrol1} } ) {
		my $string = $bc_presets->{blinkencontrol1}->{$bc_preset};
		$string =~ s{ \s+ $ }{}ox;
		push(
			@json_presets,
			{
				name       => $bc_preset,
				raw_string => $string,
			}
		);
	}

	return {
		active  => $active_preset,
		presets => \@json_presets,
		status  => get_device($device),
	};
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

sub status_number {
	my ($id) = @_;
	my $type = $coordinates->{$id}->{type};

	given ($type) {
		when ('door') {
			if ( -e '/srv/www/doorstatus' ) {
				return ( slurp('/srv/www/doorstatus') eq 'open' ? 1 : 0 );
			}
			return -1;
		}
		default { return device_status($id) }
	}

	return -1;
}

sub status_text {
	my ($location) = @_;

	my $type = $coordinates->{$location}->{type};

	if ( not $type ) {
		return $coordinates->{$location}->{text};
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
	return $coordinates->{$location}->{text};
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

#}}}

#{{{ Shortcuts

sub make_shortcuts {
	@dd_shortcuts = map { { name => $_ } } ( sort keys %{$shortcuts} );
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

		if ( $type eq 'blinkenlight' ) {
			my $path   = $remotemap->{$device};
			my $addrhi = int( $coordinates->{$device}->{address} / 255 );
			my $addrlo = $coordinates->{$device}->{address} % 255;

			spew( "${path}/commands",
				"0\n32\n0\n0\n0\n${addrhi}\n${addrlo}\npush\n" );

			if ( $path =~ m{donationprint}o ) {
				system('blinkencontrol-donationprint');
			}
			elsif ( $path =~ m{feedback}o ) {
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
			set_device( $device, 'blank', force => 1 );
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

helper statustext => sub {
	my ( $self, $type, $location ) = @_;

	return status_text($location);
};

#}}}

#{{{ Routes

get '/' => sub {
	my ($self) = @_;

	$self->render_static('index.html');
	return;
};

post '/action' => sub {
	my ($self) = @_;
	my $params = $self->req->json;

	if ( not exists $params->{action} ) {
		$params = $self->req->params->to_hash;
	}

	my ( $action, $device ) = @{$params}{qw{action device}};

	if ( not $action ) {
		$self->render(
			json   => { errors => ['the action argument is mandatory'] },
			status => 400,
		);
		return;
	}

	if ( $action ~~ [qw[off on toggle]] ) {
		my $id = $params->{device};
		if ( not $id or not exists $coordinates->{$id} ) {
			$self->render(
				json   => { errors => ['invalid device specified'] },
				status => 400,
			);
			return;
		}
	}

	given ($action) {
		when ('off') {
			my $id = $params->{device};
			if ( $coordinates->{$id}->{type} eq 'light_au' ) {
				if ( -e "/tmp/automatic_${id}" ) {
					unlink("/tmp/automatic_${id}");
				}
			}
			else {
				set_device( $id, 0 );
			}
			$self->render( json => json_status($id) );
		}
		when ('on') {
			my $id = $params->{device};
			if ( $coordinates->{$id}->{type} eq 'light_au' ) {
				spew( "/tmp/automatic_${id}", q{} );
			}
			else {
				unshutdown;
				set_device( $id, 1 );
			}
			$self->render( json => json_status($id) );
		}
		when ('preset') {
			my $preset = $params->{preset};

			load_presets();

			if ( not exists $presets->{$preset} ) {
				$self->render(
					json   => { errors => ['invalid preset requested'] },
					status => 400,
				);
				return;
			}

			$presets->{$preset}->{timestamp} = time();
			$presets->{$preset}->{usecount}++;
			save_presets();

			for my $id ( keys %{$coordinates} ) {
				if ( exists $presets->{$preset}->{$id}
					and $presets->{$preset}->{$id} != -1 )
				{
					set_device( $id, $presets->{$preset}->{$id} );
				}
			}
			$self->render(
				json   => {},
				status => 204
			);
		}
		when ('shortcut') {
			my $shortcut = $params->{shortcut};
			if ( not exists $shortcuts->{$shortcut} ) {
				$self->render(
					json   => { errors => ['invalid shortcut requested'] },
					status => 400,
				);
				return;
			}
			my @errors = &{ $shortcuts->{$shortcut} }($self);
			$self->render(
				json => { errors => \@errors },
			);
		}
		when ('toggle') {
			my $id = $params->{device};
			if ( $coordinates->{$id}->{type} eq 'light_au' ) {
				if ( -e "/tmp/automatic_${id}" ) {
					unlink("/tmp/automatic_${id}");
				}
				else {
					spew( "/tmp/automatic_${id}", q{} );
				}
			}
			else {
				unshutdown;
				my $state = get_device($id);
				set_device( $id, $state ^ 1 );
			}
			$self->render( json => json_status($id) );
		}
		default {
			$self->render(
				json   => { errors => ['invalid action requested'] },
				status => 400,
			);
		}
	}
	return;
};

get '/ajax/blinkencontrol' => sub {
	my ($self) = @_;
	my $device = $self->param('device');

	$self->render( json => json_blinkencontrol($device) );
};

post '/ajax/blinkencontrol' => sub {
	my ($self)      = @_;
	my $device      = $self->req->json->{device};
	my $raw_string  = $self->req->json->{raw_string};
	my $controlpath = $remotemap->{$device};

	my $ctext  = q{};
	my $id     = 0;
	my $addrhi = int( $coordinates->{$device}->{address} / 255 );
	my $addrlo = $coordinates->{$device}->{address} % 255;

	for my $part ( split( / /, $raw_string ) ) {
		my ( $speed, $red, $green, $blue ) = split( /,/, $part );
		$ctext
		  .= "${id}\n${speed}\n${red}\n${green}\n${blue}\n${addrhi}\n${addrlo}\npush\n";
		$id++;
	}

	spew( "${controlpath}/commands", $ctext );

	if ( $controlpath =~ m{donationprint}o ) {
		system('blinkencontrol-donationprint');
	}
	elsif ( $controlpath =~ m{feedback}o ) {
		system('blinkencontrol-feedback');
	}

	$self->render( json => json_blinkencontrol($device) );
};

get '/ajax/charwrite' => sub {
	my ($self) = @_;

	$self->render( json => \@charwrite_modes );
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

	load_presets();

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

		# TODO
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

	$self->render(
		'mobile-blinkencontrol',
		layout  => 'mobile',
		bc_data => json_blinkencontrol($device),
	);
};

post '/ajax/charwrite' => sub {
	my ($self) = @_;
	my $device = $self->req->json->{device};
	my $text   = $self->req->json->{text};

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

	my $text = $self->param('disptext');

	my $controlpath = $remotemap->{$device};

	if ( not $controlpath ) {

		# TODO
	}

	# see (1)
	if ( defined $text and $self->req->method eq 'GET' ) {
		set_device( $device, $text );
	}
	else {
		$self->param( disptext => ( slurp($controlpath) // 'clock' ) );
	}

	$self->render(
		'mobile-charwrite',
		layout => 'mobile',
		device => $device,
		modes  => \@charwrite_modes,
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
		any  => {
			data   => 'Not Acceptable. Only JSON is supported.',
			status => 406
		},
	);
	return;
};

get '/m' => sub {
	my ($self) = @_;

	my %areas;

	load_presets();

	for my $location ( keys %{$coordinates} ) {
		if (    $coordinates->{$location}->{type}
			and $coordinates->{$location}->{x1}
			+ $coordinates->{$location}->{y1} != 0
			and $coordinates->{$location}->{is_writable} )
		{
			my $area = $coordinates->{$location}->{area};
			if ($area) {
				push( @{ $areas{$area} }, $location );
			}
		}
	}

	for my $area ( keys %areas ) {
		@{ $areas{$area} } = sort @{ $areas{$area} };
	}

	$self->render(
		'mobile-main',
		layout      => 'mobile',
		version     => $VERSION,
		areas       => \%areas,
		coordinates => $coordinates,
		shortcuts   => \@dd_shortcuts,
		presets     => \@dd_presets,
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
		errors     => [],
		presetdata => $presets,
		presets    => \@dd_presets,
		toggles    => \@toggles,
	);

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
