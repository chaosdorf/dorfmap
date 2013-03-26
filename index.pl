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
use Storable qw(retrieve);

our $VERSION = qx{git describe --dirty} || '0.03';
my $locations   = {};
my $coordinates = {};
my $gpiomap     = {};
my $remotemap   = {};
my $shortcuts   = {};

my $automaticfile = '/tmp/automatic_light';
my $shutdownfile  = '/tmp/is_shutdown';

#{{{ primitive helpers

sub slurp {
	my ($file) = @_;

	return read_file( $file, err_mode => 'quiet' );
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

#}}}

sub load_coordinates {    #{{{
	my @lines = split( /\n/, slurp('coordinates') );

	for my $line (@lines) {
		my ( $id, $left, $top, $right, $bottom, @text ) = split( /\s+/, $line );
		my $type;

		if ( not $id ) {
			next;
		}

		if ( $id =~ s{ ^ ( [^ : ]+ ) : }{}ox ) {
			$type = $1;
		}
		if ( $id =~ s{ ^ ( [^ : ]+ ) : }{}ox ) {
			my $control = $1;
			if ( $control =~ m{ ^ gpio (\d+) $ }ox ) {
				$gpiomap->{$id} = gpio($1);
			}
			elsif ( $control =~ m{ ^ ( donationprint | feedback ) }ox ) {
				$remotemap->{$id} = "/tmp/${control}";
			}
		}

		# image areas don't specify right and bottom and are usually 32x32px
		$right  ||= $left + 32;
		$bottom ||= $top + 32;

		$coordinates->{$id} = {
			x1   => $left,
			y1   => $top,
			x2   => $right - $left,
			y2   => $bottom - $top,
			type => $type,
			text => decode( 'UTF-8', join( ' ', @text ) ),
		};
	}
	return;
}    #}}}

#{{{ other helpers

sub amp_image {
	my $image = 'amp.png';
	my $state = amp_status();

	if ( $state == 1 ) {
		$image = 'amp_on.png';
	}
	elsif ( $state == 0 ) {
		$image = 'amp_off.png';
	}

	return $image;
}

sub amp_status {
	return slurp('/srv/www/amp.status') // -1;
}

sub amp {
	return
	  sprintf(
		'<a href="/toggle/amp"><img src="/%s" class="%s" title="%s" /></a>',
		amp_image, 'amp', 'amp' );
}

sub infotext {
	my $buf;

	my $is_shutdown = ( -e '/tmp/is_shutdown' );

	$buf .= sprintf(
		'<span class="shutdown%s">Shutdown: %s</span><br/>',
		$is_shutdown ? 'yes' : 'no',
		$is_shutdown ? 'Yes' : 'No',
	);

	if ( $is_shutdown and slurp( $gpiomap->{outdoor} ) == 1 ) {
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

sub light_image {
	my ($light) = @_;
	my $state   = light_status($light);
	my $image   = 'light.png';
	my $suffix  = q{};

	if ( $coordinates->{$light}->{type} eq 'light_au' ) {
		$suffix = ( -e $automaticfile ) ? '_auto' : '_noauto';
	}

	given ($state) {
		when ('1') { $image = "light_on${suffix}.png" }
		when ('0') { $image = "light_off${suffix}.png" }
	}

	return $image;
}

sub light_status {
	my ($light) = @_;

	if ( exists $gpiomap->{$light} ) {
		return slurp( $gpiomap->{$light} ) // -1;
	}
	if ( exists $remotemap->{$light} ) {
		return slurp( $remotemap->{$light} ) // -1;
	}
	return -1;
}

sub light {
	my ( $light, $is_rw ) = @_;

	my $ret = q{};

	if ($is_rw) {
		$ret .= sprintf( '<a href="/toggle/%s">', $light );
	}

	$ret .= sprintf( '<img src="/%s" class="light ro %s" />',
		light_image($light), $light, $light );

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
	my $state = pingdevice_status($host);

	if ( $state == 1 ) {
		$image = "${type}_on.png";
	}

	return $image;
}

sub pingdevice_status {
	my ($host) = @_;

	return slurp("/srv/www/${host}.ping") || 0;
}

sub pingdevice {
	my ( $type, $host, $label ) = @_;

	return sprintf(
		'<img src="/%s" class="%s ro %s" title="%s" />',
		pingdevice_image( $type, $host ),
		$type, $host, $label
	);
}

sub status_number {
	my ($id) = @_;
	my $type = $coordinates->{$id}->{type};

	given ($type) {
		when ('amp') { return amp_status() }
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
		when ('amp') { return amp_image() }
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
		$now->offset / 3600,
		$now->is_dst );

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
		( -e $automaticfile ) ? q{} : '(Automatik deaktiviert)',
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
		$image ? "<img src=\"/$image\" />" : q{},
		$site, $name
	);
}

#}}}

#{{{ Shortcuts

$shortcuts->{makeprivate} = sub {
	my ($self) = @_;

	system(qw(ssh private@door));

	return $?;
};

$shortcuts->{shutdown} = sub {
	my ($self) = @_;
	my @errors;

	spew( $shutdownfile, q{} );

	for my $device ( keys %{$coordinates} ) {
		my $type = $coordinates->{$device}->{type};

		if ( $type eq 'printer' and slurp("/srv/www/${device}.png") == 1 ) {
			push( @errors, "please turn off printer ${device}" );
		}
		if ( $type eq 'light' and exists $gpiomap->{$device} ) {
			spew( $gpiomap->{$device}, 0 );
		}
		if ( exists $remotemap->{$device} ) {
			set_remote( $remotemap->{$device}, 0 );
		}
	}

	system(qw(ssh private@door));
	system('amp_off');

	if ( $? != 0 ) {
		push( @errors, "private\@door returned $?: $!" );
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

	return q{};
};

helper statusimage => sub {
	my ( $self, $type, $location ) = @_;

	given ($type) {
		when ('amp')      { return amp() }
		when ('light')    { return light( $location, 1 ) }
		when ('light_au') { return light( $location, 2 ) }
		when ('light_ro') { return light( $location, 0 ) }
		when ( [qw[phone printer server wifi]] ) {
			return pingdevice( $type, $location, $location )
		}
	}

	return q{};
};

helper statustext => sub {
	my ( $self, $type, $location ) = @_;

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

	if ( -e 'locations.db' ) {
		$locations = retrieve('locations.db');
	}

	$self->render(
		'overview',
		version     => $VERSION,
		coordinates => $coordinates,
		shortcuts   => [ sort keys %{$shortcuts} ],
		errors      => [],
	);
	return;
};

get '/action/:action' => sub {
	my ($self) = @_;
	my $action = $self->stash('action');
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
		);
	}
	else {
		$self->redirect_to('/');
	}
	return;
};

get '/get/:id' => sub {
	my ($self) = @_;
	my $id = $self->stash('id');

	$self->respond_to(
		json => { json => { status => status_number($id) } },
		txt  => { text => status_number($id) . "\n" },
		png => sub { $self->render_static( status_image($id) ) },
		any => {
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
		$devices->{$id}->{is_readable} = exists $gpiomap->{$id} ? 1 : 0;
		$devices->{$id}->{is_writable}
		  = ( exists $gpiomap->{$id} and $devices->{$id}->{type} !~ m{_ro$} )
		  ? 1
		  : 0;
		$devices->{$id}->{status} = status_number($id);
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

	my @readables = grep { exists $gpiomap->{$_} } keys %{$coordinates};

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

	my @writables
	  = grep { exists $gpiomap->{$_} and $coordinates->{$_}->{type} !~ m{_ro$} }
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

post '/set' => sub {
	my ($self) = @_;

	if ( $self->param('online_guests') ) {
		spew( '/tmp/online_guests', $self->param('online_guests') );
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
		if ( -e $automaticfile ) {
			unlink($automaticfile);
		}
		else {
			spew( $automaticfile, q{} );
		}
		if ( slurp( $gpiomap->{$id} ) == 0 ) {
			$self->redirect_to('/');
			return;
		}
	}
	else {
		unlink($shutdownfile);
	}

	if ( exists $gpiomap->{$id} ) {
		my $state = slurp( $gpiomap->{$id} );
		chomp $state;
		spew( $gpiomap->{$id}, $state ^ 1 );
		$self->redirect_to('/');
	}
	elsif ( exists $remotemap->{$id} ) {
		my $state = slurp( $remotemap->{$id} );
		chomp $state;
		set_remote( $remotemap->{$id}, $state ^ 1 );
		$self->redirect_to('/');
	}

	elsif ( $id eq 'amp' ) {
		my $state = slurp('/srv/www/amp.status');
		if ( $state == 1 ) {
			system('amp_off');
		}
		else {
			system('amp_on');
		}
		$self->redirect_to('/');
	}
	else {
		$self->redirect_to('/?error=nosuchfile');
	}

	return;
};

get '/off/:id' => sub {
	my ($self) = @_;
	my $id = $self->stash('id');

	if ( exists $gpiomap->{$id} ) {
		spew( $gpiomap->{$id}, 0 );
	}
	elsif ( exists $remotemap->{$id} ) {
		set_remote( $remotemap->{$id}, 0 );
	}

	$self->render(
		data   => q{},
		status => 204
	);
	return;
};

get '/on/:id' => sub {
	my ($self) = @_;
	my $id = $self->stash('id');

	if ( exists $gpiomap->{$id} ) {
		spew( $gpiomap->{$id}, 1 );
	}
	elsif ( exists $remotemap->{$id} ) {
		set_remote( $remotemap->{$id}, 1 );
	}

	$self->render(
		data   => q{},
		states => 204
	);
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
app->start;
