; TEST PROGRAM #11
;
; (C) 2003 Jonthan Campbell <jcampbell@mdjk.com>
;
; Tests SOFTX86LIB's ability to handle [REP] CMPS, SCAS
;
; You will need NASM to assemble this.
;
                org             100h

start:
		mov		aX,CS
		mov		ds,ax
		mov		es,ax

; one-shot CMPSB looped 26 times
		cld
		mov		cx,26
		mov		si,twins1
		mov		di,twins2
cmpsb_again:	cmpsb
		jnz		cmpsb_failure
		dec		cx
		jnz		cmpsb_again
		cmp		si,twins1+26
		jnz		cmpsb_failure
		cmp		di,twins2+26
		jnz		cmpsb_failure

; REP CMPSB
		cld
		mov		cx,26
		mov		si,twins1
		mov		di,twins2
		rep		cmpsb
		jnz		cmpsb_failure		; should be ZF=1
		cmp		cx,0			; should be CX=0
		jnz		cmpsb_failure
		cmp		si,twins1+26
		jnz		cmpsb_failure
		cmp		di,twins2+26
		jnz		cmpsb_failure

; Look for the 'i' in 'teamwork'. it's gotta be there somewhere... :)
		cld
		mov		cx,8
		mov		di,teamwork
		mov		al,'i'
		repne		scasb			; while ([di] != AL) di++...

		jz		scasb_failure		; there is no 'i' in 'teamwork'
							; this search must fail.
							; if it succeeds there must be
							; something fundamentally wrong
							; with the CPU (virtual or not).
		cmp		cx,0			; CX should be zero
		jnz		scasb_failure
		cmp		di,teamwork+8
		jnz		scasb_failure

; can I buy a vowel?
		cld
		mov		cx,8
		mov		di,teamwork
		mov		al,'a'
		repne		scasb			; while ([di] != AL) di++...

		jnz		scasb_failure		; there is an 'a' in 'teamwork'...
		cmp		cx,5			; CX should be 5.
							; 'a' is the 3rd letter in 'teamwork'
							; and 8 - 3 = 5
		jnz		scasb_failure
		cmp		di,teamwork+3		; DI should point directly after 'a'
		jnz		scasb_failure

; tada!

exit:
		mov		ax,4C00h
		int		21h

cmpsb_failure:
scasb_failure:
		hlt
		jmp		cmpsb_failure

; some data

twins1		db		'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
twins2		db		'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

teamwork	db		'teamwork'
