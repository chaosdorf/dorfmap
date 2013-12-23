#include <avr/interrupt.h>
#include <avr/io.h>
#include <math.h>
#include <stdlib.h>

/*
 * PD2 and PD4 are inverted (optokoppler to gnd and internal pull-ups)
 */
#define CLOCK_LO ( ( PIND & _BV(PD2) ) != 0 )
#define CLOCK_HI ( ( PIND & _BV(PD2) ) == 0 )
#define DATA_LO ( ( PIND & _BV(PD4) ) != 0 )
#define DATA_HI ( ( PIND & _BV(PD4) ) == 0 )
#define DATA_BIT ( ( ~PIND & _BV(PD4) ) >> PD4 )

#define MYADDRESS (0x0009)

/* in this edition:
 *
 * PB0 .. PB7 -> 12V
 */

volatile uint8_t status_hi = 0;
volatile uint8_t status_lo = 0;
volatile uint16_t address;

int main (void)
{
	/* watchdog reset after ~4 seconds */
	MCUSR &= ~_BV(WDRF);
	WDTCSR = _BV(WDCE) | _BV(WDE);
	WDTCSR = _BV(WDE) | _BV(WDP3);

	ACSR |= _BV(ACD);

	DDRB = 0xff;
	DDRD = _BV(DDD3);

	PORTB = 0x00;
	PORTD = _BV(PD2) | _BV(PD4);

	OCR1A = 0x9fff;
	TCCR1A = 0;
	TCCR1B = _BV(WGM12) | _BV(CS12);
	TIMSK = _BV(OCIE1A);

	MCUCR |= _BV(ISC00);
	GIMSK |= _BV(INT0);

	sei();

	while (1) {
		MCUCR |= _BV(SE);
		asm("sleep");
		asm("wdr");
	}

	return 0;
}

ISR(INT0_vect)
{
	if (CLOCK_HI) {
		// rising clock: read data
		status_lo = (status_lo << 1) | (address >> 15);
		address = (address << 1) | DATA_BIT;
	}
	else if (DATA_HI && (address == MYADDRESS)) {
		// falling clock, data is high: end of transmission

		PORTB = status_lo;
	}
}

ISR(TIMER1_COMPA_vect)
{
	asm("nop");
}
