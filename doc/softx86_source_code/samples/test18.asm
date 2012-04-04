; TEST PROGRAM #18
;
; (C) 2003 Jonthan Campbell <jcampbell@mdjk.com>
;
; Tests SOFTX86LIB's ability to handle LES, LDS
;
; You will need NASM to assemble this.
;
                org             100h

start:
		mov		ax,cs
		mov		ds,ax
		mov		WORD [somevar],1234h
		mov		WORD [somevar+2],5678h
		les		bx,[somevar]
		cmp		bx,1234h
		jz		t2
		hlt
t2:		mov		bx,es
		cmp		bx,5678h
		jz		t3
		hlt
t3:

		lds		bx,[somevar]
		cmp		bx,1234h
		jz		t4
		hlt
t4:		mov		bx,ds
		cmp		bx,5678h
		jz		t5
		hlt
t5:

;---------------------------------------------
;DONE
;---------------------------------------------
; end
exit:
		mov		ax,4C00h
		int		21h

somevar:
		dw		0,0
