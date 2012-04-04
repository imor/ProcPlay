
THE PURPOSE OF THESE COM FILES
==============================

These assembly sources and .COM files are binary images containing executable
code that can be used to test the abilities of the library. Each must be
assembled using NASM using the batch file provided.

NOTE: Unless otherwise indicated do not execute these COM files directly from
      your DOS shell unless you know exactly what you are doing. Most consist
      of harmless sequences of code but I cannot guarantee that you won't have
      conflicts or problems.

When tested in softx86dbg, these .COM files are loaded into simulated RAM in a
manner similar to the way DOS .COM files are loaded. They are loaded to
address 0x1000:0x0100 in softx86dbg.

test01.com	- simple one-byte opcodes (RET, AAA, AAS, PUSH/POP segment and
                  general-purpose registers).
                  Uses the HLT instruction, which if run in a Windows DOS-box
                  may trigger warning messages. If run from pure DOS and it
                  seems to hang, simply press a key to trigger an interrupt--
                  that's all the CPU needs to get past the HLT instruction.
test02.com	- Add instruction test
test03.com      - MOV (all variants) test
test04.com      - I/O instructions test
test05.com      - ADD/SUB/ADC/SBB/XOR/OR test
test06.com      - Segment overrides and software interrupts.
test07.com      - Conditional jumps (JC, JAE, etc.)
test08.com      - TEST, XCHG, and LEA
test09.com      - CALL (direct absolute FAR)
test10.com      - REP MOVSB, MOVSB, LODSB, STOSB
test11.com      - REP CMPSB, SCASB
test12.com      - CALL r/m, JMP r/m
test13.com      - PUSH r/m, POP r/m
test14.com      - SHL, SHR, SAR, ROL, ROR
test15.com      - TEST r/m, NOT r/m, NEG r/m, MUL r/m, IMUL r/m
test16.com      - LOOP, LOOPNZ, LOOPZ
test17.com      - ENTER and LEAVE
test18.com      - LES, LDS
test19.com      - BOUND
test20.com      - Softx87 FPU emulator: FINIT, FNOP, FLD, FINCSTP, FDECSTP
test21.com      - Softx87 FPU emulator: FADD, FADDP, FIADD

HOW TO USE THESE IN TESTING SOFTX86DBG
======================================

Run Softx86dbg, passing the path of the COM file as the parameter. For example, to test emulation of test01.com,
type (from this directory):

..\bin\softx86dbg test01.com

or if running Linux, type:

../bin/softx86dbg test01.com

If working at a command prompt is not your style, you can run the associated
batch files to test the debugger from the Explorer shell by double-clicking
on them. For each testxx.com file, there is a batch file named runxx.bat. For
example, run01.bat starts softx86dbg with test01.com as the program to debug.

