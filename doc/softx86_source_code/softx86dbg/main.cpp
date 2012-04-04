/*
 * main.cpp
 *
 * Copyright (C) 2003 Jonathan Campbell <jcampbell@mdjk.com>
 * 
 * Sample "debugger" that uses the Softx86 emulation library.
 *
 * The interface is designed so that the commands are similar to that of
 * DOS DEBUG.COM.
 * 
 ******************************************************************************
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.
 *****************************************************************************/

/* #define this if only if you downloaded and compiled soft87 AND
   if you want Softx86dbg to use it. */
/* #define SOFT87FPU */

#include <ctype.h>
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include "../include/softx86.h"
#ifdef SOFT87FPU
#include "../include/softx87.h"
#endif
#ifndef WIN32	/* Linux GCC specific */
#include <unistd.h>
#endif

#ifdef DEBUG
#include <assert.h>
#define ASSERT(x)		assert(x)
#else
#define ASSERT(x)
#endif

#ifdef WIN32
#include <conio.h>
#endif

/* Win32 doesn't have strcasecmp() */
#ifdef WIN32
#define strcasecmp strcmpi
#define strncasecmp strnicmp
#endif /* WIN32 */

static char				decompiled[260];
static char				input_line[256];
static int				input_line_x=0;

static int				running=0;

#ifdef SOFT87FPU
static softx87_ctx			fpu;		// this is the FPU
#endif
static softx86_ctx			cpu;		// this is the CPU
static unsigned char*			RAM;		// this is the system RAM
static int				appsz;

/* callback function for library so CPU can fetch memory. */
void on_read_memory(void* _ctx,sx86_udword address,sx86_ubyte *buf,int size)
{
	softx86_ctx* ctx = ((softx86_ctx*)_ctx);
	int cpsz;
	int memsetsz;

	ASSERT(size >= 1 && size <= 4);

	if (address >= 0x100000) {
		cpsz = 0;
		memsetsz = size;
	}
	else if ((address+size) > 0x100000) {
		cpsz = 0x100000 - address;
		memsetsz = size - cpsz;
	}
	else {
		cpsz = size;
		memsetsz = 0;
	}

	if (cpsz > 0) {
		memcpy(buf,RAM+address,cpsz);
		buf += cpsz;
	}

	if (memsetsz > 0) {
		memset(buf,0xFF,memsetsz);
		buf += cpsz;
	}
}

/* callback function for library so CPU can write memory */
void on_write_memory(void* _ctx,sx86_udword address,sx86_ubyte *buf,int size)
{
	softx86_ctx* ctx = ((softx86_ctx*)_ctx);
	int cpsz;
	int memsetsz;

	ASSERT(size >= 1 && size <= 4);

	if (address >= 0x100000) {
		cpsz = 0;
		memsetsz = size;
	}
	else if ((address+size) > 0x100000) {
		cpsz = 0x100000 - address;
		memsetsz = size - cpsz;
	}
	else {
		cpsz = size;
		memsetsz = 0;
	}

	if (cpsz > 0) {
		memcpy(RAM+address,buf,cpsz);
		buf += cpsz;
	}

	if (memsetsz > 0) {
		/* throw it away */
		buf += cpsz;
	}
}

static sx86_uword	some_register_1234h=0;
static sx86_ubyte	some_register_9Ah=0;
void on_read_io(void* _ctx,sx86_udword address,sx86_ubyte *buf,int size)
{
	ASSERT(size >= 1 && size <= 4);

/* for test purposes: simulate some hypothetical I/O ports that take input
   and put it through some calculation */
	if (address == 0x1234) {
		if (size == 2) {
			sx86_uword w,*p;

			p  = ((sx86_uword*)buf);
			w  = some_register_1234h;
			w += 0x2222;
			SWAP_WORD_TO_LE(w);
			*p = w;
		}
		else {
			sx86_ubyte b;

			b    = (sx86_ubyte)some_register_1234h;
			b   += 0x22;
			*buf = b;
		}
	}
	else if (address == 0x9A) {
		if (size == 2) {
			sx86_uword w,*p;

			p  = ((sx86_uword*)buf);
			w  = some_register_9Ah;
			SWAP_WORD_TO_LE(w);
			*p = w;
		}
		else {
			sx86_ubyte b;

			b    = some_register_9Ah;
			*buf = b;
		}
	}
	else {
		memset(buf,0xFF,size);
	}
}

void on_write_io(void* _ctx,sx86_udword address,sx86_ubyte *buf,int size)
{
	ASSERT(size >= 1 && size <= 4);

/* for test purposes: simulate some hypothetical I/O ports that take input
   and put it through some calculation */
	if (address == 0x1234) {
		if (size == 2) {
			sx86_uword w,*p;

			p  = ((sx86_uword*)buf);
			w  = *p;
			SWAP_WORD_FROM_LE(w);
			some_register_1234h = w;
		}
		else {
			some_register_1234h = *buf;
		}
	}
	else if (address == 0x9A) {
		if (size == 2) {
			sx86_uword w,*p;

			p  = ((sx86_uword*)buf);
			w  = *p;
			SWAP_WORD_FROM_LE(w);
			some_register_9Ah = (sx86_ubyte)(w&0xFF);
			some_register_9Ah++;
		}
		else {
			some_register_9Ah = *buf;
			some_register_9Ah++;
		}
	}
}

#ifdef WIN32
#define INPUT_ENDLINE		13
#else		// Linux/GCC
#define INPUT_ENDLINE		10
#endif
char *get_input_line()
{
	char c;

	input_line_x=0;

	c=0;
	while (c != INPUT_ENDLINE) {
#ifdef WIN32
		c=getch();
#else
		if (!read(0,&c,1)) c = 0;
#endif

		if (c == 8) {
			printf("\x08 \x08");
			if (input_line_x > 0) {
				input_line[input_line_x--]=0;
				input_line[input_line_x  ]=0;
			}
		}
		else if (c >= 32 || c < 0) {
#ifdef WIN32			
			printf("%c",c);		/* Windows command line
						   doesn't echo input...
						   but the Linux console
						   (STDIN) does. */
#endif			
			if (input_line_x < (sizeof(input_line)-1)) {
				input_line[input_line_x++]=c;
				input_line[input_line_x  ]=0;
			}
		}
		else if (c == 3) {		/* CTRL+C */
			c = 13;
			strcpy(input_line,"q");
			input_line_x = 1;
		}
		else if (c == INPUT_ENDLINE) {
#ifdef WIN32			
			printf("\n");
#endif			
		}
	}

	input_line[input_line_x]=0;
	return input_line;
}

void printregs()
{
	printf("EAX=%08X EBX=%08X ECX=%08X EDX=%08X\nESI=%08X EDI=%08X EBP=%08X ESP=%08X\n",
		cpu.state.general_reg[SX86_REG_AX].val,
		cpu.state.general_reg[SX86_REG_BX].val,
		cpu.state.general_reg[SX86_REG_CX].val,
		cpu.state.general_reg[SX86_REG_DX].val,
		cpu.state.general_reg[SX86_REG_SI].val,
		cpu.state.general_reg[SX86_REG_DI].val,
		cpu.state.general_reg[SX86_REG_BP].val,
		cpu.state.general_reg[SX86_REG_SP].val);
	
	printf("CS=%04X DS=%04X ES=%04X SS=%04X IP=%04X EFLAGS=%08X\n",
		cpu.state.segment_reg[SX86_SREG_CS].val,
		cpu.state.segment_reg[SX86_SREG_DS].val,
		cpu.state.segment_reg[SX86_SREG_ES].val,
		cpu.state.segment_reg[SX86_SREG_SS].val,
		cpu.state.reg_ip,
		cpu.state.reg_flags.val);
	
	printf("CF=%d PF=%d AF=%d ZF=%d SF=%d TF=%d IE=%d DF=%d OF=%d\n",
		(cpu.state.reg_flags.val & SX86_CPUFLAG_CARRY)?1:0,
		(cpu.state.reg_flags.val & SX86_CPUFLAG_PARITY)?1:0,
		(cpu.state.reg_flags.val & SX86_CPUFLAG_AUX)?1:0,
		(cpu.state.reg_flags.val & SX86_CPUFLAG_ZERO)?1:0,
		(cpu.state.reg_flags.val & SX86_CPUFLAG_SIGN)?1:0,
		(cpu.state.reg_flags.val & SX86_CPUFLAG_TRAP)?1:0,
		(cpu.state.reg_flags.val & SX86_CPUFLAG_INTENABLE)?1:0,
		(cpu.state.reg_flags.val & SX86_CPUFLAG_DIRECTIONREV)?1:0,
		(cpu.state.reg_flags.val & SX86_CPUFLAG_OVERFLOW)?1:0);
	
}

/* the logic behind INT 21h in this virtual x86 environment */
void soft_int21(softx86_ctx* cpu)
{
	if (cpu->state.general_reg[SX86_REG_AX].val == 0x4C00) {
// relocate instruction ptr to the endless loop
		softx86_set_near_instruction_ptr(cpu,0xFFF2);
		printf("The program has just exited\n");
	}
	else {
// relocate instruction ptr to the "IRET"
		cpu->state.general_reg[SX86_REG_AX].val = 0x0001;
		cpu->state.reg_flags.val |= SX86_CPUFLAG_CARRY;
		softx86_set_near_instruction_ptr(cpu,0xFFF1);
		printf("SOFTX86DBG: This program is making DOS calls that I do not emulate.\n");
	}
}

void reset(int argc,char **argv)
{
	int x,is_exe;
	char c,c2,ca2[2];

/* reset CPU */
	x=softx86_reset(&cpu);
	if (x == 0) {
		printf("Softx86 library error: Unable to reset CPU\n");
		return;
	}

#ifdef SOFT87FPU
/* reset FPU */
	x=softx87_reset(&fpu);
	if (x == 0) {
		printf("Softx87 library error: Unable to reset FPU\n");
		return;
	}
#endif

/* if a parameter exists, it's a DOS COM binary image, load it */
	memset(RAM,0,1024*1024);
	if (argc >= 2) {
		FILE *fp;

		fp=fopen(argv[1],"rb");
		if (!fp) {
			printf("*ERR: Unable to access file!\n");
			return;
		}

		fseek(fp,0,SEEK_SET);
		fread(&c,1,1,fp);
		fread(&c2,1,1,fp);
		is_exe = (c == 'M' && c2 == 'Z');

		fseek(fp,0,SEEK_END);
		appsz=ftell(fp);
		fseek(fp,0,SEEK_SET);

/* EXE loading code */
		if (is_exe) {
			int image_sz,im1,im2;
			int reloc_items,hdr_para;
			int ss_offset;
			int initial_sp;
			int cs_offset;
			int initial_ip;
			int reloc_offset;
			int seg,ofs;

			fseek(fp,2,SEEK_SET);

			fread(ca2,2,1,fp);
			im1  = ((int)(ca2[0]&0xFF));	// +0x02 = length of image & 511
			im1 |= ((int)(ca2[1]&0xFF))<<8;

			fread(ca2,2,1,fp);
			im2  = ((int)(ca2[0]&0xFF));	// +0x04 = length of image >> 9
			im2 |= ((int)(ca2[1]&0xFF))<<8;
			image_sz = (im2<<9)+im1;

			fread(ca2,2,1,fp);
			reloc_items  = ((int)(ca2[0]&0xFF));	// +0x06 = # of relocation items
			reloc_items |= ((int)(ca2[1]&0xFF))<<8;

			fread(ca2,2,1,fp);
			hdr_para  = ((int)(ca2[0]&0xFF));	// +0x08 = size of header in paragraphs
			hdr_para |= ((int)(ca2[1]&0xFF))<<8;

			fread(ca2,2,1,fp);		// +0x0A = Min. paragraphs needed (ignore this)

			fread(ca2,2,1,fp);		// +0x0C = Max. paragraphs desired (ignore this)

			fread(ca2,2,1,fp);
			ss_offset  = ((int)(ca2[0]&0xFF));	// +0x0E = Initial SS (without offset)
			ss_offset |= ((int)(ca2[1]&0xFF))<<8;

			fread(ca2,2,1,fp);
			initial_sp  = ((int)(ca2[0]&0xFF));	// +0x10 = Initial SP
			initial_sp |= ((int)(ca2[1]&0xFF))<<8;

			fread(ca2,2,1,fp);		// +0x12 = Checksum (ignore this)

			fread(ca2,2,1,fp);
			initial_ip  = ((int)(ca2[0]&0xFF));	// +0x14 = Initial SP
			initial_ip |= ((int)(ca2[1]&0xFF))<<8;

			fread(ca2,2,1,fp);
			cs_offset  = ((int)(ca2[0]&0xFF));	// +0x16 = Initial CS (without offset)
			cs_offset |= ((int)(ca2[1]&0xFF))<<8;

			fread(ca2,2,1,fp);
			reloc_offset  = ((int)(ca2[0]&0xFF));	// +0x18 = offset of first relocation item
			reloc_offset |= ((int)(ca2[1]&0xFF))<<8;

			fread(ca2,2,1,fp);		// +0x1A = overlay # (ignore this)

			// TODO:  Windows EXEs typically have hdr_para >= 4 so that
			//        the offset to the PE/NE header can be stored as
			//        a DWORD at byte offset 60. When softx86 can
			//        emulate the 286/386 and 32-bit protected mode,
			//        implement Win16/Win32 EXE reader.
			
			if (im1 >= 512)
				printf("EXE LOADER: WARNING: Field 0x02 >= 512\n");

			if (image_sz > appsz) {
				image_sz = appsz;
//				apparently this is normal in most DOS EXEs.
//				printf("EXE LOADER: WARNING: Image size in EXE header > file size\n");
			}

			if (!image_sz) {
				image_sz = appsz;
				printf("EXE LOADER: WARNING: Image size in EXE header == 0. Assuming entire file.\n");
			}

			if (hdr_para < 2) {
				/* HAH! What did I *JUST* read then? garbage? */
				printf("EXE LOADER: WARNING: EXE header denies own existience!\n");
				hdr_para = 2;
			}

			if (reloc_offset < 0x1C || reloc_offset > (appsz-(reloc_items*4))) {
				printf("EXE LOADER: WARNING: Out of bounds relocation table offset in header\n");
				reloc_offset = 0;
				reloc_items = 0;
			}

			if (reloc_items > 4096)
				printf("EXE LOADER: WARNING: Suspiciously large relocation item count.\n");

			if (image_sz > 0x8FF00) {	// 0xA0000 - 0x10100
				image_sz = 0x8FF00;
				printf("EXE LOADER: WARNING: Cannot load entire image into memory. Truncating...\n");
			}

			if (!initial_sp)
				initial_sp = 0xFFFF;

/* set up instruction pointer to entry point in EXE program. */
			softx86_set_instruction_ptr(&cpu,0x1010+cs_offset,initial_ip);
			softx86_set_stack_ptr(&cpu,0x1010+ss_offset,initial_sp);
			softx86_setsegval(&cpu,SX86_SREG_DS,0x1010);
			softx86_setsegval(&cpu,SX86_SREG_ES,0x1010);

			if (image_sz > 0) {
				int x;

/* EXE loading code */
/* our chosen segment address is 0x1010 */
				fseek(fp,hdr_para*16,SEEK_SET);
				fread(RAM + 0x10100,image_sz,1,fp);	/* 0x1000:0x0100 or 0x1010:0x0000 */

/* EXE patching code (relocations) */
				if (reloc_items > 0 && reloc_offset >= 0x1C) {
					fseek(fp,reloc_offset,SEEK_SET);
					for (x=0;x < reloc_offset;x++) {
						fread(ca2,2,1,fp);
						ofs  = ((int)(ca2[0]&0xFF));
						ofs |= ((int)(ca2[1]&0xFF))<<8;
						fread(ca2,2,1,fp);
						seg  = ((int)(ca2[0]&0xFF));
						seg |= ((int)(ca2[1]&0xFF))<<8;

						seg  += 0x1010;
						ofs  += seg << 4;
						if (seg <= 0x9FFFC) {
							int v;

							v  = ((int)(RAM[ofs  ]&0xFF));
							v |= ((int)(RAM[ofs+1]&0xFF))<<8;
							v += seg;
							RAM[ofs  ] = (unsigned char)(v&0xFF);
							RAM[ofs++] = (unsigned char)((v>>8)&0xFF);
						}
					}
				}
			}
		}
/* COM loading code */
		else {
			if (appsz > 65280) appsz = 65280;

/* this works very well for loading COM images. why? A COM program for DOS
 * is really nothing more than a binary image that expects to be loaded into
 * memory at some address and given a real-mode segment with the first byte
 * at offset 100h. That's why this code is real simple.... */
			fread(RAM + 0x10100,appsz,1,fp);	/* 0x1000:0x0100 */

/* set up instruction pointer to entry point in COM program. */
			softx86_set_instruction_ptr(&cpu,0x1000,0x100);
			softx86_set_stack_ptr(&cpu,0x1000,0xFFF8);
			softx86_setsegval(&cpu,SX86_SREG_DS,0x1000);
			softx86_setsegval(&cpu,SX86_SREG_ES,0x1000);
		}

		fclose(fp);
	}

/* set up a simple PSP so that if the program exits via RET to 0000h it exits like it should */
/* fortunately for all of us only vintage DOS software uses this method of escape... */
	RAM[0x10000]    = 0xCD;		// INT 20h
	RAM[0x10001]    = 0x20;

/* point INT 21h to a dead end @ 9000:FFF0 */
	RAM[(0x21*4)+0] = 0xF0;
	RAM[(0x21*4)+1] = 0xFF;
	RAM[(0x21*4)+2] = 0x00;
	RAM[(0x21*4)+3] = 0x90;
	RAM[0x9FFF0]    = 0x90;		// NOP (where the magic happens)
	RAM[0x9FFF1]    = 0xCF;		// IRET
	RAM[0x9FFF2]    = 0xF4;		// HLT
	RAM[0x9FFF3]    = 0xEB;		// JMP $ (back to this instruction)
	RAM[0x9FFF4]    = 0xFE;

/* point INT 20h to 9000:FFE0 */
	RAM[(0x20*4)+0] = 0xE0;
	RAM[(0x20*4)+1] = 0xFF;
	RAM[(0x20*4)+2] = 0x00;
	RAM[(0x20*4)+3] = 0x90;
	RAM[0x9FFE0]    = 0xB8;		// MOV AX,4C00h
	RAM[0x9FFE1]    = 0x00;
	RAM[0x9FFE2]    = 0x4C;
	RAM[0x9FFE3]    = 0xCD;		// INT 21h
	RAM[0x9FFE4]    = 0x21;
}

void emustep()
{
/* we must fake INT 21h (located at 9000:FFF0) so we must do our own work */
	if (cpu.state.segment_reg[SX86_SREG_CS].val == 0x9000 && cpu.state.reg_ip == 0xFFF0)
		soft_int21(&cpu);

/* execute whatever is there */
	if (!softx86_step(&cpu))
		printf("single stepping error occured\n");
}

int main(int argc,char **argv)
{
	char *cmdin;
	int diff,x,desired_level;
	int svhi,svlo,svslo;
	sx86_udword pdif;
#ifndef WIN32
	char c;
#endif

	desired_level = SX86_CPULEVEL_8086;

/* is the user asking for help? */
	if (argc > 1) {
		if (	(!strcasecmp(argv[1],"/h")) ||		// DOS style
			(!strcasecmp(argv[1],"/help")) ||
			(!strcasecmp(argv[1],"-h")) ||		// GNU style
			(!strcasecmp(argv[1],"--help"))) {

			printf("softx86dbg [file] [options]\n");
			printf("\n");
			printf("file       path of a DOS COM/EXE file to debug\n");
			printf("           *MUST BE FIRST ON THE COMMAND LINE\n");
			printf("/286       use 80286 emulation mode\n");
			printf("/186       use 80186 emulation mode\n");
			printf("/86        use 8086 emulation mode\n");
			printf("/88        use 8088 emulation mode\n");
		}
	}

	if (argc > 2) {
		for (x=2;x < argc;x++) {
			if (!strncasecmp(argv[x],"/486",4)) {
				printf("Softx86 does not yet support 486 emulation!\n");
			}
			else if (!strncasecmp(argv[x],"/386",4)) {
				printf("Softx86 does not yet support 386 emulation!\n");
			}
			else if (!strncasecmp(argv[x],"/286",4)) {
				desired_level = SX86_CPULEVEL_80286;
			}
			else if (!strncasecmp(argv[x],"/186",4)) {
				desired_level = SX86_CPULEVEL_80186;
			}
			else if (!strncasecmp(argv[x],"/86",3)) {
				desired_level = SX86_CPULEVEL_8086;
			}
			else if (!strncasecmp(argv[x],"/88",3)) {
				desired_level = SX86_CPULEVEL_8088;
			}
		}
	}

/* For simplicity's sake, just allocate a 1MB chunk of memory and call
 * that the simulated RAM */
	RAM = new unsigned char[1024*1024];
	if (!RAM) {
		printf("*ERR: Out of memory\n");
		return 1;
	}

	x=softx86_getversion(&svhi,&svlo,&svslo);
	if (x == 0) {
		printf("Softx86 library error: Unable to obtain version\n");
		return 1;
	}

/* Hello user! */
	printf("Softx86dbg simple debugger v0.00.0029, Copyright (C) 2003 Jonathan Campbell.\n");
	printf("Softx86dbg comes with ABSOLUTELY NO WARRANTY; for details see LICENSE.TXT\n");
	printf("This is free software, and you are welcome to redistribute it\n");
	printf("under certain conditions; see GNU_GPL.txt.\n");
	printf("Using libsoftx86 v%d.%02d.%04d\n",svhi,svlo,svslo);
	if (	svhi  != SOFTX86_VERSION_HI ||
		svlo  != SOFTX86_VERSION_LO ||
		svslo != SOFTX86_VERSION_SUBLO) {
		printf("WARNING: Incompatible version. I was compiled for %d.%02d.%04d\n",
			SOFTX86_VERSION_HI,
			SOFTX86_VERSION_LO,
			SOFTX86_VERSION_SUBLO);
	}

#ifdef SOFT87FPU
	x=softx87_getversion(&svhi,&svlo,&svslo);
	if (x == 0) {
		printf("Softx87 library error: Unable to obtain version\n");
		return 1;
	}

	printf("Using libsoftx87 v%d.%02d.%04d\n",svhi,svlo,svslo);
	if (	svhi  != SOFTX87_VERSION_HI ||
		svlo  != SOFTX87_VERSION_LO ||
		svslo != SOFTX87_VERSION_SUBLO) {
		printf("WARNING: Incompatible version. I was compiled for %d.%02d.%04d\n",
			SOFTX87_VERSION_HI,
			SOFTX87_VERSION_LO,
			SOFTX87_VERSION_SUBLO);
	}
#endif

/* this function must be called first for a given context structure.
 * once this is done successfully, you can then pass the context structure
 * to any API function you please. */
	x=softx86_init(&cpu,desired_level);
	if (x == 0) {
		printf("Softx86 library error: Unable to initialize CPU\n");
		return 1;
	}
	else if (x == 2) {
		printf("WARNING: Library indicates emulation not stable\n");
	}

/* set up callbacks. these callback pointers allow softx86 to make
   requests directly to the program (there is no special memory
   "structure" to feed it with... that's YOUR program's responsibility :).
   Softx86 directly calls the function using the pointer given here
   to make requests for RAM in the same manner that the actual physical
   CPU fetches RAM from system memory and adapter memory. */
	cpu.callbacks.on_read_memory	= on_read_memory;
	cpu.callbacks.on_write_memory	= on_write_memory;
	cpu.callbacks.on_read_io	= on_read_io;
	cpu.callbacks.on_write_io	= on_write_io;

#ifdef SOFT87FPU
	x=softx87_init(&fpu,SX87_FPULEVEL_8087);
	if (x == 0) {
		printf("Softx87 library error: Unable to initialize FPU\n");
		return 1;
	}
	else if (x == 2) {
		printf("WARNING: Library indicates emulation not stable\n");
	}

/* make the necessary connection between softx86 and softx87 */
	cpu.ref_softx87_ctx =					&fpu;
	fpu.ref_softx86 =					&cpu;
	cpu.callbacks.on_fpu_opcode_exec =			softx87_on_fpu_opcode_exec;
	cpu.callbacks.on_fpu_opcode_dec =			softx87_on_fpu_opcode_dec;
	fpu.callbacks.on_read_memory =				on_read_memory;
	fpu.callbacks.on_write_memory =				on_write_memory;
	fpu.callbacks.on_softx86_fetch_dec_byte =		softx86_fetch_dec_byte;
	fpu.callbacks.on_softx86_fetch_exec_byte =		softx86_fetch_exec_byte;
	fpu.callbacks.on_sx86_dec_full_modrmonly =		sx86_dec_full_modrmonly;
	fpu.callbacks.on_sx86_exec_full_modrmonly_memx =	sx86_exec_full_modrmonly_memx;
#endif

/* load COM file */
	reset(argc,argv);

	running=1;
	printregs();
	while (running) {
#ifdef WIN32
		printf("-");
#else
		c = '-'; write(1,&c,1);	/* GLIBC 2.1 likes to cache printf() output
					   for some stupid reason... write
					   directly to STDOUT */
#endif
		cmdin = get_input_line();

/* what command did we get? */
		if (*cmdin == '?') {			/* help? */
			printf("?                      Print this help\n");
			printf("q                      Quit\n");
			printf("r                      Print registers\n");
			printf("r [regname]            Set register value\n");
			printf("d address              Dump memory contents at...\n");
			printf("t [times]              Single-step [times]\n");
			printf("d [[seg:]ofs]          Dump memory at...\n");
			printf("u [[seg:]ofs]          Decompile instructions at...\n");
#ifdef SOFT87FPU
			printf("fr                     Print FPU registers\n");
#endif
			printf("!reset                 Reset emulation\n");
		}
/* quit? */
		else if (*cmdin == 'q') {		/* quit? */
			running=0;
		}
/* extended command? */
		else if (*cmdin == '!') {
			cmdin++;

			if (!strncasecmp(cmdin,"reset",5)) {	/* !reset */
				reset(argc,argv);
				printregs();
			}
		}
#ifdef SOFT87FPU
/* FPU commands? */
		else if (*cmdin == 'f') {
			cmdin++;

			if (*cmdin == 'r') {
				double fv;
				int typ;
				int i,ri;

				printf("STAT=%04X CTRL=%04X TAG=%04X\n",
					fpu.state.status_word,
					fpu.state.control_word,
					fpu.state.tag_word);

				for (i=0;i < 8;i++) {
					ri = SX87_FPU_ST(
						SX87_FPUSTAT_TOP(fpu.state.status_word),
						i);

#ifdef WIN32
/* "%I64u" is Microsoft printf-ese for 64-bit unsigned integers */
					printf("ST(%d)=%c(%I64u<<%d) ",
						i,
						(char)(fpu.state.st[ri].sign_bit?'-':'+'),
						(sx86_uldword)fpu.state.st[ri].mantissa,
						fpu.state.st[ri].exponent-16383);
#else
/* TODO: How do you print 64-bit integers with GLIBC under Linux? */
#endif
					fv = SX87_FPUTAGW_TAG(fpu.state.tag_word,ri);
					if (fv == SX87_FPUTAGVAL_VALID)
						printf("VALID ");
					else if (fv == SX87_FPUTAGVAL_ZERO)
						printf("ZERO ");
					else if (fv == SX87_FPUTAGVAL_SPECIAL)
						printf("SPECIAL ");
					else if (fv == SX87_FPUTAGVAL_EMPTY)
						printf("EMPTY ");

					fv = softx87_get_fpu_register_double(&fpu,ri,&typ);
					if (typ == SX87_FPU_NUMTYPE_NUMBER)
						printf("%.30f",fv);
					else if (typ == SX87_FPU_NUMTYPE_NEGINF)
						printf("-infinity");
					else if (typ == SX87_FPU_NUMTYPE_POSINF)
						printf("+infinity");
					else if (typ == SX87_FPU_NUMTYPE_NAN)
						printf("NaN");

					printf("\n");
				}
			}
		}
#else
		else if (*cmdin == 'f') {
			printf("This program was not compiled with Softx87 support\n");
		}
#endif
/* regs? */
		else if (*cmdin == 'r') {
			cmdin++;
			while (*cmdin == ' ') cmdin++;
			if (*cmdin) {
				sx86_udword newval;
				sx86_udword* pv;
				sx86_uword* pvw;

/* user wants to assign a register a value */
				pv=NULL;
				pvw=NULL;
				if (!strcasecmp(cmdin,"AX"))
					pv = &cpu.state.general_reg[SX86_REG_AX].val;
				else if (!strcasecmp(cmdin,"BX"))
					pv = &cpu.state.general_reg[SX86_REG_BX].val;
				else if (!strcasecmp(cmdin,"CX"))
					pv = &cpu.state.general_reg[SX86_REG_CX].val;
				else if (!strcasecmp(cmdin,"DX"))
					pv = &cpu.state.general_reg[SX86_REG_DX].val;
				else if (!strcasecmp(cmdin,"SI"))
					pv = &cpu.state.general_reg[SX86_REG_SI].val;
				else if (!strcasecmp(cmdin,"DI"))
					pv = &cpu.state.general_reg[SX86_REG_DI].val;
				else if (!strcasecmp(cmdin,"BP"))
					pv = &cpu.state.general_reg[SX86_REG_BP].val;
				else if (!strcasecmp(cmdin,"SP"))
					pv = &cpu.state.general_reg[SX86_REG_SP].val;
				else if (!strcasecmp(cmdin,"IP"))
					pv = &cpu.state.reg_ip;
				else if (!strcasecmp(cmdin,"CS"))
					pvw = &cpu.state.segment_reg[SX86_SREG_CS].val;
				else if (!strcasecmp(cmdin,"DS"))
					pvw = &cpu.state.segment_reg[SX86_SREG_DS].val;
				else if (!strcasecmp(cmdin,"ES"))
					pvw = &cpu.state.segment_reg[SX86_SREG_ES].val;
				else if (!strcasecmp(cmdin,"SS"))
					pvw = &cpu.state.segment_reg[SX86_SREG_SS].val;

				if (pv) {
					printf("%s = %04X\n? ",cmdin,*pv);
					cmdin = get_input_line();
					if (isdigit(*cmdin)) {
						newval = strtoul(cmdin,NULL,16);
						if (pv == &cpu.state.reg_ip)
							softx86_set_near_instruction_ptr(&cpu,newval);
						else if (pv == &cpu.state.general_reg[SX86_REG_SP].val)
							softx86_set_stack_ptr(&cpu,cpu.state.segment_reg[SX86_SREG_SS].val,newval);
						else if (pvw == &cpu.state.segment_reg[SX86_SREG_CS].val)
							softx86_setsegval(&cpu,SX86_SREG_CS,newval);
						else if (pvw == &cpu.state.segment_reg[SX86_SREG_DS].val)
							softx86_setsegval(&cpu,SX86_SREG_DS,newval);
						else if (pvw == &cpu.state.segment_reg[SX86_SREG_ES].val)
							softx86_setsegval(&cpu,SX86_SREG_ES,newval);
						else if (pvw == &cpu.state.segment_reg[SX86_SREG_SS].val)
							softx86_setsegval(&cpu,SX86_SREG_SS,newval);
						else
							*pv = newval;

						printregs();
					}
					else {
						printf("Invalid input\n");
					}
				}
				else if (pvw) {
					printf("%s = %04X\n? ",cmdin,*pvw);
					cmdin = get_input_line();
					if (isdigit(*cmdin)) {
						newval = strtoul(cmdin,NULL,16);
						if (pvw == &cpu.state.segment_reg[SX86_SREG_CS].val)
							softx86_setsegval(&cpu,SX86_SREG_CS,newval);
						else if (pvw == &cpu.state.segment_reg[SX86_SREG_DS].val)
							softx86_setsegval(&cpu,SX86_SREG_DS,newval);
						else if (pvw == &cpu.state.segment_reg[SX86_SREG_ES].val)
							softx86_setsegval(&cpu,SX86_SREG_ES,newval);
						else if (pvw == &cpu.state.segment_reg[SX86_SREG_SS].val)
							softx86_setsegval(&cpu,SX86_SREG_SS,newval);

						printregs();
					}
					else {
						printf("Invalid input\n");
					}
				}
				else {
					printf("No such register %s\n",cmdin);
				}
			}
			else {
				printregs();
			}
		}
/* RAM dump? */
		else if (*cmdin == 'd') {
/* USAGE:    d
             d [offset]
			 d [segment:offset] */
			sx86_udword seg,ofs;
			sx86_udword oo;
			int x,y;

			seg = cpu.state.segment_reg[SX86_SREG_DS].val;
			ofs = 0;

			cmdin++;
			while (*cmdin == ' ') cmdin++;

			if (isdigit(*cmdin)) {
				ofs = (sx86_uword)strtoul(cmdin,NULL,16);
				while (isdigit(*cmdin)) cmdin++;
				
				if (*cmdin == ':') {
					cmdin++;
					seg = ofs;
					ofs = (sx86_uword)strtoul(cmdin,NULL,16);
					while (isdigit(*cmdin)) cmdin++;
				}
			}

			oo = (seg<<4)+ofs;
			for (y=0;y < 8;y++) {
				printf("%04X:%04X ",seg,ofs);

				for (x=0;x < 7;x++) {
					if (oo < 0x100000)
						printf("%02X ",RAM[oo++]);
					else	
						printf("-- ");
				}

				if (oo < 0x100000)
					printf("%02X-",RAM[oo++]);
				else
					printf("-- ");
				
				x++;

				for (;x < 16;x++) {
					if (oo < 0x100000)
						printf("%02X ",RAM[oo++]);
					else
						printf("-- ");
				}

				ofs += 16;
				printf("\n");
			}
		}
/* step? */
		else if (*cmdin == 't') {
			int cnt;

/* if a number follows, it's a count of how many instructions to step through.
   useful for stepping through REP loops */
			cnt=1;
			cmdin++;
			while (*cmdin == ' ') cmdin++;
			if (isdigit(*cmdin)) cnt=strtoul(cmdin,NULL,0);
			if (cnt < 1) cnt = 1;

			while (cnt-- > 0) emustep();
			softx86_decompile_exec_cs_ip(&cpu);

			printregs();
			printf("%04X:%04X ",cpu.state.reg_cs_decompiler,cpu.state.reg_ip_decompiler);

			if (!softx86_decompile(&cpu,decompiled))
				printf("{error} ");

			printf("%s\n",decompiled);
		}
/* decompile? */
		else if (*cmdin == 'u') {
/* USAGE:    u
             u [offset]
			 u [segment:offset] */
			sx86_udword seg,ofs;
			int x,cc;

			seg = cpu.state.segment_reg[SX86_SREG_CS].val;
			ofs = cpu.state.reg_ip;

			cmdin++;
			while (*cmdin == ' ') cmdin++;

			if (isdigit(*cmdin)) {
				ofs = (sx86_uword)strtoul(cmdin,NULL,16);
				while (isdigit(*cmdin)) cmdin++;
				
				if (*cmdin == ':') {
					cmdin++;
					seg = ofs;
					ofs = (sx86_uword)strtoul(cmdin,NULL,16);
					while (isdigit(*cmdin)) cmdin++;
				}
			}

			softx86_set_instruction_dec_ptr(&cpu,seg,ofs);

			for (x=0;x < 20;x++) {
				pdif = cpu.state.reg_ip_decompiler;
				printf("%04X:%04X ",cpu.state.reg_cs_decompiler,cpu.state.reg_ip_decompiler);

				if (!softx86_decompile(&cpu,decompiled))
					printf("{error} ");

/* how many opcodes? print them out beside the decompiled output */
				cc = 0;
				diff = (int)(cpu.state.reg_ip_decompiler - pdif);
				pdif += (cpu.state.reg_cs_decompiler<<4);
				while (diff > 0) {
					if (pdif < 0x100000) 
						printf("%02X ",RAM[pdif]);

					pdif++;
					diff--;
					cc++;
				}

				while (cc < 8) {
					printf("   ");
					cc++;
				}

				printf("%s\n",decompiled);
			}
		}
/* huh? */
		else {
			printf("huh?\n");
		}
	}

/* this function must be called to free resources associated with 
 * a context structure initialized by softx86_init() */
	if (!softx86_free(&cpu)) {
		printf("Softx86 library error: Unable to free CPU\n");
		return 1;
	}

#ifdef SOFT87FPU
	if (!softx87_free(&fpu)) {
		printf("Softx87 library error: Unable to free FPU\n");
		return 1;
	}
#endif

	delete RAM;
}
