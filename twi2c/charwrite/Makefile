PREFIX = /usr/local
CFLAGS = -pedantic -Wall -Wextra -O2
TARGETS = twi2c-charwrite

all: ${TARGETS}

%: %.c
	${CC} -o $@ ${CFLAGS} $<
	strip $@

install: ${TARGETS}
	install -m 755 twi2c-charwrite ${PREFIX}/bin/twi2c-charwrite

clean:
	rm -f ${TARGETS}

.PHONY: all clean install
