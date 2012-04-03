require './softx86'

class Cpu
  include Softx86

  def initialize
    @ctx = Softx86Ctx.new
    callbacks = Softx86Callbacks.new

    @ctx[:callbacks][:on_read_memory] = method(:on_read_memory).to_proc
    @ctx[:callbacks][:on_write_memory] = method(:on_write_memory).to_proc
    @ctx[:callbacks][:on_read_io] = method(:on_read_io).to_proc
    @ctx[:callbacks][:on_write_io] = method(:on_write_io).to_proc

    if !softx86_init(@ctx, SX86_CPULEVEL_8086)
      raise RuntimeError "Failed to initialize underlying library."
    end
  end


  private

  def on_read_memory(ctx, address, buf, buf_size)
  end

  def on_write_memory(ctx, address, buf, buf_size)
  end

  def on_read_io(ctx, address, buf, buf_size)
  end

  def on_write_io(ctx, address, buf, buf_size)
  end

  

end

c = Cpu.new
