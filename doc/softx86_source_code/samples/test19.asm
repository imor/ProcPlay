; TEST PROGRAM #19
;
; (C) 2003 Jonthan Campbell <jcampbell@mdjk.com>
;
; Tests SOFTX86LIB's ability to handle BOUND
;
; You will need NASM to assemble this.
;
                org             100h

start:
; set up our own interrupt handler for INT 5 (BOUND exception)
		xor		ax,ax
		mov		ds,ax
		mov		WORD [(5*4)+0],boundexcept
		mov		WORD [(5*4)+2],cs
; begin test
		mov		ax,cs
		mov		ds,ax
		mov		ax,0
		mov		WORD [somebound],4000h
		mov		WORD [somebound+2],5500h
; test in-bound case
		mov		cx,4700h
		bound		cx,[somebound]
; AX should be 0 to indicate exception was not triggered
		or		ax,ax
		jz		boun2
		hlt
boun2:
; test out-of-bound case
		mov		cx,7600h
		bound		cx,[somebound]
; AX should be 1 because exception should have triggered
		cmp		ax,1
		jz		boun3
		hlt
boun3:
; make sure CPU knows that it's supposed to treat the index
; and boundaries as signed integers (according to Intel's
; documentation)
		xor		ax,ax
		mov		es,ax
		mov		WORD [es:((5*4)+0)],boundexcept2
		mov		WORD [somebound],-3400
		mov		WORD [somebound+2],2100
		mov		cx,100
		bound		cx,[somebound]
; if the CPU treated these as unsigned the exception wouldv'e
; triggered becasue -3400 converted to unsigned is 62136
; AX should be zero
		or		ax,ax
		jz		boun4
		hlt
boun4:
; test #2 to ensure signed number comparison
		mov		cx,-1600
		bound		cx,[somebound]
		or		ax,ax
		jz		boun5
		hlt
boun5:
; now intentionally cause a out of bounds condition
		mov		cx,-4800
		bound		cx,[somebound]
		cmp		ax,1
		jz		boun6
		hlt
boun6:

;---------------------------------------------
;DONE
;---------------------------------------------
; end
exit:
		mov		ax,4C00h
		int		21h

;---------------------------------------------
; BOUND exception handler
;---------------------------------------------
boundexcept:	mov		ax,1
; assuming our code is at fault, modify the register
; we used so that when we return it works. We set
; AX=1 so our code knows that this happened.
		mov		cx,4500h
		iret

boundexcept2:	mov		ax,1
; assuming our code is at fault, modify the register
; we used so that when we return it works. We set
; AX=1 so our code knows that this happened.
		mov		cx,-10
		iret

somebound:
		dw		0,0
