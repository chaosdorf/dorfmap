#include <err.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

#include "../semop/semctl.c"

#define BUFSIZE 64

char sdastr[64];
char sclstr[64];

void writepin(char *pinstr, char val)
{
	FILE *fh;

	printf(">>> %s %d\n", pinstr, val);

	fh = fopen(pinstr, "w");
	fprintf(fh, "%d\n", val);
	fclose(fh);
	usleep(1);
}

void push_data(short int *buf, unsigned char buf_pos)
{
	short int i, byte;
	short int number;
	sem_enter();
	for (byte = 0; byte < buf_pos; byte++) {
		number = buf[byte];
		if ((number >= 0) && (number <= 255)) {
			for (i = 7; i >= 0; i--) {
				writepin(sdastr, 0);
				writepin(sclstr, 0);
				writepin(sdastr, (number & (1 << i)) ? 1 : 0);
				writepin(sclstr, 1);
			}
		}
	}
	writepin(sdastr, 1);
	writepin(sclstr, 0);
	writepin(sdastr, 0);
	sem_leave();

}

int main(int argc, char **argv)
{
	char line[BUFSIZE];
	short int buf[BUFSIZE];
	unsigned char buf_pos = 0;
	short int number;

	int sdapin = 0, sclpin = 0;

	if (argc < 2)
		errx(1, "usage: blinkenconrold <sdapin> <sclpin>");

	sdapin = atoi(argv[1]);
	sclpin = atoi(argv[2]);

	snprintf(sdastr, 64, "/sys/class/gpio/gpio%d/value", sdapin);
	snprintf(sclstr, 64, "/sys/class/gpio/gpio%d/value", sclpin);

	sem_init(12);

	while (fgets(line, BUFSIZE, stdin) != NULL) {
		if (sscanf(line, "%hi\n", &number) == 1) {
			if (buf_pos <= BUFSIZE) {
				buf[buf_pos++] = number;
			}
		}
		if (strcmp(line, "push\n") == 0) {
			push_data(buf, buf_pos);
			buf_pos = 0;
		}
	}
	push_data(buf, buf_pos);
	return 0;
}
