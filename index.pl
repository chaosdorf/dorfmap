#!/usr/bin/env perl

use strict;
use warnings;
use 5.014;
use utf8;

use Mojolicious::Lite;

our $VERSION = '0.00';

sub overview {
	my ($self) = @_;

	$self->render(
		'overview',
		version => $VERSION,
		door    => { status => 'closed' },
		outdoor => { light_door => 1, },
	);
	return;
}

get '/' => \&overview;

app->config(
	hypnotoad => {
		listen   => ['http://127.0.0.1:8081'],
		pid_file => '/tmp/dorfmap.pid',
		workers  => 2,
	},
);
app->defaults( layout => 'default' );

app->start;
