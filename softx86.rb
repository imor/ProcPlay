require 'ffi'

module Softx86
  extend FFI::Library
  
  if FFI::Platform.unix?
    ffi_lib "lib/libsoftx86.so"
  elsif FFI::Platform.windows?
    ffi_lib "lib/softx86.dll"
  else
    raise RuntimeError "Platform not supported. Only windows or unix platforms are supported."
  end
  
  SOFTX86_VERSION_HI = 0
  SOFTX86_VERSION_LO = 0
  SOFTX86_VERSION_SUBLO = 29
  class Softx86RegvalW < FFI::Struct
    layout(
           :lo, :ushort,
           :hi, :ushort
    )
  end
  class Softx86RegvalB < FFI::Struct
    layout(
           :lo, :uchar,
           :hi, :uchar,
           :extra, [:uchar, 2]
    )
  end
# FIXME: Nested structures are not correctly supported at the moment.
# Please check the order of the declarations in the structure below.
  class Softx86Regval < FFI::Union
    layout(
           :val, :uint,
           :b, Softx86RegvalB,
           :w, Softx86RegvalW
    )
  end
  class Softx86Segregval < FFI::Struct
    layout(
           :val, :ushort,
           :cached_linear, :uint
    )
  end
  SX86_REG_AX = 0
  SX86_REG_CX = 1
  SX86_REG_DX = 2
  SX86_REG_BX = 3
  SX86_REG_SP = 4
  SX86_REG_BP = 5
  SX86_REG_SI = 6
  SX86_REG_DI = 7

  SX86_REG_AL = 0
  SX86_REG_CL = 1
  SX86_REG_DL = 2
  SX86_REG_BL = 3
  SX86_REG_AH = 4
  SX86_REG_CH = 5
  SX86_REG_DH = 6
  SX86_REG_BH = 7

  SX86_SREG_ES = 0
  SX86_SREG_CS = 1
  SX86_SREG_SS = 2
  SX86_SREG_DS = 3

  class Softx86Cpustate < FFI::Struct
    layout(
           :general_reg, [Softx86Regval, 8],
           :segment_reg, [Softx86Segregval, 8],
           :reg_flags, Softx86Regval,
           :reg_ip, :uint,
           :reg_cs_exec_initial, :ushort,
           :reg_ip_exec_initial, :uint,
           :reg_cs_decompiler, :ushort,
           :reg_ip_decompiler, :uint,
           :int_hw_flag, :uchar,
           :int_hw, :uchar,
           :int_nmi, :uchar
    )
  end
  class Softx86Callbacks < FFI::Struct
    layout(
           :on_read_memory, callback([ :pointer, :uint, :pointer, :int ], :void),
           :on_read_io, callback([ :pointer, :uint, :pointer, :int ], :void),
           :on_write_memory, callback([ :pointer, :uint, :pointer, :int ], :void),
           :on_write_io, callback([ :pointer, :uint, :pointer, :int ], :void),
           :on_hw_int, callback([ :pointer, :uchar ], :void),
           :on_sw_int, callback([ :pointer, :uchar ], :void),
           :on_hw_int_ack, callback([ :pointer, :uchar ], :void),
           :on_nmi_int, callback([ :pointer ], :void),
           :on_nmi_int_ack, callback([ :pointer ], :void),
           :on_idle_cycle, callback([ :pointer ], :void),
           :on_reset, callback([ :pointer ], :void),
           :on_fpu_opcode_exec, callback([ :pointer, :pointer, :uchar ], :int),
           :on_fpu_opcode_dec, callback([ :pointer, :pointer, :uchar, [:char, 128] ], :int)
    )
    def on_read_memory=(cb)
      @on_read_memory = cb
      self[:on_read_memory] = @on_read_memory
    end
    def on_read_memory
      @on_read_memory
    end
    def on_read_io=(cb)
      @on_read_io = cb
      self[:on_read_io] = @on_read_io
    end
    def on_read_io
      @on_read_io
    end
    def on_write_memory=(cb)
      @on_write_memory = cb
      self[:on_write_memory] = @on_write_memory
    end
    def on_write_memory
      @on_write_memory
    end
    def on_write_io=(cb)
      @on_write_io = cb
      self[:on_write_io] = @on_write_io
    end
    def on_write_io
      @on_write_io
    end
    def on_hw_int=(cb)
      @on_hw_int = cb
      self[:on_hw_int] = @on_hw_int
    end
    def on_hw_int
      @on_hw_int
    end
    def on_sw_int=(cb)
      @on_sw_int = cb
      self[:on_sw_int] = @on_sw_int
    end
    def on_sw_int
      @on_sw_int
    end
    def on_hw_int_ack=(cb)
      @on_hw_int_ack = cb
      self[:on_hw_int_ack] = @on_hw_int_ack
    end
    def on_hw_int_ack
      @on_hw_int_ack
    end
    def on_nmi_int=(cb)
      @on_nmi_int = cb
      self[:on_nmi_int] = @on_nmi_int
    end
    def on_nmi_int
      @on_nmi_int
    end
    def on_nmi_int_ack=(cb)
      @on_nmi_int_ack = cb
      self[:on_nmi_int_ack] = @on_nmi_int_ack
    end
    def on_nmi_int_ack
      @on_nmi_int_ack
    end
    def on_idle_cycle=(cb)
      @on_idle_cycle = cb
      self[:on_idle_cycle] = @on_idle_cycle
    end
    def on_idle_cycle
      @on_idle_cycle
    end
    def on_reset=(cb)
      @on_reset = cb
      self[:on_reset] = @on_reset
    end
    def on_reset
      @on_reset
    end
    def on_fpu_opcode_exec=(cb)
      @on_fpu_opcode_exec = cb
      self[:on_fpu_opcode_exec] = @on_fpu_opcode_exec
    end
    def on_fpu_opcode_exec
      @on_fpu_opcode_exec
    end
    def on_fpu_opcode_dec=(cb)
      @on_fpu_opcode_dec = cb
      self[:on_fpu_opcode_dec] = @on_fpu_opcode_dec
    end
    def on_fpu_opcode_dec
      @on_fpu_opcode_dec
    end

  end
  class Softx86Bugs < FFI::Struct
    layout(
           :preemptible_after_prefix, :uchar,
           :decrement_sp_before_store, :uchar,
           :mask_5bit_shiftcount, :uchar
    )
  end
  class Softx86Ctx < FFI::Struct
    layout(
           :version_hi, :uchar,
           :version_lo, :uchar,
           :version_sublo, :ushort,
           :state, Softx86Cpustate,
           :callbacks, Softx86Callbacks,
           :bugs, Softx86Bugs,
           :opcode_table, :pointer,
           :addr_mask, :uint,
           :mem_addr_align, :int,
           :mem_addr_mask, :uint,
           :level, :int,
           :ptr_regs_8reg, [:pointer, 8],
           :is_segment_override, :uchar,
           :segment_override, :ushort,
           :rep_flag, :uchar,
           :ref_softx87_ctx, :pointer
    )
  end
  SX86_CPULEVEL_8088 = 0
  SX86_CPULEVEL_8086 = 1
  SX86_CPULEVEL_80186 = 2
  SX86_CPULEVEL_80286 = 3
  attach_function :sx86_exec_full_modregrm_rw, [ :pointer, :uchar, :uchar, :uchar, :uchar, :uchar, :uchar, callback([ :pointer, :uchar, :uchar ], sx86), callback([ :pointer, :ushort, :ushort ], sx86), callback([ :pointer, :uint, :uint ], sx86) ], :void
  attach_function :sx86_exec_full_modregrm_ro, [ :pointer, :uchar, :uchar, :uchar, :uchar, :uchar, :uchar, callback([ :pointer, :uchar, :uchar ], sx86), callback([ :pointer, :ushort, :ushort ], sx86), callback([ :pointer, :uint, :uint ], sx86) ], :void
  attach_function :sx86_exec_full_modsregrm_rw, [ :pointer, :uchar, :uchar, :uchar, :uchar, callback([ :pointer, :ushort, :ushort ], sx86) ], :void
  attach_function :sx86_exec_full_modrmonly_rw, [ :pointer, :uchar, :uchar, :uchar, :uchar, callback([ :pointer, :uchar ], sx86), callback([ :pointer, :ushort ], sx86), callback([ :pointer, :uint ], sx86) ], :void
  attach_function :sx86_exec_full_modrmonly_rw_imm, [ :pointer, :uchar, :uchar, :uchar, :uchar, callback([ :pointer, :uchar, :uchar ], sx86), callback([ :pointer, :ushort, :ushort ], sx86), callback([ :pointer, :uint, :uint ], sx86) ], :void
  attach_function :sx86_exec_full_modrmonly_rw_imm8, [ :pointer, :uchar, :uchar, :uchar, :uchar, callback([ :pointer, :uchar, :uchar ], sx86), callback([ :pointer, :ushort, :ushort ], sx86), callback([ :pointer, :uint, :uint ], sx86) ], :void
  attach_function :sx86_exec_full_modrmonly_ro_imm, [ :pointer, :uchar, :uchar, :uchar, :uchar, callback([ :pointer, :uchar, :uchar ], sx86), callback([ :pointer, :ushort, :ushort ], sx86), callback([ :pointer, :uint, :uint ], sx86) ], :void
  attach_function :sx86_exec_full_modregrm_xchg, [ :pointer, :uchar, :uchar, :uchar, :uchar, :uchar ], :void
  attach_function :sx86_exec_full_modregrm_lea, [ :pointer, :uchar, :uchar, :uchar, :uchar ], :void
  attach_function :sx86_exec_full_modrmonly_memx, [ :pointer, :uchar, :uchar, :int, callback([ :pointer, :string, :int ], :void) ], :void
  attach_function :sx86_exec_full_modrmonly_callfar, [ :pointer, :uchar, :uchar, :uchar, callback([ :pointer, :ushort, :ushort ], :void), callback([ :pointer, :uint, :uint ], :void) ], :void
  attach_function :sx86_exec_full_modrmonly_ro, [ :pointer, :uchar, :uchar, :uchar, :uchar, callback([ :pointer, :uchar ], sx86), callback([ :pointer, :ushort ], sx86), callback([ :pointer, :uint ], sx86) ], :void
  attach_function :sx86_exec_full_modrmonly_wo, [ :pointer, :uchar, :uchar, :uchar, :uchar, callback([ :pointer ], sx86), callback([ :pointer ], sx86), callback([ :pointer ], sx86) ], :void
  attach_function :sx86_exec_full_modregrm_far, [ :pointer, :uchar, :uchar, :uchar, :uchar, callback([ :pointer, :ushort, :ushort ], sx86), callback([ :pointer, :uint, :uint ], sx86) ], :void
  attach_function :sx86_exec_full_modregrm_far_ro3, [ :pointer, :uchar, :uchar, :uchar, :uchar, callback([ :pointer, :short, :short, :short ], sx86), callback([ :pointer, :int, :int, :int ], sx86) ], :void
  attach_function :sx86_dec_full_modrmonly, [ :pointer, :uchar, :uchar, :uchar, :uchar, :string ], :void
  attach_function :sx86_dec_full_modregrm, [ :pointer, :uchar, :uchar, :uchar, :uchar, :uchar, :string, :string ], :void
  attach_function :sx86_dec_full_modsregrm, [ :pointer, :uchar, :uchar, :uchar, :string, :string ], :void
  attach_function :softx86_bswap2, [ :pointer ], :void
  attach_function :softx86_bswap4, [ :pointer ], :void
  attach_function :softx86_getversion, [ :pointer, :pointer, :pointer ], :int
  attach_function :softx86_init, [ :pointer, :int ], :int
  attach_function :softx86_reset, [ :pointer ], :int
  attach_function :softx86_free, [ :pointer ], :int
  attach_function :softx86_step, [ :pointer ], :int
  attach_function :softx86_decompile, [ :pointer, [:char, 256] ], :int
  attach_function :softx86_decompile_exec_cs_ip, [ :pointer ], :int
  attach_function :softx86_stack_popw, [ :pointer ], :ushort
  attach_function :softx86_stack_discard_n, [ :pointer, :int ], :void
  attach_function :softx86_stack_add_n, [ :pointer, :int ], :void
  attach_function :softx86_stack_pushw, [ :pointer, :ushort ], :void
  attach_function :softx86_fetch, [ :pointer, :pointer, :uint, :pointer, :int ], :int
  attach_function :softx86_write, [ :pointer, :pointer, :uint, :pointer, :int ], :int
  attach_function :softx86_fetch_exec_byte, [ :pointer ], :uchar
  attach_function :softx86_fetch_dec_byte, [ :pointer ], :uchar
  attach_function :softx86_setsegval, [ :pointer, :int, :uint ], :int
  attach_function :softx86_set_instruction_ptr, [ :pointer, :uint, :uint ], :int
  attach_function :softx86_set_instruction_dec_ptr, [ :pointer, :uint, :uint ], :int
  attach_function :softx86_set_stack_ptr, [ :pointer, :uint, :uint ], :int
  attach_function :softx86_set_near_instruction_ptr, [ :pointer, :uint ], :int
  attach_function :softx86_get_intvect, [ :pointer, :uchar, :pointer, :pointer ], :int
  attach_function :softx86_go_int_frame, [ :pointer, :uchar ], :void
  SX86_CPUFLAG_CARRY = 0x00000001
  SX86_CPUFLAG_RESERVED_01 = 0x00000002
  SX86_CPUFLAG_PARITY = 0x00000004
  SX86_CPUFLAG_RESERVED_03 = 0x00000008
  SX86_CPUFLAG_AUX = 0x00000010
  SX86_CPUFLAG_RESERVED_05 = 0x00000020
  SX86_CPUFLAG_ZERO = 0x00000040
  SX86_CPUFLAG_SIGN = 0x00000080
  SX86_CPUFLAG_TRAP = 0x00000100
  SX86_CPUFLAG_INTENABLE = 0x00000200
  SX86_CPUFLAG_DIRECTIONREV = 0x00000400
  SX86_CPUFLAG_OVERFLOW = 0x00000800
  SX86_CPUFLAG_IOPL = 0x00003000
  SX86_CPUFLAG_NESTEDTASK = 0x00004000
  SX86_CPUFLAG_RESERVED_15 = 0x00008000
  SX86_CPUFLAG_RESUME = 0x00010000
  SX86_CPUFLAG_V86 = 0x00020000
  SX86_CPUFLAG_ALIGNMENTCHK = 0x00040000
  SX86_CPUFLAG_RESERVED_19 = 0x00080000
  SX86_CPUFLAG_RESERVED_20 = 0x00100000
  SX86_CPUFLAG_RESERVED_21 = 0x00200000
  SX86_CPUFLAG_RESERVED_22 = 0x00400000
  SX86_CPUFLAG_RESERVED_23 = 0x00800000
  SX86_CPUFLAG_RESERVED_24 = 0x01000000
  SX86_CPUFLAG_RESERVED_25 = 0x02000000
  SX86_CPUFLAG_RESERVED_26 = 0x04000000
  SX86_CPUFLAG_RESERVED_27 = 0x08000000
  SX86_CPUFLAG_RESERVED_28 = 0x10000000
  SX86_CPUFLAG_RESERVED_29 = 0x20000000
  SX86_CPUFLAG_RESERVED_30 = 0x40000000
  SX86_CPUFLAG_RESERVED_31 = 0x80000000
  SX86_CPUFLAGBO_CARRY = 0
  SX86_CPUFLAGBO_RESERVED_01 = 1
  SX86_CPUFLAGBO_PARITY = 2
  SX86_CPUFLAGBO_RESERVED_03 = 3
  SX86_CPUFLAGBO_AUX = 4
  SX86_CPUFLAGBO_RESERVED_05 = 5
  SX86_CPUFLAGBO_ZERO = 6
  SX86_CPUFLAGBO_SIGN = 7
  SX86_CPUFLAGBO_TRAP = 8
  SX86_CPUFLAGBO_INTENABLE = 9
  SX86_CPUFLAGBO_DIRECTIONREV = 10
  SX86_CPUFLAGBO_OVERFLOW = 11
  SX86_CPUFLAGBO_IOPL = 12
  SX86_CPUFLAGBO_NESTEDTASK = 14
  SX86_CPUFLAGBO_RESERVED_15 = 15
  SX86_CPUFLAGBO_RESUME = 16
  SX86_CPUFLAGBO_V86 = 17
  SX86_CPUFLAGBO_ALIGNMENTCHK = 18
  SX86_CPUFLAGBO_RESERVED_19 = 19
  SX86_CPUFLAGBO_RESERVED_20 = 20
  SX86_CPUFLAGBO_RESERVED_21 = 21
  SX86_CPUFLAGBO_RESERVED_22 = 22
  SX86_CPUFLAGBO_RESERVED_23 = 23
  SX86_CPUFLAGBO_RESERVED_24 = 24
  SX86_CPUFLAGBO_RESERVED_25 = 25
  SX86_CPUFLAGBO_RESERVED_26 = 26
  SX86_CPUFLAGBO_RESERVED_27 = 27
  SX86_CPUFLAGBO_RESERVED_28 = 28
  SX86_CPUFLAGBO_RESERVED_29 = 29
  SX86_CPUFLAGBO_RESERVED_30 = 30
  SX86_CPUFLAGBO_RESERVED_31 = 31
  attach_function :softx86_step_def_on_read_memory, [ :pointer, :uint, :pointer, :int ], :void
  attach_function :softx86_step_def_on_read_io, [ :pointer, :uint, :pointer, :int ], :void
  attach_function :softx86_step_def_on_write_memory, [ :pointer, :uint, :pointer, :int ], :void
  attach_function :softx86_step_def_on_write_io, [ :pointer, :uint, :pointer, :int ], :void
  attach_function :softx86_step_def_on_hw_int, [ :pointer, :uchar ], :void
  attach_function :softx86_step_def_on_sw_int, [ :pointer, :uchar ], :void
  attach_function :softx86_step_def_on_hw_int_ack, [ :pointer, :uchar ], :void
  attach_function :softx86_step_def_on_idle_cycle, [ :pointer ], :void
  attach_function :softx86_step_def_on_nmi_int, [ :pointer ], :void
  attach_function :softx86_step_def_on_nmi_int_ack, [ :pointer ], :void
  attach_function :softx86_step_def_on_fpu_opcode_exec, [ :pointer, :pointer, :uchar ], :int
  attach_function :softx86_step_def_on_fpu_opcode_dec, [ :pointer, :pointer, :uchar, [:char, 128] ], :int
  attach_function :softx86_step_def_on_reset, [ :pointer ], :void
  attach_function :softx86_ext_hw_signal, [ :pointer, :uchar ], :int
  attach_function :softx86_ext_hw_ack, [ :pointer ], :int
  attach_function :softx86_int_sw_signal, [ :pointer, :uchar ], :int
  attach_function :softx86_ext_hw_nmi_signal, [ :pointer ], :int
  attach_function :softx86_ext_hw_nmi_ack, [ :pointer ], :int
  attach_function :softx86_parity8, [ :uchar ], :int
  attach_function :softx86_parity16, [ :ushort ], :int
  attach_function :softx86_parity32, [ :uint ], :int
  attach_function :softx86_parity64, [ :ulong_long ], :int
  SX86_BUG_PREEMPTIBLE_AFTER_PREFIX = 0x12340500
  SX86_BUG_SP_DECREMENT_BEFORE_STORE = 0x12340600
  SX86_BUG_5BIT_SHIFTMASK = 0x12340700
  attach_function :softx86_setbug, [ :pointer, :uint, :uchar ], :int
end
