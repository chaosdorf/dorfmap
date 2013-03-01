#!/usr/bin/env perl

use strict;
use warnings;
use 5.014;
use utf8;

use Encode qw(decode);
use File::Slurp qw(read_file);
use Mojolicious::Lite;
use Storable qw(retrieve);

our $VERSION = '0.00';
my $locations   = {};
my $coordinates = {};

sub slurp {
	my ($file) = @_;

	return read_file( $file, err_mode => 'quiet' );
}

sub gpio {
	my ($index) = @_;

	return "/sys/class/gpio/gpio${index}/value";
}

sub load_coordinates {
	my @lines = split( /\n/, slurp('coordinates') );

	for my $line (@lines) {
		my ( $id, $left, $top, $right, $bottom ) = split( /\s+/, $line );
		my $type;

		if ( not $id ) {
			next;
		}

		if ( $id =~ s{^([^:]+):}{}o ) {
			$type = $1;
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
}

sub overview {
	my ($self) = @_;

	$locations = retrieve('locations.db') // {};

	$self->render(
		'overview',
		version     => $VERSION,
		coordinates => $coordinates,
	);
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

sub light_ro {
	my ($light) = @_;
	my $state   = -1;
	my $image   = 'light.png';

	given ($light) {
		when ('logo')         { $state = slurp( gpio(11) ) }
		when ('outdoor')      { $state = slurp( gpio(17) ) }
		when ('schaufenster') { $state = slurp( gpio(7) ) }
	}

	given ($state) {
		when ('1') { $image = 'light_on.png' }
		when ('0') { $image = 'light_off.png' }
	}

	return sprintf( '<img src="%s" class="light ro %s" title="%s" />',
		$image, $light, $light );
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
		when ('light_ro') { return light_ro( $location, $location ) }
		when ( [qw[phone printer server wifi]] ) {
			return pingdevice( $type, $location, $location )
		}
	}

	return q{};
};

get '/' => \&overview;

app->config(
	hypnotoad => {
		listen   => ['http://127.0.0.1:8081'],
		pid_file => '/tmp/dorfmap.pid',
		workers  => 2,
	},
);
app->defaults( layout => 'default' );

load_coordinates();
app->start;
