PREFIX = /usr/local
CFLAGS = -pedantic -Wall -Wextra -O2
TARGETS = si2c-bytewrite

all: ${TARGETS}

%: %.c
	${CC} -o $@ ${CFLAGS} $<
	strip $@

install: ${TARGETS}
	install -m 755 si2c-bytewrite ${PREFIX}/bin/si2c-bytewrite

clean:
	rm -f ${TARGETS}

.PHONY: all clean install
