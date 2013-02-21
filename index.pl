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

helper light_ro => sub {
	my ($self, $light) = @_;

	my $state = 0;

	return sprintf('<img src="light_%s.png" class="light ro %s" title="%s" />',
		$state ? 'on' : 'off',
		$light, $light
	);
};

helper wikilink => sub {
	my ($self, $site) = @_;
	my $name = $site;
	my $image = undef;

	if ($name =~ s{ ^ Host : }{}ox) {
		$image = 'host.png';
	}

	return sprintf('%s<a href="https://wiki.chaosdorf.de/%s">%s</a>',
		$image ? "<img src=\"$image\" />" : q{},
		$site, $name);
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

app->start;
