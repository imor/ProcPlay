; TEST PROGRAM #9
;
; (C) 2003 Jonthan Campbell <jcampbell@mdjk.com>
;
; Tests SOFTX86LIB's ability to handle direct absolute FAR JMPs and CALLs.
;
; You will need NASM to assemble this.

                org             100h

start:
		jmp		short start2
		call            0x1234:0x5678	; this is just for show
start2:
		mov		ax,cs
		mov		ds,ax
		mov		word [selfmod],cs	; self-modifying code

		db		0x9A		; CALL FAR
		dw		farcall_ofs	; to offset farcall_ofs
selfmod:	dw		0		; to segment... whatever
		jmp		starte		; avoid repeating this code!

farcall_ofs:	add		al,ah
		xor		bh,bh
		retf

starte:
		nop				; return from far calling fun

		jmp		jmpi2
		jmp             0xFEDC:0xBA98	; this is just for show
jmpi2:
		mov		word [selfmod2],cs	; self-modifying code
		db		0xEA		; JMP FAR
		dw		farcall_ofs2	; to offset farcall_ofs
selfmod2:	dw		0		; to segment... whatever
farcall_ofs2:
		nop
		nop
ofs2:

exit:
		mov		ax,4C00h
		int		21h
