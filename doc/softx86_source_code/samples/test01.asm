; TEST PROGRAM #1
;
; (C) 2003 Jonthan Campbell <jcampbell@mdjk.com>
;
; Tests SOFTX86LIB's ability to handle simple one-opcode instructions
; like RET, NOP, etc.
;
; You will need NASM to assemble this.

                org             100h

start:
                nop
                nop
                push            ax
                pop             bx
                push            cs
                pop             ds
                push            es
                pop             ds
                aaa
                aas
                cbw
                cwd
                clc
                stc
                cli
                sti
                cmc
                cld
                std
                hlt
                iret
                ret 25h
                retf 18h
                retf
                wait
                aad
                aam
                aad 16
                aam 24
                ret

