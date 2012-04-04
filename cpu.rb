require './softx86'
require './libc'

class Cpu
  include Softx86

  def initialize
    @ctx = Softx86Ctx.new
    callbacks = Softx86Callbacks.new

    @ctx[:callbacks][:on_read_memory] = method(:on_read_memory).to_proc
    @ctx[:callbacks][:on_write_memory] = method(:on_write_memory).to_proc
    @ctx[:callbacks][:on_read_io] = method(:on_read_io).to_proc
    @ctx[:callbacks][:on_write_io] = method(:on_write_io).to_proc

    if !softx86_init(@ctx.pointer, SX86_CPULEVEL_8086)
      raise RuntimeError "Failed to initialize underlying library."
    end

    @ram = LibC::malloc RAM_SIZE

    reset
  end

  def reset()
    softx86_reset(@ctx.pointer)
    LibC::memset(@ram, 0, RAM_SIZE)
    
    softx86_set_instruction_ptr(@ctx.pointer, SEGMENTS_BASE, )
		softx86_set_stack_ptr(@ctx.pointer, SEGMENTS_BASE, 0x0)
		softx86_setsegval(@ctx.pointer, SX86_SREG_DS, SEGMENTS_BASE)
		softx86_setsegval(@ctx.pointer, SX86_SREG_ES, SEGMENTS_BASE)
  end


  # Runs the given sequence of instructions. Multiple instructions should be separated by semicolon (;)
  def run(instruction_sequence)
    # Execute whatever is there at the current IP
    if !softx86_step(@ctx.pointer)
      raise RuntimeError "Error while executing instructions"
    end
  end

  
  
  private

  RAM_SIZE = 1024 * 1024 # 1 MB
  SEGMENTS_BASE = 0x1010
  SP_BASE = 
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
end

