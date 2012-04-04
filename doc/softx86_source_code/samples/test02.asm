; TEST PROGRAM #2
;
; (C) 2003 Jonthan Campbell <jcampbell@mdjk.com>
;
; Tests SOFTX86LIB's ability to handle simple one-opcode instructions
; like RET, NOP, etc.
;
; You will need NASM to assemble this.

                org             100h

start:
				add				al,4
				add				ax,17
				add				ax,0FFECh
				add				al,85h
				add				bl,al
				add				al,70h
				add				ch,al
				add				al,0F0h
				add				dh,al
				add				ch,dh
				add				dh,ch
				add				dl,[1234h]
				add				[1234h],ch
				add				bh,[bx+54]
				add				[bx+1234h],bl
				add				si,ax
				add				si,ax
				add				cx,[si]
				add				[di],bx
				mov				ah,al
				mov				cl,al
				mov				ch,al
				mov				dl,ah
				mov				dh,al
				mov				[si],ax
				mov				[si+2],bx
				mov				[si+4],cx
				mov				[si+6],dx
                ret

