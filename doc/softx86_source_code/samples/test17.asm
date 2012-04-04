; TEST PROGRAM #17
;
; (C) 2003 Jonthan Campbell <jcampbell@mdjk.com>
;
; Tests SOFTX86LIB's ability to handle LOOPNZ, LOOPZ, LOOP
;
; You will need NASM to assemble this.
;
                org             100h

start:
; start by making a non-nested procedural frame with no dynamic storage
		mov		bp,45	; make BP a known value first
		mov		ax,sp
		enter		0,0	; should now be SP = AX - 2 and BP = AX - 2
		sub		ax,2
		cmp		ax,sp
		jz		ta1
		hlt
ta1:		cmp		ax,bp
		jz		ta2
		hlt
ta2:		leave
		add		ax,2
		cmp		ax,sp
		jz		ta3
		hlt
ta3:		cmp		bp,45
		jz		ta4
		hlt
ta4:

;---------------------------------------------
;DONE
;---------------------------------------------
; end
exit:
		mov		ax,4C00h
		int		21h
