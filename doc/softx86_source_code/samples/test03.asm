; TEST PROGRAM #3
;
; (C) 2003 Jonthan Campbell <jcampbell@mdjk.com>
;
; Tests SOFTX86LIB's ability to handle MOV
;
; You will need NASM to assemble this.

                org             100h

start:
				mov				ax,bx
				mov				bx,cx
				mov				cx,dx
				mov				dx,ds
				mov				bx,cs
				mov				ax,ss
				mov				cx,es
				mov				ds,dx
;------------	mov				cs,bx		NASM DOES NOT LIKE THIS?!?!?!
;                                           TODO: IS THIS LEGAL OR NOT?
				mov				ss,ax
				mov				es,cx
				mov				al,[101h]
				mov				ax,[111h]
				mov				[4567h],ax
				mov				[89ABh],al
				mov				ah,012h
				mov				al,034h
				mov				bh,056h
				mov				bl,078h
				mov				ch,09Ah
				mov				cl,0BCh
				mov				dh,0DEh
				mov				dl,0F0h
                                mov                             ax,0FEDCh
                                mov                             bx,0BA98h
                                mov                             cx,07654h
                                mov                             dx,03210h
                                mov                             byte [300h],12h
                                mov                             byte [301h],34h
                                mov                             byte [bx],9Fh
                                mov                             byte [si],00h
                                mov                             byte [di+45h],12h
                                mov                             word [400h],3412h
                                mov                             word [402h],7856h
                                mov                             word [bx],0AA55h
                                mov                             word [bx+2],04567h
				ret

