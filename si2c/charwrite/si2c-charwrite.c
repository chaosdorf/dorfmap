#include <err.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <inttypes.h>

#include "../semop/semctl.c"

/*
 * starting at 32
 */
static const uint8_t firstseg[] = {
	0x00, // space
	0x11, // !
	0x09, // "
	0x04, // #
	0x04, // $
	0x04, // %
	0x04, // &
	0x08, // `
	0x04, // (
	0x04, // )
	0x04, // *
	0x04, // +
	0x10, // ,
	0x04, // -
	0x10, // .
	0x85, // /
	0xeb, // 0
	0x21, // 1
	0xc7, // 2
	0x67, // 3
	0x2d, // 4
	0x6e, // 5
	0xee, // 6
	0x23, // 7
	0xef, // 8
	0x6f, // 9
	0x04, // :
	0x04, // ;
	0x04, // <
	0x44, // =
	0x04, // >
	0x04, // ?
	0x04, // @
	0xaf, // A
	0xec, // B
	0xca, // C
	0xe5, // D
	0xce, // E
	0x8e, // F
	0xea, // G
	0xac, // h
	0x21, // I
	0xe1, // J
	0xcc, // k
	0xc8, // L
	0xa6, // m
	0xa4, // n
	0xe4, // o
	0x8f, // P
	0x2f, // q
	0x84, // r
	0x6e, // S
	0xcc, // t
	0xe9, // U
	0xe0, // v
	0xe2, // w
	0xac, // X
	0x2d, // y
	0xc7, // z
};

char sdastr[64];
char sclstr[64];

void writepin(char *pinstr, char val)
{
	FILE *fh;

	fh = fopen(pinstr, "w");
	fprintf(fh, "%d\n", val);
	fclose(fh);
	usleep(250);
}

static void writebyte(unsigned char byte)
{
	signed char i;
	for (i = 7; i >= 0; i--) {
		writepin(sdastr, 0);
		writepin(sclstr, 0);
		writepin(sdastr, (byte & (1 << i)) ? 1 : 0);
		writepin(sclstr, 1);
	}
}

static unsigned char fixup(unsigned char byte)
{
	return (
			((byte & 0x01) << 6) |
			((byte & 0x02) << 6) |
			((byte & 0x04) >> 1) |
			((byte & 0x08) >> 1) |
			((byte & 0x10) >> 4) |
			((byte & 0x20) << 0) |
			((byte & 0x40) >> 2) |
			((byte & 0x80) >> 4)
	);
}

int main(int argc, char **argv)
{
	int input;
	unsigned char charoffset = 0;
	unsigned char buf[48];
	unsigned char hasdot[48];

	unsigned int sdapin = 0, sclpin = 0, addrhi = 0, addrlo = 0, i;

	if (argc < 2)
		errx(1, "usage: si2c-charwrite <sdapin> <sclpin>");

	sdapin = atoi(argv[1]);
	sclpin = atoi(argv[2]);
	addrhi = atoi(argv[3]);
	addrlo = atoi(argv[4]);

	snprintf(sdastr, 64, "/sys/class/gpio/gpio%d/value", sdapin);
	snprintf(sclstr, 64, "/sys/class/gpio/gpio%d/value", sclpin);

	for (i = 0; i < sizeof(hasdot); i++)
		hasdot[i] = 0;

	sem_init(12);

	while ((input = getc(stdin)) != EOF) {
		if (input == '\n') {
			for (i = charoffset; i < sizeof(buf); i++) {
				buf[i] = buf[i - charoffset];
				hasdot[i] = hasdot[i - charoffset];
			}

			for (i = 0; i < sizeof(buf); i++)
				writebyte(fixup(firstseg[buf[i]] | hasdot[i]));

			writebyte(addrhi);
			writebyte(addrlo);
			writepin(sdastr, 1);
			writepin(sclstr, 0);
			writepin(sdastr, 0);
			charoffset = 0;

			sem_leave();

			for (i = 0; i < sizeof(hasdot); i++)
				hasdot[i] = 0;

		}
		else if (input >= 0x20) {

			if (input == '.' && charoffset && buf[charoffset - 1] != '.') {
				hasdot[charoffset - 1] = 0x10;
			}
			else {

				if (input > 0x5a)
					input -= 32;
				if (input > 0x5a)
					input = 0x20;

				input -= 0x20;

				buf[charoffset] = input;
				charoffset = (charoffset + 1) % sizeof(buf);
			}

		}
	}
	return 0;
}
