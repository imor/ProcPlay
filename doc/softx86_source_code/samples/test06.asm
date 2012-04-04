; TEST PROGRAM #6
;
; (C) 2003 Jonthan Campbell <jcampbell@mdjk.com>
;
; Tests SOFTX86LIB's ability to handle software interrupts and segment overrides
;
; You will need NASM to assemble this.

                org             100h

start:
; set up some interrupt vector 5Fh
		mov		ax,0
		mov		es,ax
		mov		ax,cs
		mov		bx,WORD [es:05Fh*4]		; save old one
		mov		cx,WORD [es:(05Fh*4)+2]
		mov		[old_5f],bx
		mov		[old_5f+2],cx
		mov		WORD [es:05Fh*4],my_interrupt
		mov		WORD [es:(05Fh*4)+2],ax

; try it
		int		5Fh

; restore
		mov		ax,0
		mov		es,ax
		mov		bx,[old_5f]
		mov		cx,[old_5f+2]
		mov		WORD [es:05Fh*4],bx
		mov		WORD [es:(05Fh*4)+2],cx

		ret

my_interrupt:
		mov		ax,1234h
		mov		bx,5678h
		mov		cx,8765h
		mov		dx,4321h
		iret

old_5f		dd		0
