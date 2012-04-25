#Acts like the operation multiply
#Does 6*7 and places the result in memory at address 0

main: 	addi $s0, $0, 6		#input 1
		addi $s1, $0, 7		#input 2
loop:	add $s2, $s2, $s0	#newval+6
		addi $s3, $s3, 1	#increm counter
		beq $s3, $s1, done	#check if done
		j loop				#otherwise loop back
done:	sw $s2, 0($0)		#store result
