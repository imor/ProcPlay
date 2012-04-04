; TEST PROGRAM #15
;
; (C) 2003 Jonthan Campbell <jcampbell@mdjk.com>
;
; Tests SOFTX86LIB's ability to handle group 3-1A instructions
; TEST r/m,imm, NOT r/m, NEG r/m, MUL r/m, IMUL r/m
;
; You will need NASM to assemble this.
;
                org             100h

start:
;----------------+
; TEST EMULATION |
;----------------+
; ...meaning... emulation of the "TEST" instruction.
		mov		al,0
		test		al,0
		jz		p1
		hlt

p1:		mov		al,0FFh
		test		al,0FFh
		jnz		p2
		hlt

p2:		mov		al,0FEh
		test		al,01h
		jz		p3
		hlt

p3:		mov		ax,0
		test		ax,0
		jz		p4
		hlt

p4:		mov		ax,05555h
		test		ax,0AAAAh
		jz		p5
		hlt

p5:

;---------------+
; NOT EMULATION |
;---------------+
; ...meaning... emulation of the "NOT" instruction.
nt1:		stc
		mov		al,0
		dec		al		; do something to set CF=1 ZF=0, SF=1
		not		al		; after this the flags should be unaffected
		jc		nt2		; if NOT affected the flags then...
		hlt				; CF would not be 1 (NOTE: DEC does not modify CF)
nt2:		js		nt3		; SF would be 0 since (NOT 0xFF == 0x00)
		hlt
nt3:		jnz		nt4		; ZF would be 0 since (NOT 0xFF == 0x00)
		hlt
nt4:

;---------------+
; NEG EMULATION |
;---------------+
ne1:		mov		al,0
		neg		al
		jz		ne2		; should be ZF=1 SF=0 AL=0
		hlt
ne2:		cmp		al,0
		jz		ne3
ne3:		jns		ne4
		hlt
ne4:

		mov		al,1
		neg		al
		jnz		ne5		; should be ZF=0 SF=1 AL=0xFF
		hlt
ne5:		js		ne6
		hlt
ne6:		cmp		al,0xFF
		jz		ne7
		hlt
ne7:

;---------------+
; MUL EMULATION |
;---------------+
mu1:		mov		al,1
		mov		bl,2
		mul		bl		; should be (for certain) AX=2, OF=0 CF=0
		jno		mu2
		hlt
mu2:		jnc		mu3
		hlt
mu3:		cmp		ax,2
		jz		mu4
		hlt
mu4:
		mov		al,10
		mov		cl,10
		mul		cl		; should be AX=100 CF=0 OF=0
		jnc		mu5
		hlt
mu5:		jno		mu6
		hlt
mu6:		cmp		ax,100
		jz		mu7
		hlt
mu7:
		mov		al,240
		mov		dl,200
		mul		dl		; should be AX=48000 CF=1 OF=1
		jc		mu8
		hlt
mu8:		jo		mu9
		hlt
mu9:		cmp		ax,48000
		jz		mua
		hlt
mua:

;----------------+
; IMUL EMULATION |
;----------------+
imu1:		mov		al,1
		mov		bl,1
		imul		bl		; should be AX=1 CF=0 OF=0
		jnc		imu2
		hlt
imu2:		jno		imu3
		hlt
imu3:		cmp		ax,1
		jz		imu4
		hlt
imu4:
		mov		al,1
		mov		cl,-1
		imul		cl		; should be AX=FFFFh CF=0 OF=0
		jnc		imu5
		hlt
imu5:		jno		imu6
		hlt
imu6:		cmp		ax,-1
		jz		imu7
imu7:
		mov		al,120
		mov		dl,100
		imul		dl		; should be AX=12000 CF=1 OF=1
		jc		imu8
		hlt
imu8:		jo		imu9
		hlt
imu9:		cmp		ax,12000
		jz		imua
		hlt
imua:
		mov		al,-110
		mov		dl,100
		imul		dl		; should be AX=-11000 CF=1 OF=1
		jc		imub
		hlt
imub:		jo		imuc
		hlt
imuc:		cmp		ax,-11000
		jz		imud
		hlt
imud:

;---------------+
; DIV EMULATION |
;---------------+
dv1:		mov		ax,1
		mov		bl,1
		div		bl		; should be AL=1 AH=0
		cmp		ax,00001h
		jz		dv2
		hlt
dv2:		mov		ax,7
		mov		dl,3
		div		dl		; should be AL=2 AH=1
		cmp		ax,00102h
		jz		dv3
		hlt
dv3:

;----------------+
; IDIV EMULATION |
;----------------+
idv1:		mov		ax,1
		mov		bl,1
		div		bl		; should be AL=1 AH=0
		cmp		ax,00001h
		jz		idv2
		hlt
idv2:		mov		ax,7
		mov		dl,3
		div		dl		; should be AL=2 AH=1
		cmp		ax,00102h
		jz		idv3
		hlt
idv3:

;---------------------------------------------
;DONE
;---------------------------------------------
; end
exit:
		mov		ax,4C00h
		int		21h
