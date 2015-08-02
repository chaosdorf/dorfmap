// coding: utf-8
#include <avr/io.h>
#include <avr/interrupt.h>

#define BAUD 9600UL      // Baudrate
#include <util/setbaud.h>  // Das util setzt die Baudrate automatisch

void _serputs(char *s){
    while (*s){
        while (!(UCSRA & _BV(UDRE)));
        UDR = *s;
        s++;
    }
}

void _usart_init(void){ //USART init
    UBRRH = UBRRH_VALUE;  // Übernimmt die Werte von util/setbaud.h in das passende Register
    UBRRL = UBRRL_VALUE;  // Übernimmt die Werte von util/setbaud.h in das passende Register
    #if USE_2X  // U2X-Modus erforderlich
        UCSRA |= (1 << U2X);
    #else       // U2X-Modus nicht erforderlich
        UCSRA &= ~(1 << U2X);
    #endif
    UCSRB = _BV(RXEN) | _BV(TXEN);  //RX und TX enabled
    UCSRC = _BV(UCSZ1) | _BV(UCSZ0);
}
