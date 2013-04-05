PREFIX = /usr/local
CFLAGS = -pedantic -Wall -Wextra -O2
TARGETS = avrshiftd

all: ${TARGETS}

%: %.c
	${CC} -o $@ ${CFLAGS} $<
	strip $@

install: ${TARGETS}
	install -m 755 avrshiftd ${PREFIX}/bin/avrshiftd

clean:
	rm -f ${TARGETS}

.PHONY: all clean install
