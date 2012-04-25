#Just tests "and" and "or"

main:	addi $s1, $zero, 101 	#1100101
		addi $s2, $zero, 54		#0110110
		and $s3, $s1, $s2		#0100100		
		or $s4, $s1, $s2		#1110111
		andi $s5, $s1, 92		#1000100
		ori $s6, $s1, 13		#1101101
exit:
