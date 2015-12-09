#include <avr/interrupt.h>
#include <avr/io.h>
#include <math.h>
#include <stdlib.h>

/*
 * PA0, PA1: status LED
 * PD0, PD1, PD4, PD6: binary out
 * PB0, PB1, PB5, PB6, PB7: binary out
 * PB2, PB3, PB4, PD5: analog out (pwm)
 */

/*
 * PD2 and PD3 are inverted (optokoppler to gnd and internal pull-ups)
 */
#define CLOCK_LO ( ( PIND & _BV(PD2) ) != 0 )
#define CLOCK_HI ( ( PIND & _BV(PD2) ) == 0 )
#define DATA_LO ( ( PIND & _BV(PD3) ) != 0 )
#define DATA_HI ( ( PIND & _BV(PD3) ) == 0 )
#define DATA_BIT ( ( ~PIND & _BV(PD3) ) >> PD3 )

#define MYADDRESS (0x0001)

volatile uint8_t binary_1 = 0;
volatile uint8_t binary_2 = 0;
volatile uint8_t pwm[4];
volatile uint16_t address;

int main (void)
{
	uint16_t start_delay;

	/* watchdog reset after ~4 seconds */
	MCUSR &= ~_BV(WDRF);
	WDTCSR = _BV(WDCE) | _BV(WDE);
	WDTCSR = _BV(WDE) | _BV(WDP3);

	ACSR |= _BV(ACD);

	DDRA = _BV(0) | _BV(1);
	DDRB = 0xff;
	DDRD = _BV(DDD0) | _BV(DDD1) | _BV(DDD4) | _BV(DDD5) | _BV(DDD6);

	PORTB = 0;
	PORTD = _BV(PD2) | _BV(PD3);

	MCUCR |= _BV(ISC00);
	GIMSK |= _BV(INT0);

	/* disabled fast PWM on OC0A and OC0B, interrupt on overflow*/
	TCCR0A = _BV(WGM01) | _BV(WGM00);
	TCCR0B = _BV(CS00);
	TIMSK = _BV(TOIE0);

	/* disabled 8-bit fast PWM on OC1A and OC1B */
	TCCR1A = _BV(WGM10);
	TCCR1B = _BV(WGM12) | _BV(CS00);

	for (start_delay = 0; start_delay < 0xff; start_delay++)
		asm("nop");

	sei();

	while (1) {
		MCUCR |= _BV(SE);
		asm("sleep");
	}

	return 0;
}

static void apply_pwm(void)
{
	if (OCR0A)
		TCCR0A |= _BV(COM0A1);
	else
		TCCR0A &= ~_BV(COM0A1);

	if (OCR0B)
		TCCR0A |= _BV(COM0B1);
	else
		TCCR0A &= ~_BV(COM0B1);

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
	if (CLOCK_HI) {
		// rising clock: read data
		binary_1 = (binary_1 << 1) | (binary_2 >> 7);
		binary_2 = (binary_2 << 1) | (pwm[3] >> 7);
		pwm[3] = (pwm[3] << 1) | (pwm[2] >> 7);
		pwm[2] = (pwm[2] << 1) | (pwm[1] >> 7);
		pwm[1] = (pwm[1] << 1) | (pwm[0] >> 7);
		pwm[0] = (pwm[0] << 1) | (address >> 15);
		address = (address << 1) | DATA_BIT;

		if (DATA_BIT != 0)
			PORTA |= _BV(PA1);
		else
			PORTA &= ~_BV(PA1);
	}
	else {
		if (DATA_HI && (address == MYADDRESS)) {
			// falling clock, data is high: end of transmission

			PORTB = binary_1
				& ( _BV(0) | _BV(1) | _BV(5) | _BV(6) | _BV(7) );

			PORTD = _BV(PD2) | _BV(PD3) | (binary_2
				& ( _BV(0) | _BV(1) | _BV(4) | _BV(6) ));


			OCR0A = pwm[0];
			OCR0B = pwm[1];
			OCR1A = pwm[2];
			OCR1B = pwm[3];
			apply_pwm();
		}
	}
}

ISR(TIMER0_OVF_vect)
{
	static uint16_t cnt = 0;
	if (++cnt == 0x9fff) {
		PINA |= _BV(PA0);
		cnt = 0;
	}
	asm("wdr");
}
