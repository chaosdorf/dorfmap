#include <err.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

#define BUFSIZE 64

void writepin(char *pinstr, char val)
{
	FILE *fh;

	fh = fopen(pinstr, "w");
	fprintf(fh, "%d\n", val);
	fclose(fh);
	usleep(1);
}

int main(int argc, char **argv)
{
	char line[BUFSIZE];
	signed char i;
	short int number;

	int sdapin = 0, sclpin = 0;
	char sdastr[64];
	char sclstr[64];

	if (argc < 2)
		errx(1, "usage: blinkenconrold <sdapin> <sclpin>");

	sdapin = atoi(argv[1]);
	sclpin = atoi(argv[2]);

	snprintf(sdastr, 64, "/sys/class/gpio/gpio%d/value", sdapin);
	snprintf(sclstr, 64, "/sys/class/gpio/gpio%d/value", sclpin);

	while (fgets(line, BUFSIZE, stdin) != NULL) {
		if (sscanf(line, "%hi\n", &number) == 1) {
			if ((number >= 0) && (number <= 255)) {
				for (i = 7; i >= 0; i--) {
					writepin(sdastr, 0);
					writepin(sclstr, 0);
					writepin(sdastr, (number & (1 << i)) ? 1 : 0);
					writepin(sclstr, 1);
				}
			}
		}
		if (strcmp(line, "push\n") == 0) {
			writepin(sdastr, 1);
			writepin(sclstr, 0);
			writepin(sdastr, 0);
		}
	}
	writepin(sdastr, 1);
	writepin(sclstr, 0);
	writepin(sdastr, 0);
	return 0;
}
