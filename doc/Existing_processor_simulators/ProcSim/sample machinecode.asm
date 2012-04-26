#Puts the 2 times table into memory starting from 2
#going up to 20, at every word location. 
#The memory now acts like an array, storing the values {0,2,4,...,18,20}

#init registers
.register $s0 0		#addr
.register $s1 4		#increm addr
.register $s2 2		#number increm
.register $s3 0		#number val
.register $s4 22	#max number

00000010011100101001100000100000
10101110000100110000000000000000
00000010000100011000000000100000
00010010011101000000000000000001
00010000000000001111111111111011
