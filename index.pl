#!/usr/bin/env perl

use strict;
use warnings;
use 5.014;
use utf8;

use Encode qw(decode);
use File::Slurp qw(read_file write_file);
use Mojolicious::Lite;
use Storable qw(retrieve);

our $VERSION = '0.00';
my $locations   = {};
my $coordinates = {};
my $gpiomap     = {};
my $shortcuts   = {};

my $shutdownfile = '/tmp/is_shutdown';

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

sub load_coordinates {
	my @lines = split( /\n/, slurp('coordinates') );

	for my $line (@lines) {
		my ( $id, $left, $top, $right, $bottom ) = split( /\s+/, $line );
		my ( $type, $gpio );

		if ( not $id ) {
			next;
		}

		if ( $id =~ s{ ^ ( [^ : ]+ ) : }{}ox ) {
			$type = $1;
		}
		if ( $id =~ s{ ^ ( [^ : ]+ ) : }{}ox ) {
			my $control = $1;
			if ( $control =~ m{ ^ gpio (\d+) $ }ox ) {
				$gpio = $1;
			}
		}

		if ($gpio) {
			$gpiomap->{$id} = gpio($gpio);
		}

		# image areas don't specify right and bottom and are usually 32x32px
		$right  //= $left + 32;
		$bottom //= $top + 32;

		$coordinates->{$id} = {
			x1   => $left,
			y1   => $top,
			x2   => $right - $left,
			y2   => $bottom - $top,
			type => $type
		};
	}
	return;
}

sub overview {
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
}

sub toggle {
	my ($self) = @_;
	my $id = $self->stash('id');

	unlink($shutdownfile);

	if ( exists $gpiomap->{$id} ) {
		my $state = slurp( $gpiomap->{$id} );
		chomp $state;
		spew( $gpiomap->{$id}, $state ^ 1 );
		$self->redirect_to('/');
	}
	else {
		$self->redirect_to('/?error=nosuchfile');
	}

	return;
}

sub action {
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
}

sub door_status {
	my $raw = slurp('/srv/www/door.status');
	chomp($raw);
	given ($raw) {
		when ('open')   { return 'open' }
		when ('closed') { return 'closed' }
		default         { return 'unknown' }
	}
}

sub light {
	my ( $light, $is_rw ) = @_;
	my $state = -1;
	my $image = 'light.png';

	if ( exists $gpiomap->{$light} ) {
		$state = slurp( $gpiomap->{$light} );
	}

	given ($state) {
		when ('1') { $image = 'light_on.png' }
		when ('0') { $image = 'light_off.png' }
	}

	my $ret = q{};

	if ($is_rw) {
		$ret .= sprintf( '<a href="/toggle/%s">', $light );
	}

	$ret .= sprintf( '<img src="%s" class="light ro %s" title="%s" />',
		$image, $light, $light );

	if ($is_rw) {
		$ret .= sprintf('</a>');
	}

	return $ret;
}

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

sub muninlink {
	my ( $plugin, $name ) = @_;

	return
	  sprintf(
'<a href="https://intern.chaosdorf.de/munin/chaosdorf.dn42/figurehead.chaosdorf.dn42/%s.html">%s</a>',
		$plugin, $name // $plugin );
}

sub sunrise {
	return slurp('/srv/www/sunrise');
}

sub sunset {
	return slurp('/srv/www/sunset');
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
		$image ? "<img src=\"$image\" />" : q{},
		$site, $name
	);
}

sub pingdevice {
	my ( $type, $host, $label ) = @_;
	my $image = "${type}_off.png";
	my $state = slurp("/srv/www/${host}.ping");

	if ( $state == 1 ) {
		$image = "${type}_on.png";
	}

	return sprintf( '<img src="%s" class="%s ro %s" title="%s" />',
		$image, $type, $host, $label );
}

helper statusclass => sub {
	my ( $self, $type, $location ) = @_;

	if ( $type eq 'door' ) {
		return door_status();
	}

	return q{};
};

helper statusimage => sub {
	my ( $self, $type, $location ) = @_;

	given ($type) {
		when ('light_ro') { return light( $location, 0 ) }
		when ('light')    { return light( $location, 1 ) }
		when ( [qw[phone printer server wifi]] ) {
			return pingdevice( $type, $location, $location )
		}
	}

	return q{};
};

$shortcuts->{freitag} = sub {
	my ($self) = @_;

	unlink($shutdownfile);

	spew( $gpiomap->{lightclc1160},    1 );
	spew( $gpiomap->{hackcenter_w},    1 );
	spew( $gpiomap->{hackcenter_blau}, 1 );

	return;
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
	}

	system(qw(ssh private@door));

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

get '/'           => \&overview;
get '/:action'    => \&action;
get '/toggle/:id' => \&toggle;

app->config(
	hypnotoad => {
		accept_interval => 0.2,
		listen          => ['http://127.0.0.1:8081'],
		pid_file        => '/tmp/dorfmap.pid',
		workers         => 2,
	},
);
app->defaults( layout => 'default' );

load_coordinates();
app->start;
