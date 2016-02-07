#include <avr/io.h>
#include <avr/interrupt.h>
#include <avr/sleep.h>
#include <util/delay.h>
#include <stdlib.h>

#include "rs232.h"

#include "../dorfmap_config.h"

/*
 * PB5: status/data LED (on-board on most arduinos)
 * PD0: RXD
 * PD1: TXD
 * PD2: SI2C SCL
 * PD3: SI2C SDA
 */

/*
 * PD2 and PD3 are connected directly (no optokopplers)
 */
#define CLOCK_LO ( ( PIND & _BV(PD2) ) == 0 )
#define CLOCK_HI ( ( PIND & _BV(PD2) ) != 0 )
#define DATA_LO ( ( PIND & _BV(PD3) ) == 0 )
#define DATA_HI ( ( PIND & _BV(PD3) ) != 0 )
#define DATA_BIT ( ( PIND & _BV(PD3) ) >> PD3 )

#define BUF_SIZE 8
#define BUF_MAX ((BUF_SIZE)-1)

volatile uint8_t buf[BUF_SIZE];
volatile uint8_t done;

char * charmap[] = { "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
	"A", "B", "C", "D", "E", "F" };

inline void byte_to_serial(uint8_t byte)
{
	uint8_t nibble1 = (byte & 0xf0) >> 4;
	uint8_t nibble2 = byte & 0x0f;

	_serputs(charmap[nibble1]);
	_serputs(charmap[nibble2]);
	_serputs(" ");
}

inline void translate_addr(uint8_t hi, uint8_t lo)
{
	_serputs("addr=");
	byte_to_serial(hi);
	byte_to_serial(lo);
	_serputs("(");
	if ((hi > 0) || (lo > num_devices)) {
		_serputs("  INVALID DEVICE   ");
	}
	else {
		_serputs(devices_00[lo]);
	}
	_serputs(") ");
}

int main(void)
{
	int8_t i;

	_usart_init();

	ACSR |= _BV(ADC);

	DDRB = _BV(DDB5);
	PORTD = _BV(PD2) | _BV(PD3);

	EICRA = _BV(ISC10) | _BV(ISC00);
	EIMSK = _BV(INT1) | _BV(INT0);

	sei();

	while(1)
	{
		if (done) {
			done = 0;
			translate_addr(buf[1], buf[0]);
			_serputs("data=");
			for (i = BUF_MAX; i >= 2; i--)
				byte_to_serial(buf[i]);
			_serputs("\r\n");
		}
		SMCR |= _BV(SE);
		asm("sleep");
	}
}

ISR(INT0_vect)
{
	if (CLOCK_HI) {
		/*
		 * a loop would be too slow
		 */
		buf[7] = (buf[7] << 1) | (buf[6] >> 7);
		buf[6] = (buf[6] << 1) | (buf[5] >> 7);
		buf[5] = (buf[5] << 1) | (buf[4] >> 7);
		buf[4] = (buf[4] << 1) | (buf[3] >> 7);
		buf[3] = (buf[3] << 1) | (buf[2] >> 7);
		buf[2] = (buf[2] << 1) | (buf[1] >> 7);
		buf[1] = (buf[1] << 1) | (buf[0] >> 7);
		buf[0] = (buf[0] << 1) | DATA_BIT;
	}
	else if (DATA_HI) {
		done = 1;
	}
}

ISR(INT1_vect)
{
	if (DATA_BIT)
		PORTB = _BV(PB5);
	else
		PORTB = ~_BV(PB5);
}
