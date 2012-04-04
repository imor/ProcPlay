; TEST PROGRAM #5
;
; (C) 2003 Jonthan Campbell <jcampbell@mdjk.com>
;
; Tests SOFTX86LIB's ability to handle ADD/SUB/ADC/SBB/XOR/OR/AND/CMP
;
; You will need NASM to assemble this.

                org             100h

start:
		mov		ax,0
		add		ax,1234h
		mov		bx,ax
		add		bx,1000h
		mov		cx,bx
		add		cx,2000h
		mov		dx,cx
		add		dx,3111h
		mov		si,dx
		add		si,1000h
		mov		di,si
		add		di,2000h

		mov		ax,0
		adc		al,0C0h
		adc		al,50h
		adc		ah,0
		mov		bx,ax
		adc		bl,090h
		adc		bh,0
		adc		bl,080h
		adc		bh,0

		sub		ah,1
		sub		al,10h
		sub		bx,220h
		sub		cx,4234h
		sub		dh,73h
		sub		dl,45h
		sub		si,8345h
		sub		di,0A345h

; now subtract 0x35 from 0x200000 in DX:AX using CL to subtract
		mov		dx,20h
		mov		ax,0
		mov		cl,35h		; lowest 8 bits
		sub		al,cl
		mov		cl,0		; nothing after that
		sbb		ah,cl
		sbb		dl,cl
		sbb		dh,cl

; now subtract 0x1 from 0x100000 in DX:AX
		mov		dx,10h
		mov		ax,0
		sub		al,1
		sbb		ah,0
		sbb		dl,0
		sbb		dh,0

; XOR obsession
		mov		ax,1234h
		mov		bx,ax
		xor		bx,4918h
		mov		cx,bx
		xor		cx,916Ah
		mov		dx,cx
		xor		dx,0E48Fh
		xor		ax,ax
		xor		bx,bx
		xor		cx,cx
		xor		dx,dx
		xor		si,si
		xor		di,di

; OR obsession
		mov		ax,1234h
		mov		bx,ax
		or		bx,4918h
		mov		cx,bx
		or		cx,916Ah
		mov		dx,cx
		or		dx,0E48Fh
		or		ax,ax
		or		bx,bx
		or		cx,cx
		or		dx,dx
		or		si,si
		or		di,di
		or		ax,bx
		or		ax,cx
		or		ax,dx
		or		ax,si
		or		ax,di

; AND obsession
		mov		ax,0FFFFh
		mov		bx,ax
		and		bx,0E7E7h
		and		ax,bx
		mov		cx,bx
		and		cx,01111h
		mov		dx,ax
		and		dx,0
		mov		si,ax
		and		si,0FFFFh

; I love comparing numbers! It's so much fun!!!!
		mov		ax,2
		cmp		ax,2
		mov		ax,55h
		cmp		ax,666h
		mov		ax,4891h
		mov		bx,9184h
		cmp		ax,bx
		mov		cx,31h
		cmp		cx,ax
		cmp		ax,cx
		mov		dx,3522h
		cmp		dx,bx
		mov		si,5266h
		cmp		si,ax
		cmp		bx,si

		ret
