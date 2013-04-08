PREFIX = /usr/local
CFLAGS = -pedantic -Wall -Wextra -O2
TARGETS = si2c-bitwrite

all: ${TARGETS}

%: %.c
	${CC} -o $@ ${CFLAGS} $<
	strip $@

install: ${TARGETS}
	install -m 755 si2c-bitwrite ${PREFIX}/bin/si2c-bitwrite

clean:
	rm -f ${TARGETS}

.PHONY: all clean install
