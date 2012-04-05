require './fasm'

module Assembler
	def assemble(instructions)
	  
	end

	def assemble_instruction(instruction)
		constituents = instruction.split()
		if constituents.length < 2 || constituents.length > 3
			raise RuntimeError "Invalid instruction '#{instruction}'"
		end
		operator = constituents[0].trim().lowercase()
		oprand1 = constituents[1].trim().lowercase()
		oprand2 = constituents.length == 3 ? constituents[2].trim().lowercase() : nil
		
		case operator
		when "add"
			assemble_add(operator, operand1, operand2)
		when "sub"
			assemble_sub(operator, operand1, operand2)
		when "mov"
			assemble_mov(operator, operand1, operand2)
		when "mul"
			assemble_mul(operator, operand1)
		when "div"
			assemble_div(operator, operand1)
		end
	end

	def assemble_mov(operator, operand1, operand2)
	  
	end
	
	def assemble_add(operator, operand1, operand2)
	end

	def assemble_sub(operator, operand1, operand2)
	end

	def assemble_div(operator, operand)
	end

	def assemble_mul(operator, operand)
	end
end
