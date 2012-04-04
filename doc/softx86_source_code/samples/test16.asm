; TEST PROGRAM #16
;
; (C) 2003 Jonthan Campbell <jcampbell@mdjk.com>
;
; Tests SOFTX86LIB's ability to handle LOOPNZ, LOOPZ, LOOP
;
; You will need NASM to assemble this.
;
                org             100h

start:
; TEST #1: Simple loop that increments a variable
		xor		ax,ax
		mov		cx,16
loo1:		inc		ax
		loop		loo1
		or		cx,cx	; should be CX=0 AX=16
		jz		loo1b
		hlt
loo1b:		cmp		ax,16
		jz		loo1c
		hlt
loo1c:

; TEST #2: A more complicated loop that continues until a variable
;          is decremented to zero or until 10 iterations have
;          completed. The maximum is intentionally set to 10 knowing
;          that the variable to decrement has a value of 16 and that
;          the maximum will be reached first
		mov		cx,10
loo2:		dec		ax
		loopnz		loo2
		or		cx,cx	; should be CX=0 AX=6
		jz		loo2b
		hlt
loo2b:		cmp		ax,6
		jz		loo2c
		hlt
loo2c:

; TEST #3: Exactly like test 2. We continue reducing AX until zero.
		mov		cx,45
loo3:		dec		ax
		loopnz		loo3
		cmp		cx,39	; should be CX=39 AX=0
		jz		loo3b
		hlt
loo3b:		or		ax,ax
		jz		loo3c
		hlt
loo3c:

;---------------------------------------------
;DONE
;---------------------------------------------
; end
exit:
		mov		ax,4C00h
		int		21h
