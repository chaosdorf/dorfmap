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
use Mojolicious::Lite;
use Storable qw(retrieve lock_nstore lock_retrieve);

our $VERSION = qx{git describe --dirty} || '0.03';
my $locations   = {};
my $coordinates = {};
my $gpiomap     = {};
my $presets     = {};
my $remotemap   = {};
my $shortcuts   = {};

my $shutdownfile = '/tmp/is_shutdown';
my $tsdir        = '/tmp/dorfmap-ts';

my @layers = qw(control caution wiki);
my @sortedpresets;

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

sub set_remote {
	my ( $path, $value ) = @_;

	spew( $path, "${value}\n" );
	if ( $path =~ m{ donationprint }x ) {
		system('avrshift-donationprint');
	}
	elsif ( $path =~ m{ feedback }x ) {
		system('avrshift-feedback');
	}
}

sub set_device {
	my ( $id, $value, $force ) = @_;

	if ( not -e $tsdir ) {
		mkdir($tsdir);
	}

	spew( "${tsdir}/${id}", $value );

	if ( exists $gpiomap->{$id} ) {
		spew( $gpiomap->{$id}, $value );
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
	my ($id) = @_;
	my $state = -1;

	if ( exists $gpiomap->{$id} ) {
		$state = slurp( $gpiomap->{$id} );
	}
	elsif ( exists $remotemap->{$id} ) {
		$state = slurp( $remotemap->{$id} );
	}
	elsif ( $id =~ m{^amp} ) {
		$id =~ s{ [ab] $ }{}ox;
		$state = slurp("/srv/www/${id}.status");
	}

	return $state;
}

#}}}

sub load_coordinates {    #{{{
	my $ccontent = slurp('coordinates');
	$ccontent =~ s{\\\n}{}gs;
	my @lines = split( /\n/, $ccontent );

	my %section;

	for my $line (@lines) {

		if ($line =~ s{ ^ \[ (.*) \] $ }{$1}ox) {
			%section = ();
			for my $elem (split(/\s+/, $line)) {
				my ($key, $value) = split(/=/, $elem);
				$section{$key} = $value;
			}
			next;
		}

		my ( $id, $left, $top, $right, $bottom, $controlpath, @rest )
		  = split( /\s+/, $line );
		my @text;
		my $type;

		if ( not $id or $id =~ m{^#}o ) {
			next;
		}

		# image areas don't specify right and bottom and are usually 32x32px
		$right  ||= $left + 32;
		$bottom ||= $top + 32;

		$coordinates->{$id} = {
			x1   => $left,
			y1   => $top,
			x2   => $right - $left,
			y2   => $bottom - $top,
			path => $controlpath,
		};

		for my $key (keys %section) {
			$coordinates->{$id}->{$key} = $section{$key};
		}

		for my $elem (@rest) {
			if ( $elem =~ m{ ^ (?<key> [^=]+ ) = (?<value> .+ ) $ }ox ) {
				$coordinates->{$id}->{ $+{key} } = $+{value};
			}
			else {
				push( @text, $elem );
			}
		}

		$coordinates->{$id}->{text} = decode( 'UTF-8', join( q{ }, @text ) );

		$controlpath //= q{};
		if ( $controlpath =~ m{ ^ gpio (\d+) $ }ox ) {
			$gpiomap->{$id} = gpio($1);
		}
		elsif ( $controlpath =~ m{ ^ ( donationprint | feedback ) }ox ) {
			$remotemap->{$id} = "/tmp/${controlpath}";
		}
	}
	return;
}    #}}}

#{{{ presets

sub load_presets {
	if ( -e 'presets.db' ) {
		$presets = lock_retrieve('presets.db');

		@sortedpresets = reverse
		  sort { $presets->{$a}->{timestamp} <=> $presets->{$b}->{timestamp} }
		  ( keys %{$presets} );
	}

	return;
}

sub save_presets {
	lock_nstore( $presets, 'presets.db' );

	return;
}

#}}}

#{{{ other helpers

sub amp_image {
	my ($id) = @_;

	$id =~ s{ [ab] $ }{}ox;

	my $image = 'amp.png';
	my $state = amp_status($id);

	if ( $state == 1 ) {
		$image = 'amp_on.png';
	}
	elsif ( $state == 0 ) {
		$image = 'amp_off.png';
	}

	return $image;
}

sub amp_status {
	my ($id) = @_;

	$id =~ s{ [ab] $ }{}ox;

	return slurp("/srv/www/${id}.status") // -1;
}

sub amp {
	my ($id) = @_;

	$id =~ s{ [ab] $ }{}ox;

	return
	  sprintf(
'<a href="/toggle/%s"><img src="/%s" class="%s" title="%s" alt="amp" /></a>',
		$id, amp_image($id), 'amp', 'amp' );
}

sub blinkenlight {
	my ($light) = @_;

	my $ret = sprintf( '<a href="/blinkencontrol/%s">', $light );

	$ret
	  .= sprintf(
		'<img src="/blinkenlight.png" class="blinklight %s" alt="%s" />',
		$light, $light );

	$ret .= '</a>';

	return $ret;
}

sub blinkenlight_status {
	my ($light) = @_;

	if ( exists $remotemap->{$light} ) {
		return 'rgb('
		  . join( ',',
			map { slurp( $remotemap->{$light} . "/$_" ) } (qw(red green blue)) )
		  . ')';
	}
	return -1;
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

	if ( -e '/tmp/online_guests' ) {
		$buf .= sprintf(
			'<span class="onlinegueststext">Online guest IPs</span>'
			  . '<span class="onlineguests">%d</span><br/>',
			slurp('/tmp/online_guests')
		);
	}

	return $buf;
}

sub json_status {
	my ($id) = @_;

	my @opmodes
	  = (
		qw(steady blinkrgb blinkrand blinkonoff fadeonoff fadergb faderand undef)
	  );

	if ( $coordinates->{$id}->{type} eq 'blinkenlight' ) {
		my $controlpath = $remotemap->{$id};
		my $red         = slurp("${controlpath}/red") // 0;
		my $green       = slurp("${controlpath}/green") // 0;
		my $blue        = slurp("${controlpath}/blue") // 0;
		my $mode        = slurp("${controlpath}/mode") // 0;

		my $speed = 31 - ( $mode & 0x1f );
		my $opmode = $opmodes[ ( $mode & 0xe0 ) >> 5 ];

		return {
			red    => $red,
			green  => $green,
			blue   => $blue,
			opmode => $opmode,
			speed  => $speed
		};
	}

	return { status => status_number($id) };
}

sub light_image {
	my ($light) = @_;
	my $state   = light_status($light);
	my $image   = 'light.png';
	my $prefix  = 'light';
	my $suffix  = q{};

	if ( $coordinates->{$light}->{type} eq 'light_au' ) {
		$suffix = ( -e "/tmp/automatic_${light}" ) ? '_auto' : '_noauto';
	}

	if ( -e "public/${light}_on.png" and -e "public/${light}_off.png" ) {
		$prefix = $light;
	}

	given ($state) {
		when ('1') { $image = "${prefix}_on${suffix}.png" }
		when ('0') { $image = "${prefix}_off${suffix}.png" }
	}

	return $image;
}

sub light_status {
	my ($light) = @_;

	return get_device($light);
}

sub light {
	my ( $light, $is_rw ) = @_;

	my $ret = q{};

	if ($is_rw) {
		$ret .= sprintf( '<a href="/toggle/%s">', $light );
	}

	$ret .= sprintf( '<img src="/%s" class="light ro %s" alt="%s" />',
		light_image($light), $light, $light, $light );

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

sub pingdevice_image {
	my ( $type, $host ) = @_;
	my $image = "${type}_off.png";
	my $state = pingdevice_status($host) // -1;

	if ( $state == 1 ) {
		$image = "${type}_on.png";
	}

	return $image;
}

sub pingdevice_status {
	my ($host) = @_;

	if ( exists $gpiomap->{$host} ) {
		return slurp( $gpiomap->{$host} );
	}
	if ( exists $remotemap->{$host} ) {
		return slurp( $remotemap->{$host} );
	}
	return slurp("/srv/www/${host}.ping") || 0;
}

sub pingdevice {
	my ( $type, $host, $label ) = @_;

	if ( exists $gpiomap->{$host} or exists $remotemap->{$host} ) {
		return sprintf(
'<a href="/on/%s"><img src="/%s" class="%s ro %s" title="%s" alt="%s" /></a>',
			$host, pingdevice_image( $type, $host ),
			$type, $host, $label, $host
		);
	}
	else {
		return sprintf(
			'<img src="/%s" class="%s ro %s" title="%s" alt="%s" />',
			pingdevice_image( $type, $host ),
			$type, $host, $label, $host,
		);
	}

}

sub status_number {
	my ($id) = @_;
	my $type = $coordinates->{$id}->{type};

	given ($type) {
		when ('amp')          { return amp_status($id) }
		when ('blinkenlight') { return blinkenlight_status($id) }
		when ('door') {
			return ( slurp('/srv/www/doorstatus') eq 'open' ? 1 : 0 )
		}
		when ( [qw[light light_au light_ro]] ) { return light_status($id) }
		when ( [qw[phone printer server wifi]] ) {
			return pingdevice_status($id)
		}
	}

	return -1;
}

sub status_image {
	my ($id) = @_;
	my $type = $coordinates->{$id}->{type};

	given ($type) {
		when ('amp') { return amp_image($id) }
		when ( [qw[light light_au light_ro]] ) { return light_image($id) }
		when ( [qw[phone printer server wifi]] ) {
			return pingdevice_image( $type, $id )
		}
	}

	return q{};
}

sub sunrisetext {

	my $now = DateTime->now( time_zone => 'Europe/Berlin' );
	my $delta = DateTime::Duration->new( minutes => 20 );

	my ( $rise_str, $set_str )
	  = sunrise( $now->year, $now->month, $now->day, 6.47, 51.14,
		$now->offset / 3600, 0 );

	my ( $rise_h, $rise_m ) = ( $rise_str =~ m{(..):(..)} );
	my ( $set_h,  $set_m )  = ( $set_str  =~ m{(..):(..)} );

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
		'Aktiv von %s bis %s %s',
		$sunset->hms, $sunrise->hms,
		( -e '/tmp/automatic_outdoor' ) ? q{} : '(Automatik deaktiviert)',
	);

}

sub wikilink {
	my ($site) = @_;
	my $name   = $site;
	my $image  = undef;

	if ( $name =~ s{ ^ Host : }{}ox ) {
		$image = 'host.png';
	}

	return sprintf(
		'%s<a href="https://wiki.chaosdorf.de/%s">%s</a>',
		$image ? "<img src=\"/$image\" alt=\"wl\" />" : q{},
		$site, $name
	);
}

#}}}

#{{{ Shortcuts

$shortcuts->{'amps on'} = sub {
	my ($self) = @_;

	unlink($shutdownfile);
	for my $amp (qw(amp0 amp1 amp2 amp3)) {
		set_device( $amp, 1, 0 );
	}

	return;
};

$shortcuts->{'amps off'} = sub {
	my ($self) = @_;

	for my $amp (qw(amp0 amp1 amp2 amp3)) {
		set_device( $amp, 0, 0 );
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

	system('shutdown-announce');

	spew( $shutdownfile, q{} );

	for my $device ( keys %{$coordinates} ) {
		my $type = $coordinates->{$device}->{type};

		if ( $type eq 'blinkenlight' ) {
			my $path = $remotemap->{$device};
			spew( "${path}/mode",  "0\n" );
			spew( "${path}/red",   "0\n" );
			spew( "${path}/green", "0\n" );
			spew( "${path}/blue",  "0\n" );
			system('blinkencontrol-donationprint');
		}
		elsif ( $type eq 'printer'
			and slurp("/srv/www/${device}.ping") == 1
			and not set_device( $device, 0, 1 ) )
		{
			push( @errors, "please turn off printer ${device}" );
		}
		else {
			set_device( $device, 0, 1 );
		}
	}

	system(qw(ssh private@door));

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

	unlink($shutdownfile);

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

helper statusimage => sub {
	my ( $self, $type, $location ) = @_;

	given ($type) {
		when ('amp')          { return amp($location) }
		when ('blinkenlight') { return blinkenlight($location) }
		when ('light')        { return light( $location, 1 ) }
		when ('light_au')     { return light( $location, 2 ) }
		when ('light_ro')     { return light( $location, 0 ) }
		when ( [qw[phone printer server wifi]] ) {
			return pingdevice( $type, $location, $location )
		}
	}

	return q{};
};

helper statustext => sub {
	my ( $self, $type, $location ) = @_;

	if ( $type eq 'rtext' ) {
		return slurp("/tmp/${location}");
	}
	if ( $type eq 'infoarea' ) {
		return infotext();
	}
	if ( $location eq 'outdoor' ) {
		return $coordinates->{$location}->{text} . '<br/>' . sunrisetext();
	}
	return $coordinates->{$location}->{text};
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
		'overview',
		version     => $VERSION,
		coordinates => $coordinates,
		shortcuts   => [ sort keys %{$shortcuts} ],
		errors      => [ $self->param('error') || () ],
		presets     => \@sortedpresets,
		refresh     => 1,
		layer       => $layer,
		layers      => \@layers,
	);
	return;
};

get '/action/:action' => sub {
	my ($self) = @_;
	my $action = $self->stash('action');
	my $layer = $self->param('layer') // 'control';
	my @errors = ('no such action');

	if ( exists $shortcuts->{$action} ) {
		@errors = &{ $shortcuts->{$action} }($self);
	}

	if (@errors) {
		$self->render(
			'overview',
			version     => $VERSION,
			coordinates => $coordinates,
			shortcuts   => [ sort keys %{$shortcuts} ],
			errors      => \@errors,
			presets     => \@sortedpresets,
			refresh     => 0,
			layer       => $layer,
			layers      => \@layers,
		);
	}
	else {
		$self->redirect_to('/');
	}
	return;
};

get '/blinkencontrol/:device' => sub {
	my ($self) = @_;
	my $device = $self->stash('device');
	my $layer = $self->param('layer') // 'control';

	my $red     = $self->param('red');
	my $green   = $self->param('green');
	my $blue    = $self->param('blue');
	my $speed   = $self->param('speed');
	my $opmode  = $self->param('opmode');
	my $rawmode = 0;
	my $refresh = 1;

	my $controlpath = $remotemap->{$device};

	my @opmodes
	  = (
		qw(steady blinkrgb blinkrand blinkonoff fadetosteady fadergb faderand fadeonoff)
	  );

	if ($opmode) {
		for my $i ( 0 .. $#opmodes ) {
			if ( $opmode eq $opmodes[$i] ) {
				$rawmode = $i << 5;
				last;
			}
		}
	}

	if ( defined $speed ) {
		$rawmode |= ( 31 - $speed );
	}

	if ( not $controlpath ) {
		$self->render(
			'overview',
			version     => $VERSION,
			coordinates => $coordinates,
			shortcuts   => [ sort keys %{$shortcuts} ],
			errors      => ['no such device'],
			presets     => \@sortedpresets,
			refresh     => 0,
			layer       => $layer,
			layers      => \@layers,
		);
		return;
	}

	if ( defined $red and defined $green and defined $blue and defined $opmode )
	{
		spew( "${controlpath}/mode",  "${rawmode}\n" );
		spew( "${controlpath}/red",   "${red}\n" );
		spew( "${controlpath}/green", "${green}\n" );
		spew( "${controlpath}/blue",  "${blue}\n" );
		if ( $controlpath =~ m{ donationprint }ox ) {
			system('blinkencontrol-donationprint');
		}
		$refresh = 0;
	}
	else {
		my $mode = slurp("${controlpath}/mode") // 0;

		$self->param( red   => slurp("${controlpath}/red")   // 0 );
		$self->param( green => slurp("${controlpath}/green") // 0 );
		$self->param( blue  => slurp("${controlpath}/blue")  // 0 );
		$self->param( speed => 31 - ( $mode & 0x1f ) );
		$self->param( opmode => $opmodes[ ( $mode & 0xe0 ) >> 5 ] );
	}

	$self->respond_to(
		any => {
			template    => 'blinkencontrol',
			coordinates => {},
			device      => $device,
			errors      => [],
			version     => $VERSION,
			refresh     => $refresh,
		},
		json => {
			json => {
				red    => $self->param('red'),
				green  => $self->param('green'),
				blue   => $self->param('blue'),
				speed  => $self->param('speed'),
				opmode => $self->param('opmode'),
			}
		},
	);
};

get '/get/:id' => sub {
	my ($self) = @_;
	my $id = $self->stash('id');

	$self->respond_to(
		json => { json => json_status($id) },
		txt  => { text => status_number($id) . "\n" },
		png  => sub    { $self->render_static( status_image($id) ) },
		any  => {
			data   => status_number($id),
			status => 406
		},
	);

	return;
};

get '/list/all' => sub {
	my ($self) = @_;
	my $devices = {};

	for my $id ( keys %{$coordinates} ) {
		$devices->{$id}->{type} = $coordinates->{$id}->{type};
		$devices->{$id}->{is_readable}
		  = ( $coordinates->{$id}->{path} ne 'none' ) ? 1 : 0;
		$devices->{$id}->{is_writable}
		  = (     $coordinates->{$id}->{path} ne 'none'
			  and $id !~ m{ _ (?: au | r o ) $}ox )
		  ? 1
		  : 0;
		$devices->{$id}->{status} = status_number($id);
		$devices->{$id}->{desc}   = $coordinates->{$id}->{text};
		$devices->{$id}->{area}   = $coordinates->{$id}->{area};
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
						  {qw[type status is_readables is_writable]} )
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

	if ( $save and length($name) ) {
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

	if ( $action eq 'delete' and $name ) {
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
			push( @toggles, $id );
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
		coordinates => {},
		errors      => [],
		presetdata  => $presets,
		presets     => \@sortedpresets,
		toggles     => \@toggles,
		version     => $VERSION,
		refresh     => 0,
	);

	return;
};

get '/presets/apply/:name' => sub {
	my ($self) = @_;
	my $name = $self->stash('name');

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
			set_device( $id, $presets->{$name}->{$id}, 0 );
		}
	}

	$self->redirect_to('/');
	return;
};

post '/set' => sub {
	my ($self) = @_;

	for my $key ( keys %{$coordinates} ) {
		if ( ( $coordinates->{$key}->{type} // q{} ) eq 'rtext'
			and $self->param($key) )
		{
			spew( "/tmp/${key}", $self->param($key) );
		}
	}

	$self->render(
		data   => q{},
		status => 204
	);
};

get '/toggle/:id' => sub {
	my ($self) = @_;
	my $id = $self->stash('id');

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
		unlink($shutdownfile);
	}

	my $state = get_device($id);
	if ( set_device( $id, $state ^ 1, 0 ) ) {
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

	set_device( $id, 0, 0 );

	$self->render(
		data   => q{},
		status => 204
	);
	return;
};

get '/on/:id' => sub {
	my ($self) = @_;
	my $id = $self->stash('id');

	unlink($shutdownfile);
	set_device( $id, 1, 0 );

	$self->redirect_to('/');
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

load_coordinates();
app->types->type( txt  => 'text/plain; charset=utf-8' );
app->types->type( json => 'application/json; charset=utf-8' );
app->start;
