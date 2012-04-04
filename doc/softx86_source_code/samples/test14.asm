; TEST PROGRAM #14
;
; (C) 2003 Jonthan Campbell <jcampbell@mdjk.com>
;
; Tests SOFTX86LIB's ability to handle SHL/SHR/SAR/ROL/RCL
;
; You will need NASM to assemble this.
;
                org             100h

start:
;-----------------------------------------------------
;******************** SHL checks *********************
;-----------------------------------------------------
		mov		ax,1
		shl		ax,3
		cmp		ax,8
		jz		p2
		hlt

p2:		shl		ax,2
		cmp		ax,32
		jz		p3
		hlt

p3:
		mov		bx,5
		shl		bx,2
		cmp		bx,20
		jz		p4
		hlt

; check whether or not CF flag is handled properly
p4:
		mov		cx,8000h
		shl		cx,1
		jnc		p4fail
		cmp		cx,0
		jnz		p4fail
		jmp		p5
p4fail:
		hlt

; check #2
p5:
		mov		dx,4000h
		shl		dx,2
		jnc		p5fail
		cmp		dx,0
		jnz		p5fail
		jmp		p6
p5fail:
		hlt

; check OF flag emulation
p6:
		mov		si,4000h
		shl		si,1
		jo		p6b		; should be OF=1, CF=0
		hlt
p6b:		cmp		si,8000h	; should be SI=8000h
		jz		p6c
		hlt
; check #2
p6c:		stc				; CF=1
		mov		si,0CFFFh
		shl		si,1
		jno		p6d		; should be OF=0,CF=1
		hlt
p6d:		cmp		si,09FFEh	; should be SI=09FFEh
		jz		p7
		hlt

; check SHL,CL usage
p7:		mov		bx,0C000h
		mov		cl,1
		shl		bx,cl
		jc		p7b
		hlt
p7b:		jno		p7c
		hlt
p7c:		cmp		bx,08000h
		jz		p7d
		hlt

; check #2
p7d:		shl		bx,cl
		jc		p7e
		hlt
p7e:		jo		p7f
		hlt
p7f:		cmp		bx,0
		jz		p7g
p7g:		nop

;-----------------------------------------------------
;******************** SHR checks *********************
;-----------------------------------------------------
		mov		ax,32
		shr		ax,3
		cmp		ax,4
		jz		pa2
		hlt

pa2:		shr		ax,2
		cmp		ax,1
		jz		pa3
		hlt

pa3:
		mov		bx,50
		shr		bx,2
		cmp		bx,12
		jz		pa4
		hlt

; check whether or not CF flag is handled properly
pa4:
		mov		cx,1
		shr		cx,1
		jnc		pa4fail
		cmp		cx,0
		jnz		pa4fail
		jmp		pa5
pa4fail:
		hlt

; check #2
pa5:
		mov		dx,2
		shr		dx,2
		jnc		pa5fail
		cmp		dx,0
		jnz		pa5fail
		jmp		pa6
pa5fail:
		hlt

; check OF flag emulation
pa6:
		mov		si,8001h
		shr		si,1
		jo		pa6b		; should be OF=1, CF=1
		hlt
pa6b:		jc		pa6c
		hlt
pa6c:		cmp		si,4000h	; should be SI=4000h
		jz		pa7
		hlt

; check SHR,CL usage
pa7:		mov		bx,3
		mov		cl,1
		shr		bx,cl
		jc		pa7b
		hlt
pa7b:		jno		pa7c
		hlt
pa7c:		cmp		bx,1
		jz		pa7d
		hlt

; check #2
pa7d:		shr		bx,cl
		jc		pa7e
		hlt
pa7e:		cmp		bx,0
		jz		pa7f
pa7f:		nop

;-----------------------------------------------------
;******************** SAR checks *********************
;-----------------------------------------------------
sar1:		mov		al,80h
		sar		al,1
		cmp		al,0C0h
		jz		sar2
		hlt

sar2:		mov		al,40h
		sar		al,2
		cmp		al,10h
		jz		sar3
		hlt

sar3:		mov		al,80h
		mov		cl,7
		sar		al,cl
		cmp		al,0FFh
		jz		sar4
		hlt

sar4:		mov		al,07Fh
		mov		cl,7
		sar		al,cl
		cmp		al,0
		jz		sar5
		hlt

sar5:

;-----------------------------------------------------
;******************** ROL checks *********************
;-----------------------------------------------------
rol1:		mov		al,80h
		rol		al,1
		jc		rol2	; should be AL=01h CF=1 OF=1
		hlt
rol2:		jo		rol3
		hlt
rol3:		cmp		al,1
		jz		rol4
		hlt

; check #2
rol4:		mov		al,0C0h
		rol		al,1
		jc		rol5	; should be AL=81h CF=1 OF=0
		hlt
rol5:		jno		rol6
		hlt
rol6:		cmp		al,81h
		jz		rol7
		hlt

; check #3
rol7:		mov		al,12h
		mov		cl,4
		rol		al,cl
		jc		rol8	; should be AL=21h CF=1 OF=?
		hlt
rol8:		cmp		al,21h
		jz		rol9
		hlt
rol9:

;-----------------------------------------------------
;******************** ROR checks *********************
;-----------------------------------------------------
ror1:		mov		al,1
		ror		al,1
		jc		ror2	; should be AL=80h CF=1 OF=1
		hlt
ror2:		jo		ror3
		hlt
ror3:		cmp		al,80h
		jz		ror4
		hlt

ror4:		mov		al,81h
		ror		al,1
		jc		ror5	; should be AL=C0h CF=1 OF=0
		hlt
ror5:		jno		ror6
		hlt
ror6:		cmp		al,0C0h
		jz		ror7
		hlt

ror7:		mov		al,49h
		mov		cl,4
		ror		al,cl	; should be AL=94h CF=1 OF=?
		jc		ror8
		hlt
ror8:		cmp		al,94h
		jz		ror9
		hlt
ror9:

;-----------------------------------------------------
;******************** RCL checks *********************
;-----------------------------------------------------
rcl1:		clc
		mov		al,80h
		rcl		al,1	; should be AL=00h CF=1
		jc		rcl2
		hlt
rcl2:		cmp		al,0
		jz		rcl3
		hlt

; check #2
rcl3:		stc
		mov		al,80h
		rcl		al,1	; should be AL=1 CF=1
		jc		rcl4
		hlt
rcl4:		cmp		al,1
		jz		rcl5
		hlt

; check #3
rcl5:		clc
		mov		al,011h
		mov		cl,4
		rcl		al,cl	; should be AL=10h CF=1
		jc		rcl6
		hlt
rcl6:		cmp		al,10h
		jz		rcl7
		hlt

; check #4
rcl7:		stc
		mov		al,011h
		mov		cl,4
		rcl		al,cl	; should be AL=18h CF=1
		jc		rcl8
		hlt
rcl8:		cmp		al,018h
		jz		rcl9
		hlt

; check #5
rcl9:		stc
		mov		al,07Fh
		rcl		al,1	; should be AL=0FFh CF=0
		jnc		rcla
		hlt
rcla:		cmp		al,0FFh
		jz		rclb
		hlt

; done
rclb:

;-----------------------------------------------------
;******************** RCR checks *********************
;-----------------------------------------------------
rcr1:		clc
		mov		al,1
		rcr		al,1	; should be AL=00h CF=1
		jc		rcr2
		hlt
rcr2:		cmp		al,0
		jz		rcr3
		hlt

; check #2
rcr3:		stc
		mov		al,1
		rcr		al,1	; should be AL=80h CF=1
		jc		rcr4
		hlt
rcr4:		cmp		al,80h
		jz		rcr5
		hlt

; check #3
rcr5:		clc
		mov		al,11h
		mov		cl,4
		rcr		al,cl	; should be AL=21h CF=0
		jnc		rcr6
		hlt
rcr6:		cmp		al,21h
		jz		rcr7
		hlt

; done
rcr7:

;---------------------------------------------
;DONE
;---------------------------------------------
; end
exit:
		mov		ax,4C00h
		int		21h
