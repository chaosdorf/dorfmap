#include <avr/interrupt.h>
#include <avr/io.h>
#include <math.h>
#include <stdlib.h>

#define STATUSLED ( _BV( PD6 ) )

/*
 * PD2 and PD3 are inverted (optokoppler to gnd and internal pull-ups)
 */
#define CLOCK_LO ( ( PIND & _BV(PD2) ) != 0 )
#define CLOCK_HI ( ( PIND & _BV(PD2) ) == 0 )
#define DATA_LO ( ( PIND & _BV(PD3) ) != 0 )
#define DATA_HI ( ( PIND & _BV(PD3) ) == 0 )
#define DATA_BIT ( ( ~PIND & _BV(PD3) ) >> PD3 )

#define MYADDRESS (0x0007)

/* in this edition:
 *
 * PB0 .. PB7 -> 12V
 * PD6 -> green LED onboard
 * PD5, PD4 -> 12V
 * PA0, PA1 -> 12V
 * PD0, PD1 -> red/green LED external
 */

volatile uint8_t status_hi = 0;
volatile uint8_t status_lo = 0;
volatile uint16_t address;

static inline void statusled_on(void)
{
	PORTD |= STATUSLED;
}

static inline void statusled_off(void)
{
	PORTD &= ~STATUSLED;
}

int main (void)
{
	/* watchdog reset after ~4 seconds */
	MCUSR &= ~_BV(WDRF);
	WDTCSR = _BV(WDCE) | _BV(WDE);
	WDTCSR = _BV(WDE) | _BV(WDP3);

	ACSR |= _BV(ACD);

	DDRA = _BV(PA0) | _BV(PA1);
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
		status_lo = (status_lo << 1) | (address >> 15);
		address = (address << 1) | DATA_BIT;
		if (DATA_BIT != 0) {
			PORTD |= _BV(PD0);
			PORTD &= ~_BV(PD1);
		}
		else {
			PORTD &= ~_BV(PD0);
			PORTD |= _BV(PD1);
		}
	}
	else if (DATA_HI && (address == MYADDRESS)) {
		statusled_off();
		// falling clock, data is high: end of transmission

		PORTB = status_lo;
		PORTA =
			( (status_hi & _BV(0)) << 0 ) |
			( (status_hi & _BV(1)) << 0 );
		PORTD =
			_BV(PD2) | _BV(PD3) |
			( (status_hi & _BV(2)) << 3 ) |
			( (status_hi & _BV(3)) << 3 );
	}
}

ISR(TIMER1_COMPA_vect)
{
	statusled_on();
}
