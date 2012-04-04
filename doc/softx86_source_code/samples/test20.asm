; TEST PROGRAM #20
;
; (C) 2003 Jonthan Campbell <jcampbell@mdjk.com>
;
; Tests SOFTX87LIB's ability to handle FINIT, FNOP, FLD, FINCSTP, FDECSTP, FFREE
;
; You will need NASM to assemble this.
;
                org             100h

start:
		finit
		fnop
		fld		qword [var1]
		fld		qword [var2]
		fld		st0
		fld		st2
; should be:
; ST(0) = 1.000000000
; ST(1) = 4.123456789
; ST(2) = 4.123456789
; ST(3) = 1.000000000
		fld		dword [var3]
		fld		dword [var4]
; should be:
; ST(0) = 3.1416 (approximately, due to inaccuracy)
; ST(1) = 11.457 (approximately, due to inaccuracy)
; ST(2) = 1.000000000
; ST(3) = 4.123456789
; ST(4) = 4.123456789
; ST(5) = 1.000000000
		fincstp
		fincstp
		fincstp
		fincstp
		fincstp
		fincstp
; should be:
; ST(0) = empty
; ST(1) = empty
; ST(2) = 3.1416 (approximately, due to inaccuracy)
; ST(3) = 11.457 (approximately, due to inaccuracy)
; ST(4) = 1.000000000
; ST(5) = 4.123456789
; ST(6) = 4.123456789
; ST(7) = 1.000000000
		fdecstp
		fdecstp
		fdecstp
		fdecstp
		fdecstp
		fdecstp
; should be
; ST(0) = 3.1416 (approximately, due to inaccuracy)
; ST(1) = 11.457 (approximately, due to inaccuracy)
; ST(2) = 1.000000000
; ST(3) = 4.123456789
; ST(4) = 4.123456789
; ST(5) = 1.000000000
; ST(6) = empty
; ST(7) = empty
		ffree st0
		ffree st1
		ffree st2
		ffree st3
		ffree st4
		ffree st5
; should be
; ST(0) = empty
; ST(1) = empty
; ST(2) = empty
; ST(3) = empty
; ST(4) = empty
; ST(5) = empty
; ST(6) = empty
; ST(7) = empty

;---------------------------------------------
;DONE
;---------------------------------------------
; end
exit:
		mov		ax,4C00h
		int		21h

; data
var1		dq		1.00
var2		dq		4.123456789
var3		dd		3.141592615
var4		dd		11.4561
