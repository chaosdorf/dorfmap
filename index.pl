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

no if $] >= 5.018, warnings => 'experimental::smartmatch';

my $locations   = {};
my $coordinates = {};
my $gpiomap     = {};
my $presets     = {};
my $remotemap   = {};
my $shortcuts   = {};
my @remote_buffer;

my $shutdownfile  = '/tmp/is_shutdown';
my $powerdownfile = '/tmp/is_poweroff';
my $tsdir         = '/tmp/dorfmap-ts';

my $auto_prefix   = '/etc/automatic_light_control';
my $bgdata_prefix = '/srv/www/bgdata';

my @dd_layers = map { { name => $_ } } qw(control caution power);
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

sub door_set_private {
	system(qw(ssh -i /etc/dorfmap/private.key private@door));

	if ( $? != 0 ) {
		spew(
			'/tmp/dorfmap-err/door_set_private',
			"ssh private\@door returned $?"
		);
	}

	return;
}

sub set_remote {
	my ( $path, $value, %opt ) = @_;

	spew( $path, "${value}\n" );
	my ( $bus, $device )
	  = ( split( qr{ / }ox, $path ) )[ 2, 3 ];    # /tmp/$bus/$id

	if ( $opt{buffered} ) {
		if ( not( $bus ~~ \@remote_buffer ) ) {
			push( @remote_buffer, $bus );
		}
	}
	else {
		system( 'dorfmap_set_remote', $bus, $device );
	}
}

sub set_buffered_remotes {
	for my $bus (@remote_buffer) {
		system( 'dorfmap_set_remote', $bus );
	}
	@remote_buffer = ();
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

	if ( $coordinates->{$id}->{conflicts} and $value == 1 ) {
		for my $dev ( split( /,/, $coordinates->{$id}->{conflicts} ) ) {
			if ( get_device($dev) == 1 ) {
				set_device( $dev, 0 );
			}
		}
	}

	if ( $coordinates->{$id}->{psu} and $value == 1 ) {
		if ( get_device( $coordinates->{$id}->{psu} ) == 0 ) {
			set_device( $coordinates->{$id}->{psu}, 1, force => 1 );
		}
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
		set_remote( $remotemap->{$id}, $value, %opt );
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
		$state = q{};
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

	if ( $coordinates->{$id}->{inverted} ) {
		$state ^= 1;
	}

	return $state;
}

sub do_shutdown {
	my ($mode) = @_;
	my @errors;
	my @delayed;

	$mode //= 'full';

	spew( $shutdownfile, q{} );
	door_set_private();

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
		}
		elsif ( $type eq 'charwrite' ) {
			set_device( $device, 'blank', force => 1 );
		}
		elsif ( $mode eq 'full' or not $coordinates->{$device}{in_shutdown} ) {
			set_device(
				$device, 0,
				force    => 1,
				buffered => 1,
			);
		}
	}

	for my $device (@delayed) {
		set_device( $device, 0, force => 1 );
	}

	set_buffered_remotes();
	system('blinkencontrol-donationprint');
	system('blinkencontrol-feedback');

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
		elsif ( -e "/tmp/${controlpath}" ) {
			$remotemap->{$id} = "/tmp/${controlpath}";
		}

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

#{{{ Database helpers

sub update_blinkencontrol_db {
	my %opt  = @_;
	my $from = $opt{from_version};
	if ( not defined $from ) {
		die('update_blinkencontrol_db requires the from_version key');
	}

	my $old_db = load_blinkencontrol();
	my $new_db = {};

	if ( $from == 0 ) {
		for my $preset ( keys %{ $old_db->{blinkencontrol1} } ) {
			my $content = $old_db->{blinkencontrol1}->{$preset};
			$preset =~ tr{[0-9a-zA-Z]}{}cd;
			$content =~ s{ \s+ $ }{}ox;
			$new_db->{rgb}->{animation}->{$preset} = $content;
		}
		$new_db->{rgb}->{animation}->{Off} = '32,0,0,0';
		$new_db->{rgb}->{colours} = {
			red     => '8,255,0,0',
			yellow  => '8,255,255,0',
			green   => '8,0,255,0',
			cyan    => '8,0,255,255',
			blue    => '8,0,0,255',
			magenta => '8,255,0,255',
			white   => '8,255,255,255',
			black   => '8,0,0,0',
		};
		$new_db->{version} = 1;
	}
	save_blinkencontrol($new_db);
}

#}}}

#{{{ other helpers

sub device_actionlink {
	my ($id) = @_;
	my $type = $coordinates->{$id}->{type};

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
	my $image = $coordinates->{$id}->{image};

	if ( not $type ) {
		return;
	}

	my $state  = device_status($id);
	my $prefix = $image // $type;
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
		$suffix = (( -e "/tmp/automatic_${id}" ) ? '_auto' : '_noauto') . $suffix;
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

sub status_devices {
	my $devices = {};

	for my $id ( keys %{$coordinates} ) {
		my $type = $coordinates->{$id}->{type} // q{};
		my $name = $coordinates->{$id}->{name} // $id;
		if ( $coordinates->{$id}->{x1} == 0 and $coordinates->{$id}->{y1} == 0 )
		{
			next;
		}
		$devices->{$id}->{name}        = $name;
		$devices->{$id}->{x1}          = $coordinates->{$id}->{x1};
		$devices->{$id}->{y1}          = $coordinates->{$id}->{y1};
		$devices->{$id}->{x2}          = $coordinates->{$id}->{x2};
		$devices->{$id}->{y2}          = $coordinates->{$id}->{y2};
		$devices->{$id}->{type}        = $coordinates->{$id}->{type};
		$devices->{$id}->{is_writable} = $coordinates->{$id}->{is_writable};
		$devices->{$id}->{status}      = status_number($id);
		$devices->{$id}->{auto}        = ( -e "/tmp/automatic_${id}" ? 1 : 0 );
		$devices->{$id}->{area}        = $coordinates->{$id}->{area};
		$devices->{$id}->{layer}       = $coordinates->{$id}->{layer};
		$devices->{$id}->{duplicates}  = $coordinates->{$id}->{duplicates};
		$devices->{$id}->{status_text} = status_text($id, $name);
		$devices->{$id}->{rate_delay}  = get_ratelimit_delay($id);
		$devices->{$id}->{image} = device_image($id);    # used only by /m

		if ( $type eq 'charwrite' ) {
			$devices->{$id}->{charwrite_text} = get_device( $id, text => 1 );
		}
	}

	return $devices;
}

sub status_info {
	my $json = {};

	if ( slurp('/srv/www/doorstatus') eq 'open' ) {
		$json->{hackspace} = 'public';
	}
	elsif ( -e $shutdownfile ) {
		$json->{hackspace} = 'shutdown';
	}
	elsif ( slurp('/srv/www/doorstatus') eq 'closed' ) {
		$json->{hackspace} = 'private';
	}
	else {
		$json->{hackspace} = 'unknown';
	}

	$json->{powered_areas} = 0;
	for my $id ( keys %{$coordinates} ) {
		if ( $coordinates->{$id}{in_shutdown} and device_status($id) ) {
			$json->{powered_areas}++;
		}
	}

	# We use 0+something() to make sure all numbers are present in the JSON
	# file as numbers and not strings.

	if ( -e "${bgdata_prefix}/hosts_dynamic" ) {
		$json->{hosts}->{dynamic} = 0 + slurp("${bgdata_prefix}/hosts_dynamic");
		$json->{hosts}->{management}
		  = 0 + slurp("${bgdata_prefix}/hosts_management");
		$json->{hosts}->{total} = 0 + slurp("${bgdata_prefix}/hosts_total");
	}

	my $power_p1 = slurp('/srv/www/flukso/30_p1') // -1;
	my $power_p2 = slurp('/srv/www/flukso/30_p2') // -1;
	my $power_p3 = slurp('/srv/www/flukso/30_p3') // -1;
	my $power_tot = $power_p1 + $power_p2 + $power_p3;

	$json->{power}->{phase}->[0] = $power_p1 > 0  ? $power_p1  : undef;
	$json->{power}->{phase}->[1] = $power_p2 > 0  ? $power_p2  : undef;
	$json->{power}->{phase}->[2] = $power_p3 > 0  ? $power_p3  : undef;
	$json->{power}->{total}      = $power_tot > 0 ? $power_tot : undef;

	$json->{power}->{lights} = 0 + estimated_power_consumption();

	return $json;
}

sub json_blinkencontrol {
	my ($device) = @_;
	my $current_string = get_device( $device, text => 1 );
	my $bc_presets = load_blinkencontrol();

	if ( not $bc_presets->{version} ) {
		update_blinkencontrol_db( from_version => 0 );
		$bc_presets = load_blinkencontrol();
	}

	my $current_animation
	  = first { $bc_presets->{rgb}->{animation}->{$_} eq $current_string }
	keys %{ $bc_presets->{rgb}->{animation} };
	my $current_colour
	  = first { $bc_presets->{rgb}->{colours}->{$_} eq $current_string }
	keys %{ $bc_presets->{rgb}->{colours} };

	my $active;

	if ($current_animation) {
		$active = {
			name       => $current_animation,
			raw_string => $current_string,
			type       => 'animation',
		};
	}
	elsif ($current_colour) {
		$active = {
			name       => $current_colour,
			raw_string => $current_string,
			type       => 'color',
		};
	}

	my ( @json_animations, @json_colours );

	for my $bc_preset ( sort keys %{ $bc_presets->{rgb}->{animation} } ) {
		my $string = $bc_presets->{rgb}->{animation}->{$bc_preset};
		push(
			@json_animations,
			{
				name       => $bc_preset,
				raw_string => $string,
			}
		);
	}
	for my $bc_preset ( sort keys %{ $bc_presets->{rgb}->{colours} } ) {
		my $string = $bc_presets->{rgb}->{colours}->{$bc_preset};
		push(
			@json_colours,
			{
				name       => $bc_preset,
				raw_string => $string,
			}
		);
	}

	return {
		active  => $active,
		presets => \@json_animations,
		colors  => \@json_colours,
		status  => get_device($device),
	};
}

sub json_status {
	my ( $id, $embed ) = @_;
	
	my $type = $coordinates->{$id}->{type} // q{};
	my $name = $coordinates->{$id}->{name} // $id;

	my $ret = {
		auto 				=> ( -e "/tmp/automatic_${id}" ? 1 : 0 ),
		rate_delay  => get_ratelimit_delay($id),
		status      => status_number($id),
		status_text => status_text($id),
		info        => status_info(),
		image 			=> device_image($id),
		name				=> $name,
		x1					=> $coordinates->{$id}->{x1},
		y1					=> $coordinates->{$id}->{y1},
		x2					=> $coordinates->{$id}->{x2},
		y2					=> $coordinates->{$id}->{y2},
		is_writable => $coordinates->{$id}->{is_writable},
		area 				=> $coordinates->{$id}->{area},
		layer 			=> $coordinates->{$id}->{layer},
		duplicates 	=> $coordinates->{$id}->{duplicates},
		type 				=> $coordinates->{$id}->{type},
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
	my ($location, $name) = @_;

	my $type = $coordinates->{$location}->{type};

	if ( not $type ) {
		return $coordinates->{$location}->{text};
	}
	if ( $type eq 'light_au' ) {
		return $coordinates->{$location}->{text} . '<br/>'
		  . auto_text($location);
	}
	if ( $type eq 'server' or $type eq 'wifi' ) {
		return $name;
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

	door_set_private();
	return;
};

$shortcuts->{'power off'} = sub {
	my ($self) = @_;

	if ( -e $shutdownfile ) {
		for my $device ( keys %{$coordinates} ) {
			if ( $coordinates->{$device}{in_shutdown} ) {
				set_device( $device, 0, force => 1 );
			}
		}
	}

	return;
};

$shortcuts->{shutdown} = sub {
	my ($self) = @_;

	return do_shutdown('full');
};

$shortcuts->{'soft shutdown'} = sub {
	my ($self) = @_;

	return do_shutdown('soft');
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

# Entry point for legacy frontend
get '/' => sub {
	my ($self) = @_;

	$self->reply->static('index.html');
	return;
};

# Used by
# * angular frontend
# * legacy frontend
# * donationprint buttond (shutdown / unshutdown only)
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
				if ( not $coordinates->{$id}->{in_shutdown} ) {
					unshutdown;
				}
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
				if ( not $coordinates->{$id}->{in_shutdown} ) {
					unshutdown;
				}
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

get '/ajax/beamer.json' => sub {
	my ($self) = @_;
	my $device = $self->param('device');

	$self->render(
		json => [
			{
				name        => 'PON',
				description => 'Power On',
			},
			{
				name        => 'POF',
				description => 'Power Off',
			},
			{
				name        => 'IIS:HD1',
				description => 'HDMI',
			},
			{
				name        => 'IIS:HD2',
				description => 'Chromecast',
			},
			{
				name        => 'IIS:RG1',
				description => 'VGA',
			},
		]
	);
};

# Used by angular frontend. Returns all animations and the
# currently active one for a given device.
get '/ajax/blinkencontrol' => sub {
	my ($self) = @_;
	my $device = $self->param('device');

	$self->render( json => json_blinkencontrol($device) );
};

# Used by angular frontend. Sets an animation.
post '/ajax/blinkencontrol' => sub {
	my ($self) = @_;
	my $params = $self->req->json;

	my $uint8
	  = qr{ 2 (?: [0-4][0-9] | 5[0-5] ) | [0-1][0-9][0-9] | [0-9][0-9] | [0-9] }x;
	my $is_valid = qr{
		^
		(?:
			(?: $uint8 , ){3} $uint8
			\s
		)*
		(?: $uint8 , ){3} $uint8
		$
	}x;

	if ( not exists $params->{device} ) {
		$params = $self->req->params->to_hash;
	}

	my ( $delete, $device, $name, $raw_string )
	  = @{$params}{qw{delete device name raw_string}};
	my $controlpath = $remotemap->{$device};

	my $ctext  = q{};
	my $id     = 0;
	my $addrhi = int( $coordinates->{$device}->{address} / 255 );
	my $addrlo = $coordinates->{$device}->{address} % 255;

	if ( $name and $delete ) {
		my $bc_db = load_blinkencontrol();
		delete $bc_db->{rgb}->{animation}->{$name};
		save_blinkencontrol($bc_db);
		$self->render( json => json_blinkencontrol($device) );
		return;
	}

	if ( not $raw_string =~ $is_valid ) {
		$self->render( json => { errors => ['invalid raw_string specified'] } );
		return;
	}

	if ( $name and $raw_string and not $delete ) {
		my $bc_db = load_blinkencontrol();
		$bc_db->{rgb}->{animation}->{$name} = $raw_string;
		save_blinkencontrol($bc_db);
	}

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

# Used by angular forntend
get '/ajax/charwrite' => sub {
	my ($self) = @_;

	$self->render( json => \@charwrite_modes );
};

# Used by angular frontend
post '/ajax/charwrite' => sub {
	my ($self) = @_;
	my $params = $self->req->json;

	if ( not exists $params->{device} ) {
		$params = $self->req->params->to_hash;
	}

	my ( $device, $text ) = @{$params}{qw{device text}};

	if ( defined $text and defined $device ) {
		set_device( $device, $text );
	}

	$self->render(
		data   => q{},
		status => 204
	);
};

# Used by angular frontend
get '/ajax/menu' => sub {
	my ($self) = @_;

	load_presets();

	$self->render(
		json => [
			{
				name    => 'actions',
				entries => [ sort keys %{$shortcuts} ]
			},
			{
				name    => 'presets',
				entries => [ sort keys %{$presets} ]
			},
			{
				name    => 'layers',
				entries => [ map { $_->{name} } @dd_layers ]
			},
		]
	);
	return;
};

# Used by legacy frontend to show blinkencontrol animations.
get '/blinkencontrol/:device' => sub {
	my ($self) = @_;
	my $device = $self->stash('device');

	my $bc_presets  = load_blinkencontrol();
	my $controlpath = $remotemap->{$device};

	$self->render(
		'mobile-blinkencontrol',
		layout  => 'mobile',
		bc_data => json_blinkencontrol($device),
		device  => $device,
	);
};

# Used by legacy frontend to show the charwrite mode(s)
get '/charwrite/:device' => sub {
	my ($self) = @_;
	my $device = $self->stash('device');

	my $controlpath = $remotemap->{$device};

	if ( not $controlpath ) {

		# TODO
	}

	$self->render(
		'mobile-charwrite',
		layout   => 'mobile',
		device   => $device,
		disptext => ( slurp($controlpath) // 'clock' ),
		modes    => \@charwrite_modes,
	);
};

# Unused, but may be useful for external applications
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
		png => sub    { $self->reply->static( device_image($id) ) },
		any => {
			data   => status_number($id),
			status => 406
		},
	);

	return;
};

# Used by angular frontend and external applications (e.g. munin plugins)
# deprecated
get '/list/all' => sub {
	my ($self) = @_;

	$self->respond_to(
		json => { json => status_devices() },
		any  => {
			data   => 'Not Acceptable. Only JSON is supported.',
			status => 406
		},
	);
	return;
};

# Entry point for legacy frontend
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
		areas       => \%areas,
		coordinates => $coordinates,
		shortcuts   => \@dd_shortcuts,
		presets     => \@dd_presets,
	);

	return;
};

# Unused at the moment.
# TODO refactor for angular and legacy frontends
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

# Used by external applications
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
				url  => 'https://chaosdorf.de/~derf/cccd.ics',
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

get '/status/all' => sub {
	my ($self) = @_;

	$self->respond_to(
		json => {
			json => {
				devices => status_devices(),
				info    => status_info()
			}
		},
		any => {
			data   => 'not acceptables. use json',
			status => 406
		},
	);
};

get '/status/devices' => sub {
	my ($self) = @_;

	$self->respond_to(
		json => { json => status_devices() },
		any  => {
			data   => 'not acceptables. use json',
			status => 406
		},
	);
};

get '/status/info' => sub {
	my ($self) = @_;

	$self->respond_to(
		json => { json => status_info() },
		any  => {
			data   => 'not acceptables. use json',
			status => 406
		},
	);
};

options '*' => sub {
	my $self = shift;
	$self->res->headers->access_control_allow_origin('*');

	$self->respond_to(
		any => {
			data   => q{},
			status => 200
		}
	);
};

#}}}

# {{{ Hooks

hook before_render => sub {
	my ( $self, $args ) = @_;
	$self->res->headers->access_control_allow_origin('*');
	$self->res->headers->header( 'Access-Control-Allow-Methods' => 'POST' );
	$self->res->headers->header(
		'Access-Control-Allow-Headers' => 'Content-Type' );
};

# }}}

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
