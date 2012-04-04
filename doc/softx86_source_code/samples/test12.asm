; TEST PROGRAM #12
;
; (C) 2003 Jonthan Campbell <jcampbell@mdjk.com>
;
; Tests SOFTX86LIB's ability to handle CALL r/m JMP r/m
;
; You will need NASM to assemble this.
;
                org             100h

start:
		mov		aX,CS
		mov		ds,ax
		mov		es,ax

		mov		ax,hoop_1
		call		ax		; call hoop_1
		hlt

hoop_1:		pop		ax		; discard return address

		mov		WORD [call1],hoop_2
		call		WORD [call1]	; call hoop_2
		hlt

hoop_2:		pop		ax		; discard return address

		mov		ax,hoop_3
		jmp		ax
		hlt

hoop_3:		nop				; tada!

		mov		WORD [call1],hoop_4
		jmp		WORD [call1]
		hlt

hoop_4:		nop				; tada!

		mov		WORD [call1],hoop_5	; [call2]:[call1] = cs:hoop_5
		sub		WORD [call1],10h
		mov		ax,cs
		inc		ax
		mov		WORD [call2],ax	; now [call2]:[call1] = cs+1:hoop_5-10h
						; in real mode this is the same as cs:hoop_5.
						; this is the kind of fun we get to have
						; in real-mode DOS!
		call far	WORD [call1]
		jmp		hoop_5b
		hlt

hoop_5:		retf				; return immediately
hoop_5b:	nop				; TADA!

		mov		WORD [call1],hoop_6	; [call2]:[call1] = cs:hoop_6
		sub		WORD [call1],20h
		mov		ax,cs
		add		ax,2
		mov		WORD [call2],ax	; now [call2]:[call1] = cs+2:hoop_6-20h
						; in real mode this is the same as cs:hoop_6.
						; this is the kind of fun we get to have
						; in real-mode DOS!
		jmp far		WORD [call1]
		hlt

hoop_6:		mov		WORD [call1],hoop_6b
		mov		ax,cs
		sub		ax,2
		mov		WORD [call2],ax
		jmp far		WORD [call1]
hoop_6b:	nop				; TADA!

; tada!

exit:
		mov		ax,4C00h
		int		21h

cmpsb_failure:
scasb_failure:
		hlt
		jmp		cmpsb_failure

; some data

call1		dw		0
call2		dw		0
