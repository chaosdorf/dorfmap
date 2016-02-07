PREFIX = /usr/local
CFLAGS = -pedantic -Wall -Wextra -O2
TARGETS = si2c-charwrite

all: ${TARGETS}

%: %.c
	${CC} -o $@ ${CFLAGS} $<
	strip $@

install: ${TARGETS}
	install -m 755 si2c-charwrite ${PREFIX}/bin/si2c-charwrite

clean:
	rm -f ${TARGETS}

.PHONY: all clean install
