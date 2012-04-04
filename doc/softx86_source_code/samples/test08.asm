; TEST PROGRAM #8
;
; (C) 2003 Jonthan Campbell <jcampbell@mdjk.com>
;
; Tests SOFTX86LIB's ability to handle the TEST, XCHG, and LEA instructions
;
; You will need NASM to assemble this.

                org             100h

start:
; how many fingers am I holding up? :)
		mov		ax,572h
		test		ax,111h		; any odd numbers?
		jnz		s2
		hlt				; CPU ERROR OCCURED! SHOULD NOT HAPPEN!
s2:

; how about now?
		mov		ax,666h
		test		ax,111h		; any odd numbers?
		jz		s3
		hlt				; CPU ERROR OCCURED! SHOULD NOT HAPPEN!
s3:

; now jump around and hoot like an owl...
		mov		cx,53h
		xchg		al,ah
		xchg		ax,cx
		test		ax,11h		; any odd numbers?
		jnz		s4
		hlt				; CPU ERROR OCCURED! SHOULD NOT HAPPEN!
s4:

; where are you now?
		mov		bx,524h
		lea		si,[bx]
		cmp		si,524h
		jz		s5
		hlt				; CPU ERROR OCCURED! SHOULD NOT HAPPEN!
s5:

; can you move a little farther away?
		mov		bx,666h
		lea		si,[bx+111h]
		cmp		si,777h
		jz		s6
		hlt				; CPU ERROR OCCURED! SHOULD NOT HAPPEN!
s6:

; how about now?
		mov		bx,1234h
		lea		si,[bx+9876h]
		cmp		si,0AAAAh	; AAAAAA!
		jz		s7
		hlt				; CPU ERROR OCCURED! SHOULD NOT HAPPEN!
s7:

exit:
		mov		ax,4C00h
		int		21h
