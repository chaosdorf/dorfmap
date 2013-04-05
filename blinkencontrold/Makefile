CFLAGS = -pedantic -Wall -Wextra -O2
TARGETS = blinkencontrold

all: ${TARGETS}

%: %.c
	${CC} -o $@ ${CFLAGS} $<
	strip $@

clean:
	rm -f ${TARGETS}

.PHONY: all clean
