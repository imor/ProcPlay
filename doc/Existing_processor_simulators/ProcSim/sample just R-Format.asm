#Testing r-format arithmetic operators

#init registers
.register $s0 -10
.register $s1 5
.register $s2 3


main:	add $s3, $s1, $s1	#5+5
		add $s4, $s1, $s0	#5+-10
		sub $s5, $s1, $s2	#5-3
		sub $s6, $s2, $s1	#3-5
		and $s7, $s2, $s1	#011 AND 101
exit: 

