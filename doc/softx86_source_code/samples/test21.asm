; TEST PROGRAM #21
;
; (C) 2003 Jonthan Campbell <jcampbell@mdjk.com>
;
; Tests SOFTX87LIB's ability to handle FINIT, FLD, FADD, FADDP
;
; You will need NASM to assemble this.
;
                org             100h

start:
; test 1
		finit
		fld		qword [var1]
		fld		qword [var2]
		fadd		st0,st1
; should be:
; ST(0) = 5.00
; ST(1) = 2.00

; test 2
		fld		qword [var3]
		fld		qword [var4]
		fadd		st0,st1
; should be:
; ST(0) = 1.00
; ST(1) = 3.00

; test 3
		fld		qword [var5]
		fld		qword [var6]
		fadd		st0,st1
; should be:
; ST(0) = -1.00
; ST(1) = -5.00
; ST(2) = 1.00
; ST(3) = -2.00
; ST(4) = 5.00
; ST(5) = 2.00

; test 4
		fld		dword [var7]
		fadd		st0,st1
		fadd		st0,st2
		fadd		st0,st3
		fadd		st0,st4
		fadd		st0,st5
		fadd		st0,st6
; should be:
; ST(0) = 9.00 + (-1.00 + -5.00 + 1.00 + -2.00 + 5.00 + 2.00 = -8.00 + 8.00) = 9.00
; ST(1) = -1.00
; ST(2) = -5.00
; ST(3) = 1.00
; ST(4) = -2.00
; ST(5) = 5.00
; ST(6) = 2.00

; test 5
		fld		dword [var8]
		fadd		st1,st0
		fadd		st2,st0
		fadd		st3,st0
		fadd		st4,st0
		fadd		st5,st0
		fadd		st6,st0
		fadd		st7,st0
; should be:
; ST(0) = 1.00
; ST(1) = 10.00
; ST(2) = 0.00
; ST(3) = -4.00
; ST(4) = 2.00
; ST(5) = -1.00
; ST(6) = 6.00
; ST(7) = 3.00

; test 6
		faddp		st1,st0		; 1.00 + 10.00 = 11.00
		faddp		st1,st0		; 11.00 + 0.00 = 11.00
		faddp		st1,st0		; 11.00 + -4.00 = 7.00
		faddp		st1,st0		; 7.00 + 2.00 = 9.00
		faddp		st1,st0		; 9.00 + -1.00 = 8.00
		faddp		st1,st0		; 8.00 + 6.00 = 14.00
		faddp		st1,st0		; 14.00 + 3.00 = 17.00
; should be:
; ST(0) = 1.0 + 10.00 + 0.00 + -4.00 + 2.00 + -1.00 + 6.00 + 3.00 = 17.00

; test 7
		fld		qword [var1]	; => ST(0) = 2.00
		fadd		qword [var2]	; => ST(0) = 5.00
		fadd		qword [var3]	; => ST(0) = 3.00
		fadd		qword [var4]	; => ST(0) = 6.00
		fadd		dword [var7]	; => ST(0) = 15.00
		fadd		dword [var8]	; => ST(0) = 16.00
		fiadd		dword [var9]	; => ST(0) = 0.00
		fiadd		dword [var10]	; => ST(0) = 5.00
		fiadd		 word [var11]	; => ST(0) = 0.00
		fiadd		 word [var12]	; => ST(0) = 100.00

;---------------------------------------------
;DONE
;---------------------------------------------
; end
exit:
		mov		ax,4C00h
		int		21h

; data
var1		dq		 2.00
var2		dq		 3.00
var3		dq		-2.00
var4		dq		 3.00
var5		dq		-5.00
var6		dq		 4.00
var7		dd		 9.00
var8		dd		 1.00
var9		dd		-16
var10		dd		 5
var11		dw		-5
var12		dw		 100
