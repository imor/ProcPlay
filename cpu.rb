require './softx86'

class Cpu
  include Softx86

  def initialize
    @softx86_ctx = Softx86Ctx.new
    softx86_init(@softx86_ctx, SX86_CPULEVEL_8086)
  end
end

c = Cpu.new
