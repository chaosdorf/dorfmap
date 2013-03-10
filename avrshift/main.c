#include <avr/interrupt.h>
#include <avr/io.h>
#include <math.h>
#include <stdlib.h>

#define STATUSLED ( _BV( PB7 ) )

/*
 * PD2 and PD3 are inverted (optokoppler to gnd and internal pull-ups)
 */
#define CLOCK_LO ( ( PIND & _BV(PD2) ) != 0 )
#define CLOCK_HI ( ( PIND & _BV(PD2) ) == 0 )
#define DATA_LO ( ( PIND & _BV(PD3) ) != 0 )
#define DATA_HI ( ( PIND & _BV(PD3) ) == 0 )
#define DATA_BIT ( ( ~PIND & _BV(PD3) ) >> PD3 )

volatile unsigned char status_hi = 0;
volatile unsigned char status_lo = 0;

static inline void statusled_on(void)
{
	PORTB &= ~STATUSLED;
}

static inline void statusled_off(void)
{
	PORTB |= STATUSLED;
}

int main (void)
{
	/* watchdog reset after ~4 seconds */
	MCUSR &= ~_BV(WDRF);
	WDTCSR = _BV(WDCE) | _BV(WDE);
	WDTCSR = _BV(WDE) | _BV(WDP3);

	CLKPR = _BV(CLKPCE);
	CLKPR = 0;

	ACSR |= _BV(ACD);

	DDRB = 0xff;
	DDRD = _BV(DDD0) | _BV(DDD1) | _BV(DDD4) | _BV(DDD5) | _BV(DDD6);

	PORTD |= _BV(PD2) | _BV(PD3);

	statusled_on();

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
		status_hi = (status_hi << 1) | (status_lo >> 7);
		status_lo = (status_lo << 1) | DATA_BIT;
		if (DATA_BIT != 0)
			statusled_on();
		else
			statusled_off();
	}
	else if (DATA_HI) {
		// falling clock, data is high: end of transmission
		PORTD =
			( (status_lo & _BV(0)) << 0 ) | // PD0 -> OUT00
			( (status_lo & _BV(1)) << 0 ) | // PD1 -> OUT01
			_BV(PD2) | _BV(PD3) |
			( (status_lo & _BV(2)) << 2 ) | // PD4 -> OUT02
			( (status_lo & _BV(3)) << 2 ) | // PD5 -> OUT03
			( (status_lo & _BV(4)) << 2 );  // PD6 -> OUT04

		// fix PB2 <-> PB3 (mis-soldered)
		PORTB =
			( (status_lo & _BV(5)) >> 5 ) | // PB0 -> OUT05
			( (status_lo & _BV(6)) >> 5 ) | // PB1 -> OUT06
			( (status_lo & _BV(7)) >> 4 ) | // PB3 -> OUT07
			( (status_hi & _BV(0)) << 2 ) | // PB2 -> OUT08
			( (status_hi & _BV(1)) << 3 ) | // PB4 -> OUT09
			( (status_hi & _BV(2)) << 3 ) | // PB5 -> OUT10
			( (status_hi & _BV(3)) << 3 ) | // PB6 -> OUT11
			( (status_hi & _BV(4)) << 3 );  // PB7 -> STATUSLED
	}
}

ISR(TIMER1_COMPA_vect)
{
	statusled_on();
}
