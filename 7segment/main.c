#include <avr/interrupt.h>
#include <avr/io.h>
#include <stdlib.h>

/*
 * PD2 and PD3 are inverted (optokoppler to gnd and internal pull-ups)
 */
#define CLOCK_LO ( ( PIND & _BV(PD2) ) != 0 )
#define CLOCK_HI ( ( PIND & _BV(PD2) ) == 0 )
#define DATA_LO ( ( PIND & _BV(PD3) ) != 0 )
#define DATA_HI ( ( PIND & _BV(PD3) ) == 0 )
#define DATA_BIT ( ( ~PIND & _BV(PD3) ) >> PD3 )

#define MYADDRESS (0x0003)

volatile uint8_t rcvbuf[4];
volatile uint8_t dispbuf[4] = { 1, 2, 4, 8 };

volatile uint16_t address;

int main (void)
{
	uint8_t i;

	/* watchdog reset after ~4 seconds */
	MCUSR &= ~_BV(WDRF);
	WDTCSR = _BV(WDCE) | _BV(WDE);
	WDTCSR = _BV(WDE) | _BV(WDP3);

	ACSR |= _BV(ACD);

	DDRB = 0xff;
	DDRD = _BV(DDD0) | _BV(DDD4) | _BV(DDD5) | _BV(DDD6);

	PORTB = 0xff;
	PORTD = _BV(PD2) | _BV(PD3);

	MCUCR |= _BV(ISC00);
	GIMSK |= _BV(INT0);

	sei();

	while (1) {
		PORTB = 0xff;
		PORTD = _BV(PD0) | _BV(PD2) | _BV(PD3);
		PORTB = ~dispbuf[0];

		for (i = 0; i < 16; i++)
			asm("wdr");

		PORTB = 0xff;
		PORTD = _BV(PD2) | _BV(PD3) | _BV(PD4);
		PORTB = ~dispbuf[1];

		for (i = 0; i < 16; i++)
			asm("wdr");

		PORTB = 0xff;
		PORTD = _BV(PD2) | _BV(PD3) | _BV(PD5);
		PORTB = ~dispbuf[2];

		for (i = 0; i < 16; i++)
			asm("wdr");

		PORTB = 0xff;
		PORTD = _BV(PD2) | _BV(PD3) | _BV(PD6);
		PORTB = ~dispbuf[3];

		for (i = 0; i < 16; i++)
			asm("wdr");
	}

	return 0;
}

ISR(INT0_vect)
{
	uint8_t i;

	if (CLOCK_HI) {
		// rising clock: read data

		for (i = sizeof(rcvbuf); i > 0; i--)
			rcvbuf[i] = (rcvbuf[i] << 1) | (rcvbuf[i-1] >> 7);

		rcvbuf[0] = (rcvbuf[0] << 1) | (address >> 15);

		address = (address << 1) | DATA_BIT;

	}
	else if (DATA_HI && (address == MYADDRESS)) {
		for (i = 0; i < sizeof(rcvbuf); i++)
			dispbuf[i] = rcvbuf[i];
	}
}
