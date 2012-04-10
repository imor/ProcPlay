require 'ffi'

module Asm
	extend FFI::Library
	
	if FFI::Platform.unix?
		ffi_lib "lib/libasm.so"
	elsif FFI::Platform.windows?
		# TODO: Add support for Windows.
		#ffi_lib "lib/asm.dll"
	else
		raise RuntimeError "Platform not supported. Only windows or unix platforms are supported."
	end

  attach_function :assemble_instruction, [ :string, :int, :pointer ], :ulong # TODO: confirm that the return type should indeed be ulong
end
