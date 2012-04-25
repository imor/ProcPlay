#Puts the 20 times table into memory starting from -100 
#going up to 500, at every word location. 
#The memory now acts like an array

main:	addi $s3, $zero, -100	#start val
		addi $s4, $zero, 500	#max number
loop:	sw $s3, 0($s0)		#store number at the new address
		addi $s0, $s0, 4	#increment address
		addi $s3, $s3, 20	#incrememnt number val
		beq $s3, $s4, exit	#check if reached max
		j loop				#start again
exit:
