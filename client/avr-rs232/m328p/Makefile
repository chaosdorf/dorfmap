MCU ?= m328p
AVRDUDE_PROGRAMMER ?= usbasp

AVRCC ?= avr-gcc
AVRFLASH ?= avrdude
AVRNM ?= avr-nm
AVROBJCOPY ?= avr-objcopy
AVROBJDUMP ?= avr-objdump

CFLAGS += -mmcu=atmega328p -DF_CPU=16000000UL
# CFLAGS += -gdwarf-2
CFLAGS += -I. -std=gnu99 -Os -Wall -Wextra -pedantic
CFLAGS += -funsigned-char -funsigned-bitfields -fpack-struct -fshort-enums
CFLAGS += -fwhole-program -flto -mstrict-X

AVRFLAGS += -U lfuse:w:0xff:m -U hfuse:w:0xd2:m -U efuse:w:0xff:m
AVRFLAGS += -U flash:w:main.hex
# AVRFLAGS += -U eeprom:w:main.eep

main.hex: main.o rs232.o
	${AVRCC} ${CFLAGS} -o main.elf $^
	${AVROBJCOPY} -O ihex -R .eeprom main.elf $@

main.o: main.c
	${AVRCC} ${CFLAGS} -c -o $@ ${@:.o=.c} -Wl,-Map=main.map,--cref
	avr-size -d $@

rs232.o: rs232.c
	${AVRCC} ${CFLAGS} -c -o $@ ${@:.o=.c} -Wl,-Map=main.map,--cref
	avr-size -d $@

program: main.hex
	${AVRFLASH} -p ${MCU} -c ${AVRDUDE_PROGRAMMER} ${AVRFLAGS}

secsize: main.elf
	${AVROBJDUMP} -hw -j.text -j.bss -j.data main.elf

funsize: main.elf
	${AVRNM} --print-size --size-sort main.elf

.PHONY: program secsize funsize

# Listing of phony targets.
.PHONY : all begin finish end sizebefore sizeafter gccversion \
build elf hex eep lss sym coff extcoff \
clean clean_list program debug gdb-config
