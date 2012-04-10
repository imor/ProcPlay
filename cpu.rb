require './softx86'
require './libc'
require './assembler'

class Cpu
  include Softx86

  def initialize
    @ctx = create_softx86context()
    @ram = create_ram()
    reset()
  end

  def reset()
    softx86_reset(@ctx.pointer) # Reset the cpu
    LibC::memset(@ram, 0, RAM_SIZE) # Zero out the memory
    
    # Reset registers
    softx86_set_instruction_ptr(@ctx.pointer, SEGMENTS_BASE, INITIAL_IP)
		softx86_set_stack_ptr(@ctx.pointer, SEGMENTS_BASE, SP_BASE)
		softx86_setsegval(@ctx.pointer, SX86_SREG_DS, SEGMENTS_BASE)
		softx86_setsegval(@ctx.pointer, SX86_SREG_ES, SEGMENTS_BASE)
  end


  # Runs the given sequence of instructions. Multiple instructions should be separated by semicolons (;) or newlines
  def run(instruction_sequence)
    instruction_sequence.tr!(";", "\n") #Normalize to new line separators
    no_of_instructions = no_of_lines_in(instruction_sequence)
    object_code = Assembler::assemble(instruction_sequence)
    load_at_next_ip(object_code)

    no_of_instructions.times { step() }
  end
  
  
  private

  RAM_SIZE = 1024 * 1024 # 1 MB
  SEGMENTS_BASE = 0x1010
  SP_BASE = 0xFFFF
  INITIAL_IP = 0x0

  def step()
    # Execute whatever is there at the current IP
    if !softx86_step(@ctx.pointer)
      raise RuntimeError "Error while executing instructions"
    end
  end

  def create_softx86context()
    context = Softx86Ctx.new
    
    context[:callbacks][:on_read_memory] = method(:on_read_memory).to_proc
    context[:callbacks][:on_write_memory] = method(:on_write_memory).to_proc
    context[:callbacks][:on_read_io] = method(:on_read_io).to_proc
    context[:callbacks][:on_write_io] = method(:on_write_io).to_proc

    if !softx86_init(context.pointer, SX86_CPULEVEL_8086)
      raise RuntimeError "Failed to initialize softx86 library."
    end

    return context
  end

  def create_ram()
    return LibC::malloc(RAM_SIZE)
  end

  def load_at_next_ip(object_code)
    current_ip = @ctx[:state][:reg_ip]
    next_ip = current_ip + 1
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

end

