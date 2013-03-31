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

#define OM_M_MODE  ( _BV(7) | _BV(6) | _BV(5) )
#define OM_M_SPEED ( _BV(0) | _BV(1) | _BV(2) | _BV(3) | _BV(4) )

#define OM_MODE_STEADY    (     0  |     0  |     0  )
#define OM_MODE_BLINKRGB  (     0  |     0  | _BV(5) )
#define OM_MODE_BLINKRAND (     0  | _BV(6) |     0  )
#define OM_MODE_FADEONOFF ( _BV(7) |     0  |     0  )
#define OM_MODE_FADERGB   ( _BV(7) |     0  | _BV(5) )
#define OM_MODE_FADERAND  ( _BV(7) | _BV(6) |     0  )

volatile uint8_t opmode = 0;
volatile uint8_t red = 0;
volatile uint8_t green = 0;
volatile uint8_t blue = 0;

volatile uint8_t want_red = 0;
volatile uint8_t want_green = 0;
volatile uint8_t want_blue = 0;

volatile uint16_t step = 0;
volatile uint8_t sstep = 0;
volatile uint8_t fstep = 0;

volatile enum { FADE_UP = 0, FADE_DOWN = 1 } fadedir = FADE_DOWN;

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
		MCUCR |= _BV(SE);
		asm("sleep");
		asm("wdr");
	}

	return 0;
}

static void apply_pwm(void)
{
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

ISR(INT0_vect)
{
	// disable fading etc. during receive
	TIMSK &= ~_BV(TOIE0);
	if (CLOCK_HI) {
		// rising clock: read data
		opmode = (opmode << 1) | (red   >> 7);
		red    = (red    << 1) | (green >> 7);
		green  = (green  << 1) | (blue  >> 7);
		blue   = (blue   << 1) | DATA_BIT;

		if (DATA_BIT != 0)
			statusled_on();
		else
			statusled_off();
	}
	else if (DATA_HI) {
		// falling clock, data is high: end of transmission
		want_red = red;
		want_green = green;
		want_blue = blue;
		apply_pwm();
		step = fstep = sstep = 0;
		TIMSK |= _BV(TOIE0);
	}
}

ISR(TIMER0_OVF_vect)
{
	step++;
	if ((step % 64) == 0) {
		fstep++;
	}
	if (step == 4096) {
		step = 0;
		sstep++;
	}

	if (fstep == ( (opmode & OM_M_SPEED) + 1 ) ) {
		fstep = 0;
		if (want_red > red)
			red++;
		else if (want_red < red)
			red--;
		if (want_green > green)
			green++;
		else if (want_green < green)
			green--;
		if (want_blue > blue)
			blue++;
		else if (want_blue < blue)
			blue--;
		apply_pwm();
	}

	if (sstep == ( ( (opmode & OM_M_SPEED) + 1 ) * 4 ) ) {
		sstep = 0;
		switch (opmode & OM_M_MODE) {
			case OM_MODE_BLINKRGB:
				if (!red && !green && !blue)
					red = 255;
				else if (!blue && red && !green)
					green = 255;
				else if (red && green)
					red = 0;
				else if (green && !blue)
					blue = 255;
				else if (green && blue)
					green = 0;
				else if (blue && !red)
					red = 255;
				else if (blue && red)
					blue = 0;
				apply_pwm();
				break;
			case OM_MODE_BLINKRAND:
				red = rand();
				green = rand();
				blue = rand();
				apply_pwm();
				break;
			case OM_MODE_FADEONOFF:
				break;
			case OM_MODE_FADERGB:
				if (!want_red && !want_green && !want_blue)
					want_red = 255;
				else if (!want_blue && want_red && !want_green)
					want_green = 255;
				else if (want_red && want_green)
					want_red = 0;
				else if (want_green && !want_blue)
					want_blue = 255;
				else if (want_green && want_blue)
					want_green = 0;
				else if (want_blue && !want_red)
					want_red = 255;
				else if (want_blue && want_red)
					want_blue = 0;
				break;
			case OM_MODE_FADERAND:
				want_red = rand();
				want_green = rand();
				want_blue = rand();
				break;
		}
	}

	if (DATA_BIT)
		statusled_on();
	else
		statusled_off();

	TIMSK |= _BV(TOIE0);
}
