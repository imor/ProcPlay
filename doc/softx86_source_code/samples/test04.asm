; TEST PROGRAM #4
;
; (C) 2003 Jonthan Campbell <jcampbell@mdjk.com>
;
; Tests SOFTX86LIB's ability to handle IN/OUT and INC
;
; You will need NASM to assemble this.

                org             100h

start:
; write to Magic Register #1 test value 5555h
				mov	ax,5555h
				mov	dx,1234h
				out	dx,ax
; read back
				mov	ax,0
				in	ax,dx
; AX should now be 5555h + 2222h = 7777h
				out	dx,ax
				mov	ax,0
				in	ax,dx
; AX should now be 7777h + 2222h = 9999h
				mov	al,11h
				out	dx,al
				in	al,dx
; AL should now be 11h + 22h = 33h
				out	dx,al
				mov	al,0
				in	al,dx
; AL should now be 33h + 22h = 55h
				mov	al,0FFh
				out	9Ah,al
				in	al,9Ah
; AL should be zero
				out	9Ah,al
				in	al,9Ah
; AL should be 1
				out	9Ah,al
				in	al,9Ah
; AL should be 2
				out	9Ah,al
				in	al,9Ah
; AL should be 3
				out	9Ah,al
				in	al,9Ah
; AL should be 4
				out	9Ah,al
				in	al,9Ah
; AL should be 5
				out	9Ah,al
				in	al,9Ah

				mov	ah,0
				inc	ah
				inc	ah
				inc	ah
				inc	ah
				inc	ah
				inc	ah
				inc	ax
				inc	bx
				inc	cx
				inc	dx
				inc	si
				inc	di
				inc	word [1234h]
				inc	word [bx+si]
; undo our damage
				dec	ah
				dec	ah
				dec	ah
				dec	ah
				dec	ah
				dec	ah
				dec	ax
				dec	bx
				dec	cx
				dec	dx
				dec	si
				dec	di
				dec	word [1234h]
				dec	word [bx+si]
				ret
