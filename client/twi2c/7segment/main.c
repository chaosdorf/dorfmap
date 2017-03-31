#include <avr/interrupt.h>
#include <avr/io.h>
#include <stdlib.h>

/*
 * PD2 and PD3 are inverted (optokoppler to gnd and internal pull-ups)
 */
#define CLOCK_LO ( ( PIND & _BV(PD2) ) == 0 )
#define CLOCK_HI ( ( PIND & _BV(PD2) ) != 0 )
#define DATA_LO ( ( PIND & _BV(PD3) ) == 0 )
#define DATA_HI ( ( PIND & _BV(PD3) ) != 0 )
#define DATA_BIT ( ( PIND & _BV(PD3) ) >> PD3 )

#define MYADDRESS (0x0003)

volatile uint8_t buf_byte = 0;
volatile uint8_t buf_bit = 0x80;

volatile uint8_t dispbuf[48] = {
	0x01, 0x01, 0x01, 0x01, 0x01, 0x01,
	0x02, 0x02, 0x02, 0x02, 0x02, 0x02,
	0x04, 0x04, 0x04, 0x04, 0x04, 0x04,
	0x08, 0x08, 0x08, 0x08, 0x08, 0x08,
	0x10, 0x10, 0x10, 0x10, 0x10, 0x10,
	0x20, 0x20, 0x20, 0x20, 0x20, 0x20,
	0x40, 0x40, 0x40, 0x40, 0x40, 0x40,
	0x80, 0x80, 0x80, 0x80, 0x80, 0x80
};

int main (void)
{
	uint8_t i;
	uint16_t blnkstep = 0;
	uint8_t switchbuf[6];

	/* watchdog reset after ~4 seconds */
	MCUSR &= ~_BV(WDRF);
	WDTCSR = _BV(WDCE) | _BV(WDE);
	WDTCSR = _BV(WDE) | _BV(WDP3);

	ACSR |= _BV(ACD);

	DDRA = _BV(PA0);
	DDRB = 0xff;
	DDRD = _BV(DDD0) | _BV(DDD1) | _BV(DDD4) | _BV(DDD5) | _BV(DDD6);

	PORTB = 0xff;
	PORTD = _BV(PD2) | _BV(PD3);

	/* interrupt on SDA ↓ (possible START) and SCL ↑ (data) */
	MCUCR = _BV(ISC11) | _BV(ISC01) | _BV(ISC00);
	GIMSK = _BV(INT1) | _BV(INT0);

	sei();

	while (1) {

		if (++blnkstep == 16384) {
			for (i = 0; i < 6; i++)
				switchbuf[i] = dispbuf[i];
			for (i = 6; i < 48; i++)
				dispbuf[i - 6] = dispbuf[i];
			for (i = 42; i < 48; i++)
				dispbuf[i] = switchbuf[i - 42];
			blnkstep = 0;
		}

		PORTB = 0xff;
		PORTA = 0;
		PORTD = _BV(PD4) | _BV(PD2) | _BV(PD3);
		PORTB = ~dispbuf[0];

		for (i = 0; i < 16; i++)
			asm("wdr");

		PORTB = 0xff;
		PORTA = 0;
		PORTD = _BV(PD5) | _BV(PD2) | _BV(PD3);
		PORTB = ~dispbuf[1];

		for (i = 0; i < 16; i++)
			asm("wdr");

		PORTB = 0xff;
		PORTA = 0;
		PORTD = _BV(PD0) | _BV(PD2) | _BV(PD3);
		PORTB = ~dispbuf[2];

		for (i = 0; i < 16; i++)
			asm("wdr");

		PORTB = 0xff;
		PORTA = 0;
		PORTD = _BV(PD1) | _BV(PD2) | _BV(PD3);
		PORTB = ~dispbuf[3];

		for (i = 0; i < 16; i++)
			asm("wdr");

		PORTB = 0xff;
		PORTA = 0;
		PORTD = _BV(PD6) | _BV(PD2) | _BV(PD3);
		PORTB = ~dispbuf[4];

		for (i = 0; i < 16; i++)
			asm("wdr");

		PORTB = 0xff;
		PORTA = _BV(PA0);
		PORTD = _BV(PD2) | _BV(PD3);
		PORTB = ~dispbuf[5];

		for (i = 0; i < 16; i++)
			asm("wdr");
	}

	return 0;
}

ISR(INT0_vect)
{
	static uint8_t rcvbuf[50];

	if (buf_byte < 50) {
		if (DATA_HI) {
			rcvbuf[buf_byte] |= buf_bit;
		} else {
			rcvbuf[buf_byte] &= ~buf_bit;
		}
	}

	if (buf_bit > 1) {
		buf_bit >>= 1;
	} else {
		buf_byte++;
		buf_bit = 0x80;
	}

	if ((buf_byte == 50) && (buf_bit == 0x80)
			&& (rcvbuf[0] == (MYADDRESS >> 8))
			&& (rcvbuf[1] == (MYADDRESS & 0xff))) {
		for (uint8_t i = 0; i < 48; i++) {
			dispbuf[i] = rcvbuf[i+2];
		}
	}
}

ISR(INT1_vect)
{
	if (CLOCK_HI) {
		/* START condition */
		buf_byte = 0;
		buf_bit = 0x80;
	}
}
