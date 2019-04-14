# dorfmap
[![David](https://img.shields.io/david/chaosdorf/dorfmap.svg?style=flat-square)](https://david-dm.org/chaosdorf/dorfmap)
[![Travis](https://img.shields.io/travis/chaosdorf/dorfmap/master.svg?style=flat-square)](https://travis-ci.org/chaosdorf/dorfmap)

# Setup

## Development setup

### Prerequisites

- perl (5.x)
- cpan (latest)
- nodejs (10.x)
- yarn (latest)

### Step by step

Setup your own dorfmap for local development.

1. Clone repository and pull submodules
``` bash
git clone git@github.com/chaosdorf/dorfmap.git
git submodule update --init
```
2. Create log dir and set permissions
``` bash
sudo mkdir -p /var/log/dorfmap
sudo chown $USER /var/log/dorfmap
```
3. Change into newly cloned repository
``` bash
cd dorfmap
```
4. Set dorfmap variables for development
``` bash
./backend/dorfmap-debug
````
5. Install perl dependencies
``` bash
cpan DateTime
cpan IO::Compress:Gzip
cpan Astro::Sunrise
cpan File::Slurp
cpan Mojolicious::Lite
cpan Mojolicious::Plugin::BrowserDetect
```

6. Install nodejs dependencies
``` bash
yarn
```

6. Start development server
``` bash
yarn dev:server
```