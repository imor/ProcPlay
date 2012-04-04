# Makefile for DOS COM examples for decompiling
# SOFTX86DBG guinea pigs
#
# NASM is required to assemble these test subjects.
# if you don't have it though this Makefile will
# not attempt to generate them.

include Makefile.nasm

samples_all:: test01.com test02.com test03.com test04.com test05.com test06.com test07.com test08.com test09.com test10.com test11.com test12.com test13.com test14.com test15.com test16.com test17.com test18.com test19.com test20.com

# fortunately for us NASM really doesn't create intermediary object
# files :)
clean::
	echo nothing to clean in SAMPLES

distclean::
	rm -f *.com

test01.com: test01.asm
	$(NASM) -o test01.com -f bin test01.asm

test02.com: test02.asm
	$(NASM) -o test02.com -f bin test02.asm

test03.com: test03.asm
	$(NASM) -o test03.com -f bin test03.asm

test04.com: test04.asm
	$(NASM) -o test04.com -f bin test04.asm

test05.com: test05.asm
	$(NASM) -o test05.com -f bin test05.asm

test06.com: test06.asm
	$(NASM) -o test06.com -f bin test06.asm

test07.com: test07.asm
	$(NASM) -o test07.com -f bin test07.asm

test08.com: test08.asm
	$(NASM) -o test08.com -f bin test08.asm

test09.com: test09.asm
	$(NASM) -o test09.com -f bin test09.asm

test10.com: test10.asm
	$(NASM) -o test10.com -f bin test10.asm

test11.com: test11.asm
	$(NASM) -o test11.com -f bin test11.asm

test12.com: test12.asm
	$(NASM) -o test12.com -f bin test12.asm

test13.com: test13.asm
	$(NASM) -o test13.com -f bin test13.asm

test14.com: test14.asm
	$(NASM) -o test14.com -f bin test14.asm

test15.com: test15.asm	
	$(NASM) -o test15.com -f bin test15.asm

test16.com: test16.asm
	$(NASM) -o test16.com -f bin test16.asm

test17.com: test17.asm
	$(NASM) -o test17.com -f bin test17.asm

test18.com: test18.asm
	$(NASM) -o test18.com -f bin test18.asm

test19.com: test19.asm
	$(NASM) -o test19.com -f bin test19.asm

test20.com: test20.asm
	$(NASM) -o test20.com -f bin test20.asm

