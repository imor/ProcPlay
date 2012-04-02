require './softx86'

class Cpu
  include Softx86

  def initialize
    @softx86_ctx = Softx86::Softx86_ctx.new
  end
end
