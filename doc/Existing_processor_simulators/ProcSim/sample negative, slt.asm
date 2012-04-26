#Puts the 2 times table into memory starting from -10, 
#going up to 10, at every word location. 
#The memory acts like an array, storing the values {-10,-8,-6,...,8,10}
#This example uses slt to check if num<max, instead of using a beq, to check if reached max

#init registers
.register $s0 0		#addr
.register $s1 4		#increm addr
.register $s2 2		#number increm
.register $s3 -12	#number val
.register $s4 10	#max number
.register $s6 1		#slt check against

main:	add $s3, $s3, $s2	#increment number val
		sw $s3, 0($s0)		#store number at the new address
		add $s0, $s0, $s1	#increment address
		slt $s5, $s3, $s4	#check if reached max
		beq $s5, $s6, main	#if is less than max
exit: 

