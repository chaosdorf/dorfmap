#include <avr/interrupt.h>
#include <avr/io.h>
#include <math.h>
#include <stdlib.h>

#define STATUSLED ( _BV( PD1 ) )
#define PBLUE  ( _BV( PB4 ) )  /* OC1B */
#define PGREEN ( _BV( PB3 ) )  /* OC1A */
#define PRED   ( _BV( PB2 ) )  /* OC0A */

/*
 * PD2 and PD3 are inverted (optokoppler to gnd and internal pull-ups)
 */
#define CLOCK_LO ( ( PIND & _BV(PD2) ) != 0 )
#define CLOCK_HI ( ( PIND & _BV(PD2) ) == 0 )
#define DATA_LO ( ( PIND & _BV(PD3) ) != 0 )
#define DATA_HI ( ( PIND & _BV(PD3) ) == 0 )
#define DATA_BIT ( ( ~PIND & _BV(PD3) ) >> PD3 )


volatile enum {
	M_OFF = 0, M_RGBFADE, M_RANDFADE, M_SCRIPT
} mode = M_OFF;

volatile unsigned char red = 0;
volatile unsigned char green = 0;
volatile unsigned char blue = 0;

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

	uint32_t i;

	/* watchdog reset after ~4 seconds */
	MCUSR &= ~_BV(WDRF);
	WDTCSR = _BV(WDCE) | _BV(WDE);
	WDTCSR = _BV(WDE) | _BV(WDP3);

	ACSR |= _BV(ACD);

	DDRB = PRED | PGREEN | PBLUE;
	DDRD = _BV(DDD1);

	PORTD |= _BV(PD2) | _BV(PD3);

	statusled_on();

	MCUCR |= _BV(ISC00);
	GIMSK |= _BV(INT0);

	PORTB = PRED;
	for (i = 0; i < 0xfffff; i++)
		asm("nop");

	PORTB = PGREEN;
	for (i = 0; i < 0xfffff; i++)
		asm("nop");

	PORTB = PBLUE;
	for (i = 0; i < 0xfffff; i++)
		asm("nop");

	PORTB = 0;

	/* Fast PWM on OC0A, interrupt on overflow*/
	TCCR0A = _BV(COM0A1) | _BV(WGM01) | _BV(WGM00);
	TCCR0B = _BV(CS00);
	TIMSK = _BV(TOIE0);

	/* 8-bit fast PWM on OC1A and OC1B */
	TCCR1A = _BV(COM1A1) | _BV(COM1B1) | _BV(WGM10);
	TCCR1B = _BV(WGM12) | _BV(CS00);

	OCR0A = 1;
	OCR1A = 1;
	OCR1B = 1;

	sei();

	statusled_off();

	while (1) {
		asm("wdr");
	}

	return 0;
}

ISR(INT0_vect)
{
	if (CLOCK_HI) {
		// rising clock: read data
		red   = (red << 1) | (green >> 7);
		green = (green << 1) | (blue >> 7);
		blue = (blue << 1) | DATA_BIT;

		if (DATA_BIT != 0)
			statusled_on();
		else
			statusled_off();
	}
	else if (DATA_HI) {
		// falling clock, data is high: end of transmission
		if (red) {
			TCCR0A |= _BV(COM0A1);
			OCR0A = red;
		}
		else {
			TCCR0A &= ~_BV(COM0A1);
		}
		if (green) {
			TCCR1A |= _BV(COM1A1);
			OCR1A = green;
		}
		else {
			TCCR1A &= ~_BV(COM1A1);
		}
		if (blue) {
			TCCR1A |= _BV(COM1B1);
			OCR1B = blue;
		}
		else {
			TCCR1A &= ~_BV(COM1B1);
		}
	}
}

ISR(TIMER0_OVF_vect)
{
	if (DATA_BIT)
		statusled_on();
	else
		statusled_off();
}
