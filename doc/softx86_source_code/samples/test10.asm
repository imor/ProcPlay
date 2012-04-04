; TEST PROGRAM #10
;
; (C) 2003 Jonthan Campbell <jcampbell@mdjk.com>
;
; Tests SOFTX86LIB's ability to handle [REP] MOVS, LODS, STOS
;
; You will need NASM to assemble this.
;
; WARNING: ASSUMES CS==DS==ES on startup! If this is not the case this program
;          can potentially corrupt memory!

                org             100h

start:
; test case #1: the all too familiar REP MOSVB loop
;               yawn.... been there... done that...
;               haven't we all?
;
;               so let's spice up this example by
;               copying our own code somewhere else (offset 0x3100)
;               patching it, and calling it like
;               a subroutine!
suicide_jump_here:
                cld
		mov		si,100h
		mov		di,3100h
		movsb				; standalone MOVSB test
		movsb				; standalone MOVSB test
		mov		cx,1Eh		; this should cover this part of the code
		rep		movsb

; then... insert a RET instruction at this point in the code
; through self-multilation---er---modification. Not at this
; address here, but at the copy we just made @ 0x3100.
patch_here:	nop

; unlike the copy @ 0x3100, execution will not get this far.
; at this point, apply the patch and call it like a routine.
; we must patch both the copy and the original since the same
; code executed like a subroutine will simply copy over itself.
; it will not crash because it's the same data, but if the original
; is not patched the "NOP" will remain and the program will eventually
; overrun the stack copying itself and calling itself recursively. NOT GOOD!
;
; BTW, this seems to easily defeat DOS DEBUG.COM's ability to procedure-step
; through this part of the code! If you try to skip over the REP MOVSB
; in one step using 'p' you'll suddenly find yourself at the program's
; exit point. Single stepping is not affected.
		mov		byte [patch_here],0xC3	; RET
		mov		byte [patch_here+0x3000],0xC3	; RET
		call		suicide_jump_here+0x3000

; test 2: sdrawkcab gniypoc
		std
		mov		si,0xFF		; this time copy our PSP!
		mov		di,0x30FF
		mov		cx,0xFE		; 0xFE + 2 standalone MOVSBs
		movsb				; test of MOVSB without REP
		movsb				; test of MOVSB without REP
		rep		movsb

; is that my INT 20h? If not, panic.
		cmp		word [0x3000],0x20CD
		jz		t2good
		hlt
		jmp		short $
t2good:

; test 3: copying WORDs at a time
		cld
		mov		si,100h
		mov		di,4100h
		mov		cx,100h		; 0x100 WORDS = 0x200 BYTES
		rep		movsw

; test 4: loading data
		mov		si,0		; playing with our PSP
		mov		di,0x5000
		lodsb
		stosb
		cmp		al,0CDh
		jz		t3agood
		hlt
		jmp		short $
t3agood:	lodsb
		stosb
		cmp		al,20h
		jz		t4agood
		hlt
		jmp		short $
t4agood:

; tada!

exit:
		mov		ax,4C00h
		int		21h
