; TEST PROGRAM #7
;
; (C) 2003 Jonthan Campbell <jcampbell@mdjk.com>
;
; Tests SOFTX86LIB's ability to handle J<conditional> instructions
;
; You will need NASM to assemble this.

                org             100h

start:
		mov		ax,52h
		mov		bx,4
		mov		cx,229

loop1:
		add		ax,bx
		sub		cx,bx
		cmp		ax,56h
		jz		loop2	; AX should be 56h and CMP AX,56h should set JZ
; SHOULDN'T BE HERE!!!!!
		hlt

loop2:
		xor		ax,ax
		cmp		ax,0
		jz		loop3	; AX should be 0 and CMP AX,0 should set JZ
; SHOULDN'T BE HERE!!!!!
		hlt

loop3:		stc			; set carry
		jc		loop4	; JC should go to label loop4
; SHOULDN'T BE HERE!!!!!
		hlt

loop4:		clc			; clear carry
		jnc		exit	; JC should go to label exit
; SHOULDN'T BE HERE!!!!!
		hlt

exit:
		mov		ax,4C00h
		int		21h
