require './softx86'
require './libc'
require './assembler'
require 'ffi'

class Cpu
  include Softx86

  def initialize
    @registers = {}
    @ctx = create_softx86context()
    @ram = create_ram()
    reset()
  end

  # Resets the CPU
  def reset()
    softx86_reset(@ctx.pointer) # Reset the cpu
    LibC::memset(@ram, 0, RAM_SIZE) # Zero out the memory
    
    # Reset registers
    softx86_set_instruction_ptr(@ctx.pointer, SEGMENTS_BASE, INITIAL_IP)
		softx86_set_stack_ptr(@ctx.pointer, SEGMENTS_BASE, SP_BASE)
		softx86_setsegval(@ctx.pointer, SX86_SREG_DS, SEGMENTS_BASE)
		softx86_setsegval(@ctx.pointer, SX86_SREG_ES, SEGMENTS_BASE)

    update_registers_from_ctx()
  end


  # Runs the given sequence of instructions. Multiple instructions should be separated by semicolons (;) or newlines
  def run(instruction_sequence)
    instruction_sequence.tr!(";", "\n") #Normalize to new line separators
    no_of_instructions = no_of_lines_in(instruction_sequence)
    object_code = Assembler::assemble(instruction_sequence).join
    load_at_current_ip(object_code)

    no_of_instructions.times { step() }
  end

  # Gets the current register state
  def registers()
    @registers
  end
  
  def dump_ram(address = 0x0, no_of_bytes = RAM_SIZE)
    if no_of_bytes <=0
      []
    else
      buffer = FFI::Buffer.new no_of_bytes
      on_read_memory(@ctx, address, buffer, no_of_bytes)
      buffer.read_array_of_char(no_of_bytes)
    end
  end

  private

  RAM_SIZE = 1024 * 1024 # 1 MB
  SEGMENTS_BASE = 0x1010
  SP_BASE = 0xFFFF
  INITIAL_IP = 0x0

  # Advances the CPU by one instrucitons
  def step()
    # Execute whatever is there at the current IP
    if !softx86_step(@ctx.pointer)
      raise "Error while executing instruction"
    end

    update_registers_from_ctx()
  end

  def create_softx86context()
    context = Softx86Ctx.new
    
    if !softx86_init(context.pointer, SX86_CPULEVEL_8086)
      raise "Failed to initialize softx86 library." #TODO: IS IT OKAY TO RAISE A STRING?
    end

    context[:callbacks][:on_read_memory] = method(:on_read_memory).to_proc
    context[:callbacks][:on_write_memory] = method(:on_write_memory).to_proc
    context[:callbacks][:on_read_io] = method(:on_read_io).to_proc
    context[:callbacks][:on_write_io] = method(:on_write_io).to_proc

    return context
  end

  def create_ram()
    return LibC::malloc(RAM_SIZE)
  end

  def load_at_current_ip(object_code)
    buffer = FFI::Buffer.new object_code.length
    buffer.write_bytes(object_code)
    current_ip = registers[:ip] + @ctx[:state][:segment_reg][SX86_SREG_CS][:cached_linear]
    on_write_memory(@ctx, current_ip, buffer, object_code.length)
  end


  def on_read_memory(ctx, address, buf, buf_size)
    if address >= RAM_SIZE
      cpsize = 0
      memsetsize = buf_size
    elsif address + buf_size > RAM_SIZE
      cpsize = RAM_SIZE - address
      memsetsize = buf_size - cpsize
    else
      cpsize = buf_size
      memsetsize = 0
    end

    if cpsize > 0
      LibC::memcpy(buf, @ram + address, cpsize)
      buf += cpsize
    end

    if memsetsize > 0
      LibC::memset(buf, 0xFF, memsetsize)
      buf += cpsize
    end
  end


  def on_write_memory(ctx, address, buf, buf_size)
    if address >= RAM_SIZE
      cpsize = 0
      memsetsize = buf_size
    elsif address + buf_size > RAM_SIZE
      cpsize = RAM_SIZE - address
      memsetsize = buf_size - cpsize
    else
      cpsize = buf_size
      memsetsize = 0
    end

    if cpsize > 0
      LibC::memcpy(@ram + address, buf, cpsize)
      buf += cpsize
    end

    if memsetsize > 0
      buf += cpsize
    end
  end

  def on_read_io(ctx, address, buf, buf_size)
  end

  def on_write_io(ctx, address, buf, buf_size)
  end

  def no_of_lines_in(str)
    return str.lines.inject(0) { |c, line| c + 1}
  end

  # Copies the current register state from @ctx to @registers field
  def update_registers_from_ctx()
    general_reg_array = @ctx[:state][:general_reg]
    @registers[:ax] = general_reg_array[SX86_REG_AX][:val] 
    @registers[:bx] = general_reg_array[SX86_REG_BX][:val] 
    @registers[:cx] = general_reg_array[SX86_REG_CX][:val] 
    @registers[:dx] = general_reg_array[SX86_REG_DX][:val] 
    @registers[:sp] = general_reg_array[SX86_REG_SP][:val] 
    @registers[:bp] = general_reg_array[SX86_REG_BP][:val] 
    @registers[:si] = general_reg_array[SX86_REG_SI][:val] 
    @registers[:di] = general_reg_array[SX86_REG_DI][:val]

    segment_reg_array = @ctx[:state][:segment_reg]
    @registers[:es] = segment_reg_array[SX86_SREG_ES][:val] 
    @registers[:cs] = segment_reg_array[SX86_SREG_CS][:val] 
    @registers[:ss] = segment_reg_array[SX86_SREG_SS][:val] 
    @registers[:ds] = segment_reg_array[SX86_SREG_DS][:val] 

    @registers[:ip] = @ctx[:state][:reg_ip]
  end
end

