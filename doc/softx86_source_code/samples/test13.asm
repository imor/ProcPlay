; TEST PROGRAM #13
;
; (C) 2003 Jonthan Campbell <jcampbell@mdjk.com>
;
; Tests SOFTX86LIB's ability to handle PUSH [mem] POP [mem]
;
; You will need NASM to assemble this.
;
                org             100h

start:
		mov		aX,CS
		mov		ds,ax
		mov		es,ax

		call		t1
t1:		pop		WORD [call1]
		mov		ax,[call1]
		cmp		ax,t1
		jz		p1
		hlt
p1:		
		push		WORD [call1]
		pop		ax
		cmp		ax,[call1]
		jz		p2
		hlt
p2:
; tada!

exit:
		mov		ax,4C00h
		int		21h

; some data

call1		dw		0
call2		dw		0
