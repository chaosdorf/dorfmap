// coding: utf-8
#include <avr/io.h>
#include <avr/interrupt.h>

#define BAUD 9600UL      // Baudrate
#include <util/setbaud.h>  // Das util setzt die Baudrate automatisch

void _serputs(char *s){
    while (*s){
        while (!(UCSR0A & (1<<UDRE0))){}
        UDR0 = *s;
        s++;
    }
}

void _usart_init(void){ //USART init
    UBRR0H = UBRRH_VALUE;  // Übernimmt die Werte von util/setbaud.h in das passende Register
    UBRR0L = UBRRL_VALUE;  // Übernimmt die Werte von util/setbaud.h in das passende Register
    #if USE_2X  // U2X-Modus erforderlich
        UCSR0A |= (1 << U2X0);
    #else       // U2X-Modus nicht erforderlich
        UCSR0A &= ~(1 << U2X0);
    #endif
    UCSR0B |= (1<<RXEN0)|(1<<TXEN0);  //RX und TX enabled
    UCSR0C = (1<<UCSZ01)|(1<<UCSZ00);
}
