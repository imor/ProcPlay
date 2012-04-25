#Puts the 2 times table into memory starting from 2
#going up to 20, at every word location. 
#The memory now acts like an array, storing the values {0,2,4,...,18,20}

#init registers
.register $s0 0		#addr
.register $s1 4		#increm addr
.register $s2 2		#number increm
.register $s3 0		#number val
.register $s4 22	#max number

#main loop
main:	add $s3, $s3, $s2	#incrememnt number val
		sw $s3, 0($s0)		#store number at the new address
		add $s0, $s0, $s1	#increment address
		beq $s3, $s4, exit	#check if reached max
		beq $zero, $zero, main	#start again
exit: 

