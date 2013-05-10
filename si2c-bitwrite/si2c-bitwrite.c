#include <err.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

#include "../semop/semctl.c"

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
	short int number;

	int sdapin = 0, sclpin = 0;
	char sdastr[64];
	char sclstr[64];

	if (argc < 2)
		errx(1, "usage: avrshiftd <sdapin> <sclpin>");

	sdapin = atoi(argv[1]);
	sclpin = atoi(argv[2]);

	snprintf(sdastr, 64, "/sys/class/gpio/gpio%d/value", sdapin);
	snprintf(sclstr, 64, "/sys/class/gpio/gpio%d/value", sclpin);

	sem_init(12);

	while (fgets(line, BUFSIZE, stdin) != NULL) {
		sem_enter();
		if (sscanf(line, "%hi\n", &number) == 1) {
			writepin(sdastr, 0);
			writepin(sclstr, 0);
			writepin(sdastr, number);
			writepin(sclstr, 1);
		}
		sem_leave();
	}
	sem_enter();
	writepin(sdastr, 1);
	writepin(sclstr, 0);
	writepin(sdastr, 0);
	sem_leave();
	return 0;
}
