MCU ?= attiny2313
AVRDUDE_PROGRAMMER ?= usbasp

AVRCC ?= avr-gcc
AVRFLASH ?= avrdude
AVRNM ?= avr-nm
AVROBJCOPY ?= avr-objcopy
AVROBJDUMP ?= avr-objdump

CFLAGS += -mmcu=attiny2313 -DF_CPU=8000000UL
# CFLAGS += -gdwarf-2
CFLAGS += -I. -std=gnu99 -Os -Wall -Wextra -pedantic
CFLAGS += -funsigned-char -funsigned-bitfields -fpack-struct -fshort-enums
CFLAGS += -fwhole-program -flto -mstrict-X

AVRFLAGS += -U lfuse:w:0xe4:m -U hfuse:w:0xdf:m -U efuse:w:0xff:m
AVRFLAGS += -U flash:w:main.hex
# AVRFLAGS += -U eeprom:w:main.eep

%.hex: %.elf
	${AVROBJCOPY} -O ihex -R .eeprom $< $@

%.eep: %.elf
	${AVROBJCOPY} -j .eeprom --set-section-flags=.eeprom="alloc,load" \
	--change-section-lma .eeprom=0 -O ihex $< $@

main.elf: main.c
	${AVRCC} ${CFLAGS} -o $@ ${@:.elf=.c} -Wl,-Map=main.map,--cref
	avr-size --format=avr --mcu=${MCU} $@

program: main.hex main.eep
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
