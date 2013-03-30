#!/usr/bin/env perl

use strict;
use warnings;
use Module::Build;

Module::Build->new(

	build_requires => {
		'Test::Cmd' => 0,
		'Test::Compile' => 0,
		'Test::More' => 0,
		'Test::Pod' => 0,
	},
	dist_name => 'avrshiftd',
	dist_version_from => 'bin/avrshiftd',
	license => 'perl',
	requires => {
		'perl' => '5.10.0',
	},
	sign => 1,

)->create_build_script();
