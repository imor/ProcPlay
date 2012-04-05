require './fasm'
require './libc'

module Assembler
	def assemble(instructions)
		buf_size = 0x800000 # Saw this size used in the demo provided with fasm library
		buffer = LibC::malloc BUF_SIZE
		max_no_of_passes = 100 # This is the recommended value in fasm library documentation
		output_pipe = nil # We don't want no output to any pipe
		status = Fasm::fasm_Assemble(instructions, buffer, BUF_SIZE, output_pipe)

		if status != Fasm::FASM_OK
			raise RuntimeError "Failed to assemble instruction #{instruction}"
		end

		return buffer[:output_data].read_string()
	end
end
