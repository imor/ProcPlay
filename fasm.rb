require 'ffi'

module Fasm
	extend FFI::Library
	if FFI::Platform.unix?
		ffi_lib "lib/libfasm.so"
	elsif FFI::Platform.windows?
		ffi_lib "lib/fasm.dll"
	else
		raise RuntimeError "Platform not supported. Only windows or unix platforms are supported."
	end
end