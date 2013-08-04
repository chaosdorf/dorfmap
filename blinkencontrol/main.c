#include <avr/interrupt.h>
#include <avr/io.h>
#include <avr/pgmspace.h>
#include <stdlib.h>

#define STATUSLED ( _BV( PD1 ) )
#define PBLUE  ( _BV( PB4 ) )  /* OC1B */
#define PGREEN ( _BV( PB3 ) )  /* OC1A */
#define PRED   ( _BV( PB2 ) )  /* OC0A */

#define OBLUE  ( OCR1B )
#define OGREEN ( OCR1A )
#define ORED   ( OCR0A )

/*
 * PD2 and PD3 are inverted (optokoppler to gnd and internal pull-ups)
 */
#define CLOCK_LO ( ( PIND & _BV(PD2) ) != 0 )
#define CLOCK_HI ( ( PIND & _BV(PD2) ) == 0 )
#define DATA_LO ( ( PIND & _BV(PD3) ) != 0 )
#define DATA_HI ( ( PIND & _BV(PD3) ) == 0 )
#define DATA_BIT ( ( ~PIND & _BV(PD3) ) >> PD3 )

#define MYADDRESS (0x0001)

volatile uint8_t anim_slot = 0;
volatile uint8_t delay = 0;
volatile uint8_t red = 0;
volatile uint8_t green = 0;
volatile uint8_t blue = 0;

volatile uint8_t want_red = 0;
volatile uint8_t want_green = 0;
volatile uint8_t want_blue = 0;

volatile uint8_t step = 0;
volatile uint16_t animstep = 0;

volatile uint8_t seq[97];

const uint8_t pwmtable[32] PROGMEM = {
	0, 1, 2, 2, 2, 3, 3, 4, 5, 6, 7, 8, 10, 11, 13, 16, 19, 23,
	27, 32, 38, 45, 54, 64, 76, 91, 108, 128, 152, 181, 215, 255
};

int main (void)
{
	/* watchdog reset after ~4 seconds */
	MCUSR &= ~_BV(WDRF);
	WDTCSR = _BV(WDCE) | _BV(WDE);
	WDTCSR = _BV(WDE) | _BV(WDP3);

	ACSR |= _BV(ACD);

	DDRB = PRED | PGREEN | PBLUE;
	DDRD = _BV(DDD1);

	PORTD = _BV(PD2) | _BV(PD3);

	MCUCR = _BV(ISC00);
	GIMSK = _BV(INT0);

	/* Fast PWM on OC0A, interrupt on overflow*/
	TCCR0A = _BV(COM0A1) | _BV(WGM01) | _BV(WGM00);
	TCCR0B = _BV(CS00);
	TIMSK = _BV(TOIE0);

	/* 8-bit fast PWM on OC1A and OC1B */
	TCCR1A = _BV(COM1A1) | _BV(COM1B1) | _BV(WGM10);
	TCCR1B = _BV(WGM12) | _BV(CS00);

	OCR0A = 0;
	OCR1A = 0;
	OCR1B = 0;

	sei();

	seq[0] = 1;
	seq[1] = seq[2] = seq[3] = 0;
	seq[96] = 0;

	while (1) {
		MCUCR |= _BV(SE);
		asm("sleep");
		asm("wdr");
	}

	return 0;
}

static void apply_pwm(void)
{
	if (OCR0A)
		TCCR0A |= _BV(COM0A1);
	else
		TCCR0A &= ~_BV(COM0A1);

	if (OCR1A)
		TCCR1A |= _BV(COM1A1);
	else
		TCCR1A &= ~_BV(COM1A1);

	if (OCR1B)
		TCCR1A |= _BV(COM1B1);
	else
		TCCR1A &= ~_BV(COM1B1);
}

ISR(INT0_vect)
{
	static uint16_t address;
	static uint8_t rcvopmode = 0;
	static uint8_t rcvdelay  = 0;
	static uint8_t rcvred    = 0;
	static uint8_t rcvgreen  = 0;
	static uint8_t rcvblue   = 0;

	// disable fading etc. during receive
	TIMSK = 0;
	if (CLOCK_HI) {
		// rising clock: read data
		rcvopmode  = (rcvopmode  << 1) | (rcvdelay >> 7);
		rcvdelay   = (rcvdelay   << 1) | (rcvred   >> 7);
		rcvred     = (rcvred     << 1) | (rcvgreen >> 7);
		rcvgreen   = (rcvgreen   << 1) | (rcvblue  >> 7);
		rcvblue    = (rcvblue    << 1) | (address  >> 15);
		address    = (address    << 1) | DATA_BIT;

#ifdef DEBUG
		if (DATA_BIT)
			PORTD = _BV(PD2) | _BV(PD3) | STATUSLED;
		else
			PORTD = _BV(PD2) | _BV(PD3);
#endif
	}
	else if (DATA_HI) {
		// falling clock, data is high: end of transmission
		if ((address == MYADDRESS) && (rcvopmode < 24)) {

			seq[ rcvopmode * 4 + 0 ] = rcvdelay;
			seq[ rcvopmode * 4 + 1 ] = rcvred;
			seq[ rcvopmode * 4 + 2 ] = rcvgreen;
			seq[ rcvopmode * 4 + 3 ] = rcvblue;

			seq[96] = rcvopmode;

			step = animstep = 0;
		}

		TIMSK = _BV(TOIE0);
	}
}

ISR(TIMER0_OVF_vect)
{
	static uint8_t software_prescaler = 0;

	if (software_prescaler++ != 8)
		return;
	software_prescaler = 0;

	step++;
	if ((step % 64) == 0) {
		animstep++;
	}

	if ((step % delay) == 0) {
		if (want_red > ORED)
			ORED++;
		else if (want_red < ORED)
			ORED--;
		if (want_green > OGREEN)
			OGREEN++;
		else if (want_green < OGREEN)
			OGREEN--;
		if (want_blue > OBLUE)
			OBLUE++;
		else if (want_blue < OBLUE)
			OBLUE--;
		apply_pwm();
	}

	if (animstep == ((uint16_t) delay) << 2 ) {
		animstep   = 0;
		delay      = seq[ anim_slot * 4 + 0 ];
		want_red   = seq[ anim_slot * 4 + 1 ];
		want_green = seq[ anim_slot * 4 + 2 ];
		want_blue  = seq[ anim_slot * 4 + 3 ];

		if (anim_slot >= seq[96])
			anim_slot = 0;
		else
			anim_slot++;
	}
#ifdef DEBUG
	if (DATA_BIT)
		PORTD = _BV(PD2) | _BV(PD3) | STATUSLED;
	else
		PORTD = _BV(PD2) | _BV(PD3);
#endif
}
