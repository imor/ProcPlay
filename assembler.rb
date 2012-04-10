# require './fasm'
require './asm'
require './libc'
require 'ffi'
module Assembler
	def self.assemble(instruction_sequence)
		instruction_sequence.tr!(";", "\n") #Normalize to new line separators
		instruction_sequence.each_line.map { |i| assemble_instruction i }.flatten
	end

	private 
	def self.assemble_instruction(instruction)
		out_ptr = FFI::MemoryPointer.new 4
		size_of_machine_code = Asm::assemble_instruction(instruction, out_ptr)
		
		address_of_machine_code = out_ptr.read_int()
		ptr_to_machine_code = FFI::Pointer.new(address_of_machine_code)
		
		ptr_to_machine_code.read_bytes(size_of_machine_code)
	end

end
