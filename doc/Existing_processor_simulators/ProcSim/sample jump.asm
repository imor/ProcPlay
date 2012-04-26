#Puts the 20 times table into memory starting from 100 
#going up to 1000, at every word location. 
#The memory now acts like an array

.register $s0 0		#addr
.register $s1 4		#increm addr
.register $s2 22	#number increm
.register $s3 100	#number val
.register $s4 1000	#max number

main:	sw $s3, 0($s0)		#store number at the new address
		add $s0, $s0, $s1	#increment address
		add $s3, $s3, $s2	#incrememnt number val
		beq $s3, $s4, exit	#check if reached max
		j main				#start again
exit: