MCU ?= attiny2313
AVRDUDE_PROGRAMMER ?= usbasp

AVRCC ?= avr-gcc
AVRFLASH ?= avrdude
AVRNM ?= avr-nm
AVROBJDUMP ?= avr-objdump

CFLAGS += -c -mmcu=attiny2313 -DF_CPU=20000000UL
# CFLAGS += -gdwarf-2
CFLAGS += -I. -std=gnu99 -Os -Wall -Wextra -pedantic
CFLAGS += -funsigned-char -funsigned-bitfields -fpack-struct -fshort-enums
CFLAGS += -fwhole-program -flto -mstrict-X

AVRFLAGS += -U lfuse:w:0xff:m -U hfuse:w:0xdf:m -U efuse:w:0xff:m
AVRFLAGS += -U flash:w:main.hex
# AVRFLAGS += -U eeprom:w:main.eep

main.elf: main.c
	${AVRCC} ${CFLAGS} -o $@ ${@:.elf=.c}

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
