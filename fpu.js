// Note: Some Emscripten settings will significantly limit the speed of the generated code.
// Note: Some Emscripten settings may limit the speed of the generated code.
// TODO: " u s e   s t r i c t ";

try {
  this['Module'] = Module;
} catch(e) {
  this['Module'] = Module = {};
}

// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function(x) {
    process['stderr'].write(x + '\n');
  };

  var nodeFS = require('fs');
  var nodePath = require('path');

  Module['read'] = function(filename) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename).toString();
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename).toString();
    }
    return ret;
  };

  Module['load'] = function(f) {
    globalEval(read(f));
  };

  if (!Module['arguments']) {
    Module['arguments'] = process['argv'].slice(2);
  }
} else if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  Module['printErr'] = printErr;

  // Polyfill over SpiderMonkey/V8 differences
  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function(f) { snarf(f) };
  }

  if (!Module['arguments']) {
    if (typeof scriptArgs != 'undefined') {
      Module['arguments'] = scriptArgs;
    } else if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
} else if (ENVIRONMENT_IS_WEB) {
  if (!Module['print']) {
    Module['print'] = function(x) {
      console.log(x);
    };
  }

  if (!Module['printErr']) {
    Module['printErr'] = function(x) {
      console.log(x);
    };
  }

  Module['read'] = function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };

  if (!Module['arguments']) {
    if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
} else if (ENVIRONMENT_IS_WORKER) {
  // We can do very little here...

  Module['load'] = importScripts;

} else {
  throw 'Unknown runtime environment. Where are we?';
}

function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['printErr']) {
  Module['printErr'] = function(){};
}
if (!Module['print']) {
  Module['print'] = Module['printErr'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***

  
// Warning: .ll contains i64 or double values. These 64-bit values are dangerous in USE_TYPED_ARRAYS == 2. We store i64 as i32, and double as float. This can cause serious problems!
// === Auto-generated preamble library stuff ===

//========================================
// Runtime code shared with compiler
//========================================

var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      var logg = log2(quantum);
      return '((((' +target + ')+' + (quantum-1) + ')>>' + logg + ')<<' + logg + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (/^\[\d+\ x\ (.*)\]/.test(type)) return true; // [15 x ?] blocks. Like structs
  if (/<?{ [^}]* }>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  bitshift64: function (low, high, op, bits) {
    var ander = Math.pow(2, bits)-1;
    if (bits < 32) {
      switch (op) {
        case 'shl':
          return [low << bits, (high << bits) | ((low&(ander << (32 - bits))) >>> (32 - bits))];
        case 'ashr':
          return [(((low >>> bits ) | ((high&ander) << (32 - bits))) >> 0) >>> 0, (high >> bits) >>> 0];
        case 'lshr':
          return [((low >>> bits) | ((high&ander) << (32 - bits))) >>> 0, high >>> bits];
      }
    } else if (bits == 32) {
      switch (op) {
        case 'shl':
          return [0, low];
        case 'ashr':
          return [high, (high|0) < 0 ? ander : 0];
        case 'lshr':
          return [high, 0];
      }
    } else { // bits > 32
      switch (op) {
        case 'shl':
          return [0, low << (bits - 32)];
        case 'ashr':
          return [(high >> (bits - 32)) >>> 0, (high|0) < 0 ? ander : 0];
        case 'lshr':
          return [high >>>  (bits - 32) , 0];
      }
    }
    abort('unknown bitshift64 op: ' + [value, op, bits]);
  },
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type, quantumSize) {
    if (Runtime.QUANTUM_SIZE == 1) return 1;
    var size = {
      '%i1': 1,
      '%i8': 1,
      '%i16': 2,
      '%i32': 4,
      '%i64': 8,
      "%float": 4,
      "%double": 8
    }['%'+type]; // add '%' since float and double confuse Closure compiler as keys, and also spidermonkey as a compiler will remove 's from '_i8' etc
    if (!size) {
      if (type[type.length-1] == '*') {
        size = Runtime.QUANTUM_SIZE; // A pointer
      } else if (type[0] == 'i') {
        var bits = parseInt(type.substr(1));
        assert(bits % 8 == 0);
        size = bits/8;
      }
    }
    return size;
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    type.flatIndexes = type.fields.map(function(field) {
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = size;
      } else if (Runtime.isStructType(field)) {
        size = Types.types[field].flatSize;
        alignSize = Types.types[field].alignSize;
      } else {
        throw 'Unclear type in struct: ' + field + ', in ' + type.name_ + ' :: ' + dump(Types.types[type.name_]);
      }
      alignSize = type.packed ? 1 : Math.min(alignSize, Runtime.QUANTUM_SIZE);
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      assert(type.fields.length === struct.length, 'Number of named fields must match the type for ' + typeName);
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  stackAlloc: function stackAlloc(size) { var ret = STACKTOP;STACKTOP += size;STACKTOP = ((((STACKTOP)+3)>>2)<<2);assert(STACKTOP < STACK_ROOT + STACK_MAX, "Ran out of stack"); return ret; },
  staticAlloc: function staticAlloc(size) { var ret = STATICTOP;STATICTOP += size;STATICTOP = ((((STATICTOP)+3)>>2)<<2); if (STATICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function alignMemory(size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 4))*(quantum ? quantum : 4); return ret; },
  makeBigInt: function makeBigInt(low,high,unsigned) { var ret = (unsigned ? (((low)>>>0)+(((high)>>>0)*4294967296)) : (((low)>>>0)+(((high)|0)*4294967296))); return ret; },
  QUANTUM_SIZE: 4,
  __dummy__: 0
}



var CorrectionsMonitor = {
  MAX_ALLOWED: 0, // XXX
  corrections: 0,
  sigs: {},

  note: function(type, succeed, sig) {
    if (!succeed) {
      this.corrections++;
      if (this.corrections >= this.MAX_ALLOWED) abort('\n\nToo many corrections!');
    }
  },

  print: function() {
  }
};





//========================================
// Runtime essentials
//========================================

var __THREW__ = false; // Used in checking for thrown exceptions.

var ABORT = false;

var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD;
var tempI64, tempI64b;

function abort(text) {
  Module.print(text + ':\n' + (new Error).stack);
  ABORT = true;
  throw "Assertion: " + text;
}

function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Adding
//
//         __attribute__((used))
//
//       to the function definition will prevent that.
//
// Note: Closure optimizations will minify function names, making
//       functions no longer callable. If you run closure (on by default
//       in -O2 and above), you should export the functions you will call
//       by calling emcc with something like
//
//         -s EXPORTED_FUNCTIONS='["_func1","_func2"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number' or 'string' (use 'number' for any C pointer).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType.
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length+1);
      writeStringToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    return value;
  }
  try {
    var func = eval('_' + ident);
  } catch(e) {
    try {
      func = globalScope['Module']['_' + ident]; // closure exported function
    } catch(e) {}
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
Module["ccall"] = ccall;

// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  // TODO: optimize this, eval the whole function once instead of going through ccall each time
  return function() {
    return ccall(ident, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}

// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type[type.length-1] === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': HEAP32[((ptr)>>2)]=value; break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': (tempDoubleF64[0]=value,HEAP32[((ptr)>>2)]=tempDoubleI32[0],HEAP32[((ptr+4)>>2)]=tempDoubleI32[1]); break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;

// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type[type.length-1] === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return (tempDoubleI32[0]=HEAP32[((ptr)>>2)],tempDoubleI32[1]=HEAP32[((ptr+4)>>2)],tempDoubleF64[0]);
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;

// Allocates memory for some data and initializes it properly.

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;

function allocate(slab, types, allocator) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));

  if (zeroinit) {
      _memset(ret, 0, size);
      return ret;
  }
  
  var i = 0, type;
  while (i < size) {
    var curr = slab[i];

    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    assert(type, 'Must know what type to store in allocate!');

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);
    i += Runtime.getNativeTypeSize(type);
  }

  return ret;
}
Module['allocate'] = allocate;

function Pointer_stringify(ptr, /* optional */ length) {
  var nullTerminated = typeof(length) == "undefined";
  var ret = "";
  var i = 0;
  var t;
  var nullByte = String.fromCharCode(0);
  while (1) {
    t = String.fromCharCode(HEAPU8[(ptr+i)]);
    if (nullTerminated && t == nullByte) { break; } else {}
    ret += t;
    i += 1;
    if (!nullTerminated && i == length) { break; }
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;

function Array_stringify(array) {
  var ret = "";
  for (var i = 0; i < array.length; i++) {
    ret += String.fromCharCode(array[i]);
  }
  return ret;
}
Module['Array_stringify'] = Array_stringify;

// Memory management

var FUNCTION_TABLE; // XXX: In theory the indexes here can be equal to pointers to stacked or malloced memory. Such comparisons should
                    //      be false, but can turn out true. We should probably set the top bit to prevent such issues.

var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return ((x+4095)>>12)<<12;
}

var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

var STACK_ROOT, STACKTOP, STACK_MAX;
var STATICTOP;
function enlargeMemory() {
  // TOTAL_MEMORY is the current size of the actual array, and STATICTOP is the new top.
  Module.printErr('Warning: Enlarging memory arrays, this is not fast! ' + [STATICTOP, TOTAL_MEMORY]);
  assert(STATICTOP >= TOTAL_MEMORY);
  assert(TOTAL_MEMORY > 4); // So the loop below will not be infinite
  while (TOTAL_MEMORY <= STATICTOP) { // Simple heuristic. Override enlargeMemory() if your program has something more optimal for it
    TOTAL_MEMORY = alignMemoryPage(2*TOTAL_MEMORY);
  }
  var oldHEAP8 = HEAP8;
  var buffer = new ArrayBuffer(TOTAL_MEMORY);
  HEAP8 = new Int8Array(buffer);
  HEAP16 = new Int16Array(buffer);
  HEAP32 = new Int32Array(buffer);
  HEAPU8 = new Uint8Array(buffer);
  HEAPU16 = new Uint16Array(buffer);
  HEAPU32 = new Uint32Array(buffer);
  HEAPF32 = new Float32Array(buffer);
  HEAPF64 = new Float64Array(buffer);
  HEAP8.set(oldHEAP8);
}

var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 10485760;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;

// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
  assert(!!Int32Array && !!Float64Array && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
         'Cannot fallback to non-typed array case: Code is too specialized');

  var buffer = new ArrayBuffer(TOTAL_MEMORY);
  HEAP8 = new Int8Array(buffer);
  HEAP16 = new Int16Array(buffer);
  HEAP32 = new Int32Array(buffer);
  HEAPU8 = new Uint8Array(buffer);
  HEAPU16 = new Uint16Array(buffer);
  HEAPU32 = new Uint32Array(buffer);
  HEAPF32 = new Float32Array(buffer);
  HEAPF64 = new Float64Array(buffer);

  // Endianness check (note: assumes compiler arch was little-endian)
  HEAP32[0] = 255;
  assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');

var base = intArrayFromString('(null)'); // So printing %s of NULL gives '(null)'
                                         // Also this ensures we leave 0 as an invalid address, 'NULL'
STATICTOP = base.length;
for (var i = 0; i < base.length; i++) {
  HEAP8[(i)]=base[i]
}

Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;

STACK_ROOT = STACKTOP = Runtime.alignMemory(STATICTOP);
STACK_MAX = STACK_ROOT + TOTAL_STACK;

var tempDoublePtr = Runtime.alignMemory(STACK_MAX, 8);
var tempDoubleI8  = HEAP8.subarray(tempDoublePtr);
var tempDoubleI32 = HEAP32.subarray(tempDoublePtr >> 2);
var tempDoubleF32 = HEAPF32.subarray(tempDoublePtr >> 2);
var tempDoubleF64 = HEAPF64.subarray(tempDoublePtr >> 3);
function copyTempFloat(ptr) { // functions, because inlining this code is increases code size too much
  tempDoubleI8[0] = HEAP8[ptr];
  tempDoubleI8[1] = HEAP8[ptr+1];
  tempDoubleI8[2] = HEAP8[ptr+2];
  tempDoubleI8[3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  tempDoubleI8[0] = HEAP8[ptr];
  tempDoubleI8[1] = HEAP8[ptr+1];
  tempDoubleI8[2] = HEAP8[ptr+2];
  tempDoubleI8[3] = HEAP8[ptr+3];
  tempDoubleI8[4] = HEAP8[ptr+4];
  tempDoubleI8[5] = HEAP8[ptr+5];
  tempDoubleI8[6] = HEAP8[ptr+6];
  tempDoubleI8[7] = HEAP8[ptr+7];
}
STACK_MAX = tempDoublePtr + 8;

STATICTOP = alignMemoryPage(STACK_MAX);

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    var func = callback.func;
    if (typeof func === 'number') {
      func = FUNCTION_TABLE[func];
    }
    func(callback.arg === undefined ? null : callback.arg);
  }
}

var __ATINIT__ = []; // functions called during startup
var __ATEXIT__ = []; // functions called during shutdown

function initRuntime() {
  callRuntimeCallbacks(__ATINIT__);
}

function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);

  // Print summary of correction activity
  CorrectionsMonitor.print();
}


// Copies a list of num items on the HEAP into a
// a normal JavaScript array of numbers
function Array_copy(ptr, num) {
  return Array.prototype.slice.call(HEAP8.subarray(ptr, ptr+num)); // Make a normal array out of the typed 'view'
                                                                   // Consider making a typed array here, for speed?
  return HEAP.slice(ptr, ptr+num);
}
Module['Array_copy'] = Array_copy;

// Copies a list of num items on the HEAP into a
// JavaScript typed array.
function TypedArray_copy(ptr, num) {
  // TODO: optimize this!
  var arr = new Uint8Array(num);
  for (var i = 0; i < num; ++i) {
    arr[i] = HEAP8[(ptr+i)];
  }
  return arr.buffer;
}
Module['TypedArray_copy'] = TypedArray_copy;

function String_len(ptr) {
  var i = 0;
  while (HEAP8[(ptr+i)]) i++; // Note: should be |!= 0|, technically. But this helps catch bugs with undefineds
  return i;
}
Module['String_len'] = String_len;

// Copies a C-style string, terminated by a zero, from the HEAP into
// a normal JavaScript array of numbers
function String_copy(ptr, addZero) {
  var len = String_len(ptr);
  if (addZero) len++;
  var ret = Array_copy(ptr, len);
  if (addZero) ret[len-1] = 0;
  return ret;
}
Module['String_copy'] = String_copy;

// Tools

// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull) {
  var ret = [];
  var t;
  var i = 0;
  while (i < stringy.length) {
    var chr = stringy.charCodeAt(i);
    if (chr > 0xFF) {
        assert(false, 'Character code ' + chr + ' (' + stringy[i] + ')  at offset ' + i + ' not in 0x00-0xFF.');
      chr &= 0xFF;
    }
    ret.push(chr);
    i = i + 1;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
        assert(false, 'Character code ' + chr + ' (' + String.fromCharCode(chr) + ')  at offset ' + i + ' not in 0x00-0xFF.');
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;

// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var i = 0;
  while (i < string.length) {
    var chr = string.charCodeAt(i);
    if (chr > 0xFF) {
        assert(false, 'Character code ' + chr + ' (' + string[i] + ')  at offset ' + i + ' not in 0x00-0xFF.');
      chr &= 0xFF;
    }
    HEAP8[(buffer+i)]=chr
    i = i + 1;
  }
  if (!dontAddNull) {
    HEAP8[(buffer+i)]=0
  }
}
Module['writeStringToMemory'] = writeStringToMemory;

var STRING_TABLE = [];

function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
  // TODO: clean up previous line
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in Module.preRun
// or PRE_RUN_ADDITIONS (used by emcc to add file preloading).
var runDependencies = 0;
function addRunDependency() {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
function removeRunDependency() {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) run();
}

// Preloading

var preloadedImages = {}; // maps url to image data

// === Body ===



// Warning: Arithmetic on 64-bit integers in mode 1 is rounded and flaky, like mode 0!

function _softx86_popstack($ctx87) {
  ;
  var __label__;

  var $1;
  var $TOP;
  $1=$ctx87;
  var $2=$1;
  var $3=(($2+4)|0);
  var $4=(($3)|0);
  var $5=HEAPU16[(($4)>>1)];
  var $6=(($5)&65535);
  var $7=$6 >> 11;
  var $8=$7 & 7;
  $TOP=$8;
  var $9=$1;
  var $10=(($9+4)|0);
  var $11=(($10+4)|0);
  var $12=HEAPU16[(($11)>>1)];
  var $13=(($12)&65535);
  var $14=$TOP;
  var $15=((($14<<1))|0);
  var $16=3 << $15;
  var $17=$16 ^ -1;
  var $18=$13 & $17;
  var $19=$TOP;
  var $20=((($19<<1))|0);
  var $21=3 << $20;
  var $22=$18 | $21;
  var $23=(($22) & 65535);
  var $24=$1;
  var $25=(($24+4)|0);
  var $26=(($25+4)|0);
  HEAP16[(($26)>>1)]=$23;
  var $27=$TOP;
  var $28=(($27+1)|0);
  var $29=$28 & 7;
  $TOP=$29;
  var $30=$1;
  var $31=(($30+4)|0);
  var $32=(($31)|0);
  var $33=HEAPU16[(($32)>>1)];
  var $34=(($33)&65535);
  var $35=$34 & -14337;
  var $36=$TOP;
  var $37=$36 & 7;
  var $38=$37 << 11;
  var $39=$35 | $38;
  var $40=(($39) & 65535);
  var $41=$1;
  var $42=(($41+4)|0);
  var $43=(($42)|0);
  HEAP16[(($43)>>1)]=$40;
  ;
  return;
}
_softx86_popstack["X"]=1;

function _op_fld32($ctx, $datz, $sz) {
  var __stackBase__  = STACKTOP; STACKTOP += 12; assert(STACKTOP % 4 == 0, "Stack is unaligned"); assert(STACKTOP < STACK_MAX, "Ran out of stack");
  var __label__;
  __label__ = 1; 
  while(1) switch(__label__) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $tmp=__stackBase__;
      var $ctx87;
      var $TOP;
      $1=$ctx;
      $2=$datz;
      $3=$sz;
      var $4=$1;
      var $5=(($4+244)|0);
      var $6=HEAP32[(($5)>>2)];
      var $7=$6;
      $ctx87=$7;
      var $8=$3;
      var $9=(($8)|0)!=4;
      if ($9) { __label__ = 3; break; } else { __label__ = 2; break; }
    case 2: 
      var $11=$ctx87;
      var $12=(($11)|0)!=0;
      if ($12) { __label__ = 4; break; } else { __label__ = 3; break; }
    case 3: 
      __label__ = 8; break;
    case 4: 
      var $15=$ctx87;
      var $16=$2;
      _softx87_unpack_raw_fp32($15, $16, $tmp);
      var $17=$ctx87;
      _softx87_normalize($17, $tmp);
      var $18=$ctx87;
      var $19=(($18+4)|0);
      var $20=(($19)|0);
      var $21=HEAPU16[(($20)>>1)];
      var $22=(($21)&65535);
      var $23=$22 >> 11;
      var $24=$23 & 7;
      $TOP=$24;
      var $25=$ctx87;
      var $26=(($25+4)|0);
      var $27=(($26+4)|0);
      var $28=HEAPU16[(($27)>>1)];
      var $29=(($28)&65535);
      var $30=$TOP;
      var $31=((($30<<1))|0);
      var $32=$29 >> (($31)|0);
      var $33=$32 & 3;
      var $34=(($33)|0)!=3;
      if ($34) { __label__ = 5; break; } else { __label__ = 6; break; }
    case 5: 
      var $36=$ctx87;
      var $37=(($36+4)|0);
      var $38=(($37)|0);
      var $39=HEAPU16[(($38)>>1)];
      var $40=(($39)&65535);
      var $41=$40 | 512;
      var $42=(($41) & 65535);
      HEAP16[(($38)>>1)]=$42;
      __label__ = 7; break;
    case 6: 
      var $44=$ctx87;
      var $45=(($44+4)|0);
      var $46=(($45)|0);
      var $47=HEAPU16[(($46)>>1)];
      var $48=(($47)&65535);
      var $49=$48 & -513;
      var $50=(($49) & 65535);
      HEAP16[(($46)>>1)]=$50;
      __label__ = 7; break;
    case 7: 
      var $52=$TOP;
      var $53=(($52-1)|0);
      var $54=$53 & 7;
      $TOP=$54;
      var $55=$ctx87;
      var $56=(($55+4)|0);
      var $57=(($56)|0);
      var $58=HEAPU16[(($57)>>1)];
      var $59=(($58)&65535);
      var $60=$59 & -14337;
      var $61=$TOP;
      var $62=$61 & 7;
      var $63=$62 << 11;
      var $64=$60 | $63;
      var $65=(($64) & 65535);
      var $66=$ctx87;
      var $67=(($66+4)|0);
      var $68=(($67)|0);
      HEAP16[(($68)>>1)]=$65;
      var $69=$ctx87;
      var $70=(($69+4)|0);
      var $71=(($70+4)|0);
      var $72=HEAPU16[(($71)>>1)];
      var $73=(($72)&65535);
      var $74=$TOP;
      var $75=((($74<<1))|0);
      var $76=3 << $75;
      var $77=$76 ^ -1;
      var $78=$73 & $77;
      var $79=$TOP;
      var $80=((($79<<1))|0);
      var $81=0 << $80;
      var $82=$78 | $81;
      var $83=(($82) & 65535);
      var $84=$ctx87;
      var $85=(($84+4)|0);
      var $86=(($85+4)|0);
      HEAP16[(($86)>>1)]=$83;
      var $87=(($tmp+8)|0);
      var $88=HEAP16[(($87)>>1)];
      var $89=$TOP;
      var $90=$ctx87;
      var $91=(($90+4)|0);
      var $92=(($91+36)|0);
      var $93=(($92+$89*12)|0);
      var $94=(($93+8)|0);
      HEAP16[(($94)>>1)]=$88;
      var $95=(($tmp)|0);
      var $st$48$0=(($95)|0);
      var $96$0=HEAP32[(($st$48$0)>>2)];
      var $st$48$1=(($95+4)|0);
      var $96$1=HEAP32[(($st$48$1)>>2)];
      var $97=$TOP;
      var $98=$ctx87;
      var $99=(($98+4)|0);
      var $100=(($99+36)|0);
      var $101=(($100+$97*12)|0);
      var $102=(($101)|0);
      var $st$58$0=(($102)|0);
      HEAP32[(($st$58$0)>>2)]=$96$0;
      var $st$58$1=(($102+4)|0);
      HEAP32[(($st$58$1)>>2)]=$96$1;
      var $103=(($tmp+10)|0);
      var $104=HEAP8[($103)];
      var $105=$TOP;
      var $106=$ctx87;
      var $107=(($106+4)|0);
      var $108=(($107+36)|0);
      var $109=(($108+$105*12)|0);
      var $110=(($109+10)|0);
      HEAP8[($110)]=$104;
      __label__ = 8; break;
    case 8: 
      STACKTOP = __stackBase__;
      return;
    default: assert(0, "bad label: " + __label__);
  }
}
_op_fld32["X"]=1;

function _op_fld64($ctx, $datz, $sz) {
  var __stackBase__  = STACKTOP; STACKTOP += 12; assert(STACKTOP % 4 == 0, "Stack is unaligned"); assert(STACKTOP < STACK_MAX, "Ran out of stack");
  var __label__;
  __label__ = 1; 
  while(1) switch(__label__) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $tmp=__stackBase__;
      var $ctx87;
      var $TOP;
      $1=$ctx;
      $2=$datz;
      $3=$sz;
      var $4=$1;
      var $5=(($4+244)|0);
      var $6=HEAP32[(($5)>>2)];
      var $7=$6;
      $ctx87=$7;
      var $8=$3;
      var $9=(($8)|0)!=8;
      if ($9) { __label__ = 3; break; } else { __label__ = 2; break; }
    case 2: 
      var $11=$ctx87;
      var $12=(($11)|0)!=0;
      if ($12) { __label__ = 4; break; } else { __label__ = 3; break; }
    case 3: 
      __label__ = 8; break;
    case 4: 
      var $15=$ctx87;
      var $16=$2;
      _softx87_unpack_raw_fp64($15, $16, $tmp);
      var $17=$ctx87;
      _softx87_normalize($17, $tmp);
      var $18=$ctx87;
      var $19=(($18+4)|0);
      var $20=(($19)|0);
      var $21=HEAPU16[(($20)>>1)];
      var $22=(($21)&65535);
      var $23=$22 >> 11;
      var $24=$23 & 7;
      $TOP=$24;
      var $25=$ctx87;
      var $26=(($25+4)|0);
      var $27=(($26+4)|0);
      var $28=HEAPU16[(($27)>>1)];
      var $29=(($28)&65535);
      var $30=$TOP;
      var $31=((($30<<1))|0);
      var $32=$29 >> (($31)|0);
      var $33=$32 & 3;
      var $34=(($33)|0)!=3;
      if ($34) { __label__ = 5; break; } else { __label__ = 6; break; }
    case 5: 
      var $36=$ctx87;
      var $37=(($36+4)|0);
      var $38=(($37)|0);
      var $39=HEAPU16[(($38)>>1)];
      var $40=(($39)&65535);
      var $41=$40 | 512;
      var $42=(($41) & 65535);
      HEAP16[(($38)>>1)]=$42;
      __label__ = 7; break;
    case 6: 
      var $44=$ctx87;
      var $45=(($44+4)|0);
      var $46=(($45)|0);
      var $47=HEAPU16[(($46)>>1)];
      var $48=(($47)&65535);
      var $49=$48 & -513;
      var $50=(($49) & 65535);
      HEAP16[(($46)>>1)]=$50;
      __label__ = 7; break;
    case 7: 
      var $52=$TOP;
      var $53=(($52-1)|0);
      var $54=$53 & 7;
      $TOP=$54;
      var $55=$ctx87;
      var $56=(($55+4)|0);
      var $57=(($56)|0);
      var $58=HEAPU16[(($57)>>1)];
      var $59=(($58)&65535);
      var $60=$59 & -14337;
      var $61=$TOP;
      var $62=$61 & 7;
      var $63=$62 << 11;
      var $64=$60 | $63;
      var $65=(($64) & 65535);
      var $66=$ctx87;
      var $67=(($66+4)|0);
      var $68=(($67)|0);
      HEAP16[(($68)>>1)]=$65;
      var $69=$ctx87;
      var $70=(($69+4)|0);
      var $71=(($70+4)|0);
      var $72=HEAPU16[(($71)>>1)];
      var $73=(($72)&65535);
      var $74=$TOP;
      var $75=((($74<<1))|0);
      var $76=3 << $75;
      var $77=$76 ^ -1;
      var $78=$73 & $77;
      var $79=$TOP;
      var $80=((($79<<1))|0);
      var $81=0 << $80;
      var $82=$78 | $81;
      var $83=(($82) & 65535);
      var $84=$ctx87;
      var $85=(($84+4)|0);
      var $86=(($85+4)|0);
      HEAP16[(($86)>>1)]=$83;
      var $87=(($tmp+8)|0);
      var $88=HEAP16[(($87)>>1)];
      var $89=$TOP;
      var $90=$ctx87;
      var $91=(($90+4)|0);
      var $92=(($91+36)|0);
      var $93=(($92+$89*12)|0);
      var $94=(($93+8)|0);
      HEAP16[(($94)>>1)]=$88;
      var $95=(($tmp)|0);
      var $st$48$0=(($95)|0);
      var $96$0=HEAP32[(($st$48$0)>>2)];
      var $st$48$1=(($95+4)|0);
      var $96$1=HEAP32[(($st$48$1)>>2)];
      var $97=$TOP;
      var $98=$ctx87;
      var $99=(($98+4)|0);
      var $100=(($99+36)|0);
      var $101=(($100+$97*12)|0);
      var $102=(($101)|0);
      var $st$58$0=(($102)|0);
      HEAP32[(($st$58$0)>>2)]=$96$0;
      var $st$58$1=(($102+4)|0);
      HEAP32[(($st$58$1)>>2)]=$96$1;
      var $103=(($tmp+10)|0);
      var $104=HEAP8[($103)];
      var $105=$TOP;
      var $106=$ctx87;
      var $107=(($106+4)|0);
      var $108=(($107+36)|0);
      var $109=(($108+$105*12)|0);
      var $110=(($109+10)|0);
      HEAP8[($110)]=$104;
      __label__ = 8; break;
    case 8: 
      STACKTOP = __stackBase__;
      return;
    default: assert(0, "bad label: " + __label__);
  }
}
_op_fld64["X"]=1;

function _op_fiadd16($ctx, $datz, $sz) {
  var __stackBase__  = STACKTOP; STACKTOP += 12; assert(STACKTOP % 4 == 0, "Stack is unaligned"); assert(STACKTOP < STACK_MAX, "Ran out of stack");
  var __label__;
  __label__ = 1; 
  while(1) switch(__label__) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $tmp=__stackBase__;
      var $ctx87;
      var $TOP;
      $1=$ctx;
      $2=$datz;
      $3=$sz;
      var $4=$1;
      var $5=(($4+244)|0);
      var $6=HEAP32[(($5)>>2)];
      var $7=$6;
      $ctx87=$7;
      var $8=$3;
      var $9=(($8)|0)!=2;
      if ($9) { __label__ = 3; break; } else { __label__ = 2; break; }
    case 2: 
      var $11=$ctx87;
      var $12=(($11)|0)!=0;
      if ($12) { __label__ = 4; break; } else { __label__ = 3; break; }
    case 3: 
      __label__ = 5; break;
    case 4: 
      var $15=$ctx87;
      var $16=$2;
      _softx87_unpack_raw_int16($15, $16, $tmp);
      var $17=$ctx87;
      _softx87_normalize($17, $tmp);
      var $18=$ctx87;
      var $19=(($18+4)|0);
      var $20=(($19)|0);
      var $21=HEAPU16[(($20)>>1)];
      var $22=(($21)&65535);
      var $23=$22 >> 11;
      var $24=$23 & 7;
      $TOP=$24;
      var $25=$ctx87;
      var $26=$TOP;
      var $27=$ctx87;
      var $28=(($27+4)|0);
      var $29=(($28+36)|0);
      var $30=(($29+$26*12)|0);
      _op_fadd($25, $30, $tmp);
      __label__ = 5; break;
    case 5: 
      STACKTOP = __stackBase__;
      return;
    default: assert(0, "bad label: " + __label__);
  }
}


function _op_fadd($ctx, $dst, $src) {
  var __stackBase__  = STACKTOP; STACKTOP += 40; assert(STACKTOP % 4 == 0, "Stack is unaligned"); assert(STACKTOP < STACK_MAX, "Ran out of stack");
  var __label__;
  __label__ = 1; 
  while(1) switch(__label__) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $major=__stackBase__;
      var $minor=__stackBase__+12;
      var $waste=__stackBase__+24;
      var $threshhold=__stackBase__+32;
      var $exb;
      var $b;
      $1=$ctx;
      $2=$dst;
      $3=$src;
      var $4=$3;
      var $5=(($4)|0);
      var $st$14$0=(($5)|0);
      var $6$0=HEAP32[(($st$14$0)>>2)];
      var $st$14$1=(($5+4)|0);
      var $6$1=HEAPU32[(($st$14$1)>>2)];
      var $7$0=($6$1 >>> 31) | (0 << 1);
      var $7$1=(0 >>> 31) | (0 << 1);
      var $8$0=$7$0;
      var $8=$8$0;
      $exb=$8;
      var $9=$2;
      var $10=(($9)|0);
      var $st$25$0=(($10)|0);
      var $11$0=HEAP32[(($st$25$0)>>2)];
      var $st$25$1=(($10+4)|0);
      var $11$1=HEAPU32[(($st$25$1)>>2)];
      var $12$0=($11$1 >>> 31) | (0 << 1);
      var $12$1=(0 >>> 31) | (0 << 1);
      var $13$0=$12$0;
      var $13=$13$0;
      var $14=$exb;
      var $15=(($14+$13)|0);
      $exb=$15;
      var $16=$exb;
      var $17=$16 >> 1;
      $exb=$17;
      var $18=$3;
      var $19=(($18+10)|0);
      var $20=HEAPU8[($19)];
      var $21=(($20)&255);
      var $22=$2;
      var $23=(($22+10)|0);
      var $24=HEAPU8[($23)];
      var $25=(($24)&255);
      var $26=(($21)|0)!=(($25)|0);
      if ($26) { __label__ = 2; break; } else { __label__ = 3; break; }
    case 2: 
      var $28=$exb;
      var $29=(($28+1)|0);
      $exb=$29;
      __label__ = 3; break;
    case 3: 
      var $31=$2;
      var $32=(($31+8)|0);
      var $33=HEAPU16[(($32)>>1)];
      var $34=(($33)&65535);
      var $35=$3;
      var $36=(($35+8)|0);
      var $37=HEAPU16[(($36)>>1)];
      var $38=(($37)&65535);
      var $39=$exb;
      var $40=((64-$39)|0);
      var $41=(($38+$40)|0);
      var $42=(($34)|0) >= (($41)|0);
      if ($42) { __label__ = 4; break; } else { __label__ = 5; break; }
    case 4: 
      __label__ = 65; break;
    case 5: 
      var $45=$2;
      var $46=(($45+8)|0);
      var $47=HEAPU16[(($46)>>1)];
      var $48=(($47)&65535);
      var $49=$3;
      var $50=(($49+8)|0);
      var $51=HEAPU16[(($50)>>1)];
      var $52=(($51)&65535);
      var $53=$exb;
      var $54=((64-$53)|0);
      var $55=(($52-$54)|0);
      var $56=(($48)|0) <= (($55)|0);
      if ($56) { __label__ = 6; break; } else { __label__ = 7; break; }
    case 6: 
      var $58=$2;
      var $59=$58;
      var $60=$3;
      var $61=$60;
      assert(12 % 1 === 0, 'memcpy given ' + 12 + ' bytes to copy. Problem with quantum=1 corrections perhaps?');for (var $$src = $61, $$dest = $59, $$stop = $$src + 12; $$src < $$stop; $$src++, $$dest++) {
        HEAP8[$$dest] = HEAP8[$$src]
      };
      __label__ = 65; break;
    case 7: 
      __label__ = 8; break;
    case 8: 
      var $64=$2;
      var $65=(($64+8)|0);
      var $66=HEAPU16[(($65)>>1)];
      var $67=(($66)&65535);
      var $68=$3;
      var $69=(($68+8)|0);
      var $70=HEAPU16[(($69)>>1)];
      var $71=(($70)&65535);
      var $72=(($67)|0) > (($71)|0);
      if ($72) { __label__ = 9; break; } else { __label__ = 10; break; }
    case 9: 
      var $74=$major;
      var $75=$2;
      var $76=$75;
      assert(12 % 1 === 0, 'memcpy given ' + 12 + ' bytes to copy. Problem with quantum=1 corrections perhaps?');for (var $$src = $76, $$dest = $74, $$stop = $$src + 12; $$src < $$stop; $$src++, $$dest++) {
        HEAP8[$$dest] = HEAP8[$$src]
      };
      var $77=$minor;
      var $78=$3;
      var $79=$78;
      assert(12 % 1 === 0, 'memcpy given ' + 12 + ' bytes to copy. Problem with quantum=1 corrections perhaps?');for (var $$src = $79, $$dest = $77, $$stop = $$src + 12; $$src < $$stop; $$src++, $$dest++) {
        HEAP8[$$dest] = HEAP8[$$src]
      };
      __label__ = 14; break;
    case 10: 
      var $81=$2;
      var $82=(($81+8)|0);
      var $83=HEAPU16[(($82)>>1)];
      var $84=(($83)&65535);
      var $85=$3;
      var $86=(($85+8)|0);
      var $87=HEAPU16[(($86)>>1)];
      var $88=(($87)&65535);
      var $89=(($84)|0) < (($88)|0);
      if ($89) { __label__ = 11; break; } else { __label__ = 12; break; }
    case 11: 
      var $91=$major;
      var $92=$3;
      var $93=$92;
      assert(12 % 1 === 0, 'memcpy given ' + 12 + ' bytes to copy. Problem with quantum=1 corrections perhaps?');for (var $$src = $93, $$dest = $91, $$stop = $$src + 12; $$src < $$stop; $$src++, $$dest++) {
        HEAP8[$$dest] = HEAP8[$$src]
      };
      var $94=$minor;
      var $95=$2;
      var $96=$95;
      assert(12 % 1 === 0, 'memcpy given ' + 12 + ' bytes to copy. Problem with quantum=1 corrections perhaps?');for (var $$src = $96, $$dest = $94, $$stop = $$src + 12; $$src < $$stop; $$src++, $$dest++) {
        HEAP8[$$dest] = HEAP8[$$src]
      };
      __label__ = 13; break;
    case 12: 
      var $98=$major;
      var $99=$2;
      var $100=$99;
      assert(12 % 1 === 0, 'memcpy given ' + 12 + ' bytes to copy. Problem with quantum=1 corrections perhaps?');for (var $$src = $100, $$dest = $98, $$stop = $$src + 12; $$src < $$stop; $$src++, $$dest++) {
        HEAP8[$$dest] = HEAP8[$$src]
      };
      var $101=$minor;
      var $102=$3;
      var $103=$102;
      assert(12 % 1 === 0, 'memcpy given ' + 12 + ' bytes to copy. Problem with quantum=1 corrections perhaps?');for (var $$src = $103, $$dest = $101, $$stop = $$src + 12; $$src < $$stop; $$src++, $$dest++) {
        HEAP8[$$dest] = HEAP8[$$src]
      };
      __label__ = 13; break;
    case 13: 
      __label__ = 14; break;
    case 14: 
      var $106=(($major+8)|0);
      var $107=HEAPU16[(($106)>>1)];
      var $108=(($107)&65535);
      var $109=$exb;
      var $110=(($108+$109)|0);
      var $111=(($minor+8)|0);
      var $112=HEAPU16[(($111)>>1)];
      var $113=(($112)&65535);
      var $114=(($110)|0) > (($113)|0);
      if ($114) { __label__ = 15; break; } else { __label__ = 35; break; }
    case 15: 
      var $116=(($major+8)|0);
      var $117=HEAPU16[(($116)>>1)];
      var $118=(($117)&65535);
      var $119=(($minor+8)|0);
      var $120=HEAPU16[(($119)>>1)];
      var $121=(($120)&65535);
      var $122=(($118-$121)|0);
      var $123=$exb;
      var $124=(($122+$123)|0);
      $b=$124;
      var $$emscripten$temp$0$0=-1;
      var $$emscripten$temp$0$1=-1;
      var $st$12$0=(($threshhold)|0);
      HEAP32[(($st$12$0)>>2)]=$$emscripten$temp$0$0;
      var $st$12$1=(($threshhold+4)|0);
      HEAP32[(($st$12$1)>>2)]=$$emscripten$temp$0$1;
      var $125=$b;
      var $126=((64-$125)|0);
      var $127$0=$126;
      var $127$1=(($126|0) < 0 ? -1 : 0);
      var $st$20$0=(($threshhold)|0);
      var $128$0=HEAP32[(($st$20$0)>>2)];
      var $st$20$1=(($threshhold+4)|0);
      var $128$1=HEAP32[(($st$20$1)>>2)];
      var $129=Runtime.bitshift64($128$0, $128$1,"lshr",$127$0);var $129$0 = $129[0], $129$1 = $129[1];
      var $st$25$0=(($threshhold)|0);
      HEAP32[(($st$25$0)>>2)]=$129$0;
      var $st$25$1=(($threshhold+4)|0);
      HEAP32[(($st$25$1)>>2)]=$129$1;
      var $130=(($minor)|0);
      var $st$30$0=(($130)|0);
      var $131$0=HEAP32[(($st$30$0)>>2)];
      var $st$30$1=(($130+4)|0);
      var $131$1=HEAP32[(($st$30$1)>>2)];
      var $st$34$0=(($threshhold)|0);
      var $132$0=HEAP32[(($st$34$0)>>2)];
      var $st$34$1=(($threshhold+4)|0);
      var $132$1=HEAP32[(($st$34$1)>>2)];
      var $133$0=$131$0 & $132$0;
      var $133$1=$131$1 & $132$1;
      var $st$40$0=(($waste)|0);
      HEAP32[(($st$40$0)>>2)]=$133$0;
      var $st$40$1=(($waste+4)|0);
      HEAP32[(($st$40$1)>>2)]=$133$1;
      var $st$44$0=(($threshhold)|0);
      var $134$0=HEAPU32[(($st$44$0)>>2)];
      var $st$44$1=(($threshhold+4)|0);
      var $134$1=HEAPU32[(($st$44$1)>>2)];
      var $135$0=($134$0 >>> 1) | ($134$1 << 31);
      var $135$1=($134$1 >>> 1) | (0 << 31);
      var $$emscripten$temp$1$0=1;
      var $$emscripten$temp$1$1=0;
      var $136$0 = ((($135$0)>>>0)+((($135$1)|0)*4294967296))+((($$emscripten$temp$1$0)>>>0)+((($$emscripten$temp$1$1)|0)*4294967296))>>>0; var $136$1 = Math.min(Math.floor((((($135$0)>>>0)+((($135$1)|0)*4294967296))+((($$emscripten$temp$1$0)>>>0)+((($$emscripten$temp$1$1)|0)*4294967296)))/4294967296), 4294967295);
      var $st$53$0=(($threshhold)|0);
      HEAP32[(($st$53$0)>>2)]=$136$0;
      var $st$53$1=(($threshhold+4)|0);
      HEAP32[(($st$53$1)>>2)]=$136$1;
      var $137=$b;
      var $138=(($minor+8)|0);
      var $139=HEAPU16[(($138)>>1)];
      var $140=(($139)&65535);
      var $141=(($140+$137)|0);
      var $142=(($141) & 65535);
      HEAP16[(($138)>>1)]=$142;
      var $143=$b;
      var $144$0=$143;
      var $144$1=(($143|0) < 0 ? -1 : 0);
      var $145=(($minor)|0);
      var $st$68$0=(($145)|0);
      var $146$0=HEAP32[(($st$68$0)>>2)];
      var $st$68$1=(($145+4)|0);
      var $146$1=HEAP32[(($st$68$1)>>2)];
      var $147=Runtime.bitshift64($146$0, $146$1,"lshr",$144$0);var $147$0 = $147[0], $147$1 = $147[1];
      var $st$73$0=(($145)|0);
      HEAP32[(($st$73$0)>>2)]=$147$0;
      var $st$73$1=(($145+4)|0);
      HEAP32[(($st$73$1)>>2)]=$147$1;
      var $148=$1;
      var $149=(($148+4)|0);
      var $150=(($149+2)|0);
      var $151=HEAPU16[(($150)>>1)];
      var $152=(($151)&65535);
      var $153=$152 >> 10;
      var $154=$153 & 3;
      var $155=(($154)|0)==0;
      if ($155) { __label__ = 16; break; } else { __label__ = 19; break; }
    case 16: 
      var $st$0$0=(($waste)|0);
      var $157$0=HEAP32[(($st$0$0)>>2)];
      var $st$0$1=(($waste+4)|0);
      var $157$1=HEAP32[(($st$0$1)>>2)];
      var $st$4$0=(($threshhold)|0);
      var $158$0=HEAP32[(($st$4$0)>>2)];
      var $st$4$1=(($threshhold+4)|0);
      var $158$1=HEAP32[(($st$4$1)>>2)];
      var $159=($157$1>>>0) >= ($158$1>>>0) && (($157$1>>>0) >  ($158$1>>>0) || ($157$0>>>0) >= ($158$0>>>0));
      if ($159) { __label__ = 17; break; } else { __label__ = 18; break; }
    case 17: 
      var $161=(($minor)|0);
      var $st$1$0=(($161)|0);
      var $162$0=HEAP32[(($st$1$0)>>2)];
      var $st$1$1=(($161+4)|0);
      var $162$1=HEAP32[(($st$1$1)>>2)];
      var $$emscripten$temp$2$0=1;
      var $$emscripten$temp$2$1=0;
      var $163$0 = ((($162$0)>>>0)+((($162$1)|0)*4294967296))+((($$emscripten$temp$2$0)>>>0)+((($$emscripten$temp$2$1)|0)*4294967296))>>>0; var $163$1 = Math.min(Math.floor((((($162$0)>>>0)+((($162$1)|0)*4294967296))+((($$emscripten$temp$2$0)>>>0)+((($$emscripten$temp$2$1)|0)*4294967296)))/4294967296), 4294967295);
      var $st$8$0=(($161)|0);
      HEAP32[(($st$8$0)>>2)]=$163$0;
      var $st$8$1=(($161+4)|0);
      HEAP32[(($st$8$1)>>2)]=$163$1;
      __label__ = 18; break;
    case 18: 
      __label__ = 34; break;
    case 19: 
      var $166=$1;
      var $167=(($166+4)|0);
      var $168=(($167+2)|0);
      var $169=HEAPU16[(($168)>>1)];
      var $170=(($169)&65535);
      var $171=$170 >> 10;
      var $172=$171 & 3;
      var $173=(($172)|0)==1;
      if ($173) { __label__ = 20; break; } else { __label__ = 24; break; }
    case 20: 
      var $st$0$0=(($waste)|0);
      var $175$0=HEAP32[(($st$0$0)>>2)];
      var $st$0$1=(($waste+4)|0);
      var $175$1=HEAP32[(($st$0$1)>>2)];
      var $$emscripten$temp$3$0=0;
      var $$emscripten$temp$3$1=0;
      var $176=$175$0 != $$emscripten$temp$3$0 || $175$1 != $$emscripten$temp$3$1;
      if ($176) { __label__ = 21; break; } else { __label__ = 23; break; }
    case 21: 
      var $178=(($minor+10)|0);
      var $179=HEAPU8[($178)];
      var $180=(($179)&255);
      var $181=(($180)|0)!=0;
      if ($181) { __label__ = 22; break; } else { __label__ = 23; break; }
    case 22: 
      var $183=(($minor)|0);
      var $st$1$0=(($183)|0);
      var $184$0=HEAP32[(($st$1$0)>>2)];
      var $st$1$1=(($183+4)|0);
      var $184$1=HEAP32[(($st$1$1)>>2)];
      var $$emscripten$temp$4$0=1;
      var $$emscripten$temp$4$1=0;
      var $185$0 = ((($184$0)>>>0)+((($184$1)|0)*4294967296))+((($$emscripten$temp$4$0)>>>0)+((($$emscripten$temp$4$1)|0)*4294967296))>>>0; var $185$1 = Math.min(Math.floor((((($184$0)>>>0)+((($184$1)|0)*4294967296))+((($$emscripten$temp$4$0)>>>0)+((($$emscripten$temp$4$1)|0)*4294967296)))/4294967296), 4294967295);
      var $st$8$0=(($183)|0);
      HEAP32[(($st$8$0)>>2)]=$185$0;
      var $st$8$1=(($183+4)|0);
      HEAP32[(($st$8$1)>>2)]=$185$1;
      __label__ = 23; break;
    case 23: 
      __label__ = 33; break;
    case 24: 
      var $188=$1;
      var $189=(($188+4)|0);
      var $190=(($189+2)|0);
      var $191=HEAPU16[(($190)>>1)];
      var $192=(($191)&65535);
      var $193=$192 >> 10;
      var $194=$193 & 3;
      var $195=(($194)|0)==2;
      if ($195) { __label__ = 25; break; } else { __label__ = 29; break; }
    case 25: 
      var $st$0$0=(($waste)|0);
      var $197$0=HEAP32[(($st$0$0)>>2)];
      var $st$0$1=(($waste+4)|0);
      var $197$1=HEAP32[(($st$0$1)>>2)];
      var $$emscripten$temp$5$0=0;
      var $$emscripten$temp$5$1=0;
      var $198=$197$0 != $$emscripten$temp$5$0 || $197$1 != $$emscripten$temp$5$1;
      if ($198) { __label__ = 26; break; } else { __label__ = 28; break; }
    case 26: 
      var $200=(($minor+10)|0);
      var $201=HEAP8[($200)];
      var $202=(($201 << 24) >> 24)!=0;
      if ($202) { __label__ = 28; break; } else { __label__ = 27; break; }
    case 27: 
      var $204=(($minor)|0);
      var $st$1$0=(($204)|0);
      var $205$0=HEAP32[(($st$1$0)>>2)];
      var $st$1$1=(($204+4)|0);
      var $205$1=HEAP32[(($st$1$1)>>2)];
      var $$emscripten$temp$6$0=1;
      var $$emscripten$temp$6$1=0;
      var $206$0 = ((($205$0)>>>0)+((($205$1)|0)*4294967296))+((($$emscripten$temp$6$0)>>>0)+((($$emscripten$temp$6$1)|0)*4294967296))>>>0; var $206$1 = Math.min(Math.floor((((($205$0)>>>0)+((($205$1)|0)*4294967296))+((($$emscripten$temp$6$0)>>>0)+((($$emscripten$temp$6$1)|0)*4294967296)))/4294967296), 4294967295);
      var $st$8$0=(($204)|0);
      HEAP32[(($st$8$0)>>2)]=$206$0;
      var $st$8$1=(($204+4)|0);
      HEAP32[(($st$8$1)>>2)]=$206$1;
      __label__ = 28; break;
    case 28: 
      __label__ = 32; break;
    case 29: 
      var $209=$1;
      var $210=(($209+4)|0);
      var $211=(($210+2)|0);
      var $212=HEAPU16[(($211)>>1)];
      var $213=(($212)&65535);
      var $214=$213 >> 10;
      var $215=$214 & 3;
      var $216=(($215)|0)==3;
      if ($216) { __label__ = 30; break; } else { __label__ = 31; break; }
    case 30: 
      __label__ = 31; break;
    case 31: 
      __label__ = 32; break;
    case 32: 
      __label__ = 33; break;
    case 33: 
      __label__ = 34; break;
    case 34: 
      __label__ = 35; break;
    case 35: 
      var $223=$exb;
      var $224=(($223)|0) > 0;
      if ($224) { __label__ = 36; break; } else { __label__ = 56; break; }
    case 36: 
      var $$emscripten$temp$7$0=-1;
      var $$emscripten$temp$7$1=-1;
      var $st$2$0=(($threshhold)|0);
      HEAP32[(($st$2$0)>>2)]=$$emscripten$temp$7$0;
      var $st$2$1=(($threshhold+4)|0);
      HEAP32[(($st$2$1)>>2)]=$$emscripten$temp$7$1;
      var $226=$exb;
      var $227=((64-$226)|0);
      var $228$0=$227;
      var $228$1=(($227|0) < 0 ? -1 : 0);
      var $st$10$0=(($threshhold)|0);
      var $229$0=HEAP32[(($st$10$0)>>2)];
      var $st$10$1=(($threshhold+4)|0);
      var $229$1=HEAP32[(($st$10$1)>>2)];
      var $230=Runtime.bitshift64($229$0, $229$1,"lshr",$228$0);var $230$0 = $230[0], $230$1 = $230[1];
      var $st$15$0=(($threshhold)|0);
      HEAP32[(($st$15$0)>>2)]=$230$0;
      var $st$15$1=(($threshhold+4)|0);
      HEAP32[(($st$15$1)>>2)]=$230$1;
      var $231=(($major)|0);
      var $st$20$0=(($231)|0);
      var $232$0=HEAP32[(($st$20$0)>>2)];
      var $st$20$1=(($231+4)|0);
      var $232$1=HEAP32[(($st$20$1)>>2)];
      var $st$24$0=(($threshhold)|0);
      var $233$0=HEAP32[(($st$24$0)>>2)];
      var $st$24$1=(($threshhold+4)|0);
      var $233$1=HEAP32[(($st$24$1)>>2)];
      var $234$0=$232$0 & $233$0;
      var $234$1=$232$1 & $233$1;
      var $st$30$0=(($waste)|0);
      HEAP32[(($st$30$0)>>2)]=$234$0;
      var $st$30$1=(($waste+4)|0);
      HEAP32[(($st$30$1)>>2)]=$234$1;
      var $st$34$0=(($threshhold)|0);
      var $235$0=HEAPU32[(($st$34$0)>>2)];
      var $st$34$1=(($threshhold+4)|0);
      var $235$1=HEAPU32[(($st$34$1)>>2)];
      var $236$0=($235$0 >>> 1) | ($235$1 << 31);
      var $236$1=($235$1 >>> 1) | (0 << 31);
      var $$emscripten$temp$8$0=1;
      var $$emscripten$temp$8$1=0;
      var $237$0 = ((($236$0)>>>0)+((($236$1)|0)*4294967296))+((($$emscripten$temp$8$0)>>>0)+((($$emscripten$temp$8$1)|0)*4294967296))>>>0; var $237$1 = Math.min(Math.floor((((($236$0)>>>0)+((($236$1)|0)*4294967296))+((($$emscripten$temp$8$0)>>>0)+((($$emscripten$temp$8$1)|0)*4294967296)))/4294967296), 4294967295);
      var $st$43$0=(($threshhold)|0);
      HEAP32[(($st$43$0)>>2)]=$237$0;
      var $st$43$1=(($threshhold+4)|0);
      HEAP32[(($st$43$1)>>2)]=$237$1;
      var $238=$exb;
      var $239=(($major+8)|0);
      var $240=HEAPU16[(($239)>>1)];
      var $241=(($240)&65535);
      var $242=(($241+$238)|0);
      var $243=(($242) & 65535);
      HEAP16[(($239)>>1)]=$243;
      var $244=$exb;
      var $245$0=$244;
      var $245$1=(($244|0) < 0 ? -1 : 0);
      var $246=(($major)|0);
      var $st$58$0=(($246)|0);
      var $247$0=HEAP32[(($st$58$0)>>2)];
      var $st$58$1=(($246+4)|0);
      var $247$1=HEAP32[(($st$58$1)>>2)];
      var $248=Runtime.bitshift64($247$0, $247$1,"lshr",$245$0);var $248$0 = $248[0], $248$1 = $248[1];
      var $st$63$0=(($246)|0);
      HEAP32[(($st$63$0)>>2)]=$248$0;
      var $st$63$1=(($246+4)|0);
      HEAP32[(($st$63$1)>>2)]=$248$1;
      var $249=$1;
      var $250=(($249+4)|0);
      var $251=(($250+2)|0);
      var $252=HEAPU16[(($251)>>1)];
      var $253=(($252)&65535);
      var $254=$253 >> 10;
      var $255=$254 & 3;
      var $256=(($255)|0)==0;
      if ($256) { __label__ = 37; break; } else { __label__ = 40; break; }
    case 37: 
      var $st$0$0=(($waste)|0);
      var $258$0=HEAP32[(($st$0$0)>>2)];
      var $st$0$1=(($waste+4)|0);
      var $258$1=HEAP32[(($st$0$1)>>2)];
      var $st$4$0=(($threshhold)|0);
      var $259$0=HEAP32[(($st$4$0)>>2)];
      var $st$4$1=(($threshhold+4)|0);
      var $259$1=HEAP32[(($st$4$1)>>2)];
      var $260=($258$1>>>0) >= ($259$1>>>0) && (($258$1>>>0) >  ($259$1>>>0) || ($258$0>>>0) >= ($259$0>>>0));
      if ($260) { __label__ = 38; break; } else { __label__ = 39; break; }
    case 38: 
      var $262=(($major)|0);
      var $st$1$0=(($262)|0);
      var $263$0=HEAP32[(($st$1$0)>>2)];
      var $st$1$1=(($262+4)|0);
      var $263$1=HEAP32[(($st$1$1)>>2)];
      var $$emscripten$temp$9$0=1;
      var $$emscripten$temp$9$1=0;
      var $264$0 = ((($263$0)>>>0)+((($263$1)|0)*4294967296))+((($$emscripten$temp$9$0)>>>0)+((($$emscripten$temp$9$1)|0)*4294967296))>>>0; var $264$1 = Math.min(Math.floor((((($263$0)>>>0)+((($263$1)|0)*4294967296))+((($$emscripten$temp$9$0)>>>0)+((($$emscripten$temp$9$1)|0)*4294967296)))/4294967296), 4294967295);
      var $st$8$0=(($262)|0);
      HEAP32[(($st$8$0)>>2)]=$264$0;
      var $st$8$1=(($262+4)|0);
      HEAP32[(($st$8$1)>>2)]=$264$1;
      __label__ = 39; break;
    case 39: 
      __label__ = 55; break;
    case 40: 
      var $267=$1;
      var $268=(($267+4)|0);
      var $269=(($268+2)|0);
      var $270=HEAPU16[(($269)>>1)];
      var $271=(($270)&65535);
      var $272=$271 >> 10;
      var $273=$272 & 3;
      var $274=(($273)|0)==1;
      if ($274) { __label__ = 41; break; } else { __label__ = 45; break; }
    case 41: 
      var $st$0$0=(($waste)|0);
      var $276$0=HEAP32[(($st$0$0)>>2)];
      var $st$0$1=(($waste+4)|0);
      var $276$1=HEAP32[(($st$0$1)>>2)];
      var $$emscripten$temp$10$0=0;
      var $$emscripten$temp$10$1=0;
      var $277=$276$0 != $$emscripten$temp$10$0 || $276$1 != $$emscripten$temp$10$1;
      if ($277) { __label__ = 42; break; } else { __label__ = 44; break; }
    case 42: 
      var $279=(($major+10)|0);
      var $280=HEAPU8[($279)];
      var $281=(($280)&255);
      var $282=(($281)|0)!=0;
      if ($282) { __label__ = 43; break; } else { __label__ = 44; break; }
    case 43: 
      var $284=(($major)|0);
      var $st$1$0=(($284)|0);
      var $285$0=HEAP32[(($st$1$0)>>2)];
      var $st$1$1=(($284+4)|0);
      var $285$1=HEAP32[(($st$1$1)>>2)];
      var $$emscripten$temp$11$0=1;
      var $$emscripten$temp$11$1=0;
      var $286$0 = ((($285$0)>>>0)+((($285$1)|0)*4294967296))+((($$emscripten$temp$11$0)>>>0)+((($$emscripten$temp$11$1)|0)*4294967296))>>>0; var $286$1 = Math.min(Math.floor((((($285$0)>>>0)+((($285$1)|0)*4294967296))+((($$emscripten$temp$11$0)>>>0)+((($$emscripten$temp$11$1)|0)*4294967296)))/4294967296), 4294967295);
      var $st$8$0=(($284)|0);
      HEAP32[(($st$8$0)>>2)]=$286$0;
      var $st$8$1=(($284+4)|0);
      HEAP32[(($st$8$1)>>2)]=$286$1;
      __label__ = 44; break;
    case 44: 
      __label__ = 54; break;
    case 45: 
      var $289=$1;
      var $290=(($289+4)|0);
      var $291=(($290+2)|0);
      var $292=HEAPU16[(($291)>>1)];
      var $293=(($292)&65535);
      var $294=$293 >> 10;
      var $295=$294 & 3;
      var $296=(($295)|0)==2;
      if ($296) { __label__ = 46; break; } else { __label__ = 50; break; }
    case 46: 
      var $st$0$0=(($waste)|0);
      var $298$0=HEAP32[(($st$0$0)>>2)];
      var $st$0$1=(($waste+4)|0);
      var $298$1=HEAP32[(($st$0$1)>>2)];
      var $$emscripten$temp$12$0=0;
      var $$emscripten$temp$12$1=0;
      var $299=$298$0 != $$emscripten$temp$12$0 || $298$1 != $$emscripten$temp$12$1;
      if ($299) { __label__ = 47; break; } else { __label__ = 49; break; }
    case 47: 
      var $301=(($major+10)|0);
      var $302=HEAP8[($301)];
      var $303=(($302 << 24) >> 24)!=0;
      if ($303) { __label__ = 49; break; } else { __label__ = 48; break; }
    case 48: 
      var $305=(($major)|0);
      var $st$1$0=(($305)|0);
      var $306$0=HEAP32[(($st$1$0)>>2)];
      var $st$1$1=(($305+4)|0);
      var $306$1=HEAP32[(($st$1$1)>>2)];
      var $$emscripten$temp$13$0=1;
      var $$emscripten$temp$13$1=0;
      var $307$0 = ((($306$0)>>>0)+((($306$1)|0)*4294967296))+((($$emscripten$temp$13$0)>>>0)+((($$emscripten$temp$13$1)|0)*4294967296))>>>0; var $307$1 = Math.min(Math.floor((((($306$0)>>>0)+((($306$1)|0)*4294967296))+((($$emscripten$temp$13$0)>>>0)+((($$emscripten$temp$13$1)|0)*4294967296)))/4294967296), 4294967295);
      var $st$8$0=(($305)|0);
      HEAP32[(($st$8$0)>>2)]=$307$0;
      var $st$8$1=(($305+4)|0);
      HEAP32[(($st$8$1)>>2)]=$307$1;
      __label__ = 49; break;
    case 49: 
      __label__ = 53; break;
    case 50: 
      var $310=$1;
      var $311=(($310+4)|0);
      var $312=(($311+2)|0);
      var $313=HEAPU16[(($312)>>1)];
      var $314=(($313)&65535);
      var $315=$314 >> 10;
      var $316=$315 & 3;
      var $317=(($316)|0)==3;
      if ($317) { __label__ = 51; break; } else { __label__ = 52; break; }
    case 51: 
      __label__ = 52; break;
    case 52: 
      __label__ = 53; break;
    case 53: 
      __label__ = 54; break;
    case 54: 
      __label__ = 55; break;
    case 55: 
      __label__ = 56; break;
    case 56: 
      var $324=$3;
      var $325=(($324+10)|0);
      var $326=HEAPU8[($325)];
      var $327=(($326)&255);
      var $328=$2;
      var $329=(($328+10)|0);
      var $330=HEAPU8[($329)];
      var $331=(($330)&255);
      var $332=(($327)|0)==(($331)|0);
      if ($332) { __label__ = 57; break; } else { __label__ = 58; break; }
    case 57: 
      var $334=(($major+8)|0);
      var $335=HEAP16[(($334)>>1)];
      var $336=$2;
      var $337=(($336+8)|0);
      HEAP16[(($337)>>1)]=$335;
      var $338=(($major+10)|0);
      var $339=HEAP8[($338)];
      var $340=$2;
      var $341=(($340+10)|0);
      HEAP8[($341)]=$339;
      var $342=(($minor)|0);
      var $st$11$0=(($342)|0);
      var $343$0=HEAP32[(($st$11$0)>>2)];
      var $st$11$1=(($342+4)|0);
      var $343$1=HEAP32[(($st$11$1)>>2)];
      var $344=(($major)|0);
      var $st$16$0=(($344)|0);
      var $345$0=HEAP32[(($st$16$0)>>2)];
      var $st$16$1=(($344+4)|0);
      var $345$1=HEAP32[(($st$16$1)>>2)];
      var $346$0 = ((($343$0)>>>0)+((($343$1)|0)*4294967296))+((($345$0)>>>0)+((($345$1)|0)*4294967296))>>>0; var $346$1 = Math.min(Math.floor((((($343$0)>>>0)+((($343$1)|0)*4294967296))+((($345$0)>>>0)+((($345$1)|0)*4294967296)))/4294967296), 4294967295);
      var $347=$2;
      var $348=(($347)|0);
      var $st$23$0=(($348)|0);
      HEAP32[(($st$23$0)>>2)]=$346$0;
      var $st$23$1=(($348+4)|0);
      HEAP32[(($st$23$1)>>2)]=$346$1;
      __label__ = 65; break;
    case 58: 
      var $350=(($minor+10)|0);
      var $351=HEAP8[($350)];
      var $352=(($351 << 24) >> 24)!=0;
      if ($352) { __label__ = 59; break; } else { __label__ = 60; break; }
    case 59: 
      var $354=(($minor)|0);
      var $st$1$0=(($354)|0);
      var $355$0=HEAP32[(($st$1$0)>>2)];
      var $st$1$1=(($354+4)|0);
      var $355$1=HEAP32[(($st$1$1)>>2)];
      var $$emscripten$temp$14$0=0;
      var $$emscripten$temp$14$1=0;
      var $356$0 = ((($$emscripten$temp$14$0)>>>0)+((($$emscripten$temp$14$1)|0)*4294967296))-((($355$0)>>>0)+((($355$1)|0)*4294967296))>>>0; var $356$1 = Math.min(Math.floor((((($$emscripten$temp$14$0)>>>0)+((($$emscripten$temp$14$1)|0)*4294967296))-((($355$0)>>>0)+((($355$1)|0)*4294967296)))/4294967296), 4294967295);
      var $357=(($minor)|0);
      var $st$9$0=(($357)|0);
      HEAP32[(($st$9$0)>>2)]=$356$0;
      var $st$9$1=(($357+4)|0);
      HEAP32[(($st$9$1)>>2)]=$356$1;
      __label__ = 60; break;
    case 60: 
      var $359=(($major+10)|0);
      var $360=HEAP8[($359)];
      var $361=(($360 << 24) >> 24)!=0;
      if ($361) { __label__ = 61; break; } else { __label__ = 62; break; }
    case 61: 
      var $363=(($major)|0);
      var $st$1$0=(($363)|0);
      var $364$0=HEAP32[(($st$1$0)>>2)];
      var $st$1$1=(($363+4)|0);
      var $364$1=HEAP32[(($st$1$1)>>2)];
      var $$emscripten$temp$15$0=0;
      var $$emscripten$temp$15$1=0;
      var $365$0 = ((($$emscripten$temp$15$0)>>>0)+((($$emscripten$temp$15$1)|0)*4294967296))-((($364$0)>>>0)+((($364$1)|0)*4294967296))>>>0; var $365$1 = Math.min(Math.floor((((($$emscripten$temp$15$0)>>>0)+((($$emscripten$temp$15$1)|0)*4294967296))-((($364$0)>>>0)+((($364$1)|0)*4294967296)))/4294967296), 4294967295);
      var $366=(($major)|0);
      var $st$9$0=(($366)|0);
      HEAP32[(($st$9$0)>>2)]=$365$0;
      var $st$9$1=(($366+4)|0);
      HEAP32[(($st$9$1)>>2)]=$365$1;
      __label__ = 62; break;
    case 62: 
      var $368=(($major+8)|0);
      var $369=HEAP16[(($368)>>1)];
      var $370=$2;
      var $371=(($370+8)|0);
      HEAP16[(($371)>>1)]=$369;
      var $372=(($minor)|0);
      var $st$6$0=(($372)|0);
      var $373$0=HEAP32[(($st$6$0)>>2)];
      var $st$6$1=(($372+4)|0);
      var $373$1=HEAP32[(($st$6$1)>>2)];
      var $374=(($major)|0);
      var $st$11$0=(($374)|0);
      var $375$0=HEAP32[(($st$11$0)>>2)];
      var $st$11$1=(($374+4)|0);
      var $375$1=HEAP32[(($st$11$1)>>2)];
      var $376$0 = ((($373$0)>>>0)+((($373$1)|0)*4294967296))+((($375$0)>>>0)+((($375$1)|0)*4294967296))>>>0; var $376$1 = Math.min(Math.floor((((($373$0)>>>0)+((($373$1)|0)*4294967296))+((($375$0)>>>0)+((($375$1)|0)*4294967296)))/4294967296), 4294967295);
      var $377=$2;
      var $378=(($377)|0);
      var $st$18$0=(($378)|0);
      HEAP32[(($st$18$0)>>2)]=$376$0;
      var $st$18$1=(($378+4)|0);
      HEAP32[(($st$18$1)>>2)]=$376$1;
      var $379=$2;
      var $380=(($379)|0);
      var $st$24$0=(($380)|0);
      var $381$0=HEAP32[(($st$24$0)>>2)];
      var $st$24$1=(($380+4)|0);
      var $381$1=HEAPU32[(($st$24$1)>>2)];
      var $382$0=($381$1 >>> 31) | (0 << 1);
      var $382$1=(0 >>> 31) | (0 << 1);
      var $383$0=$382$0;
      var $383=$383$0&255;
      var $384=$2;
      var $385=(($384+10)|0);
      HEAP8[($385)]=$383;
      var $386=$2;
      var $387=(($386+10)|0);
      var $388=HEAP8[($387)];
      var $389=(($388 << 24) >> 24)!=0;
      if ($389) { __label__ = 63; break; } else { __label__ = 64; break; }
    case 63: 
      var $391=$2;
      var $392=(($391)|0);
      var $st$2$0=(($392)|0);
      var $393$0=HEAP32[(($st$2$0)>>2)];
      var $st$2$1=(($392+4)|0);
      var $393$1=HEAP32[(($st$2$1)>>2)];
      var $$emscripten$temp$16$0=0;
      var $$emscripten$temp$16$1=0;
      var $394$0 = ((($$emscripten$temp$16$0)>>>0)+((($$emscripten$temp$16$1)|0)*4294967296))-((($393$0)>>>0)+((($393$1)|0)*4294967296))>>>0; var $394$1 = Math.min(Math.floor((((($$emscripten$temp$16$0)>>>0)+((($$emscripten$temp$16$1)|0)*4294967296))-((($393$0)>>>0)+((($393$1)|0)*4294967296)))/4294967296), 4294967295);
      var $395=$2;
      var $396=(($395)|0);
      var $st$11$0=(($396)|0);
      HEAP32[(($st$11$0)>>2)]=$394$0;
      var $st$11$1=(($396+4)|0);
      HEAP32[(($st$11$1)>>2)]=$394$1;
      __label__ = 64; break;
    case 64: 
      __label__ = 65; break;
    case 65: 
      STACKTOP = __stackBase__;
      return;
    default: assert(0, "bad label: " + __label__);
  }
}
_op_fadd["X"]=1;

function _op_fiadd32($ctx, $datz, $sz) {
  var __stackBase__  = STACKTOP; STACKTOP += 12; assert(STACKTOP % 4 == 0, "Stack is unaligned"); assert(STACKTOP < STACK_MAX, "Ran out of stack");
  var __label__;
  __label__ = 1; 
  while(1) switch(__label__) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $tmp=__stackBase__;
      var $ctx87;
      var $TOP;
      $1=$ctx;
      $2=$datz;
      $3=$sz;
      var $4=$1;
      var $5=(($4+244)|0);
      var $6=HEAP32[(($5)>>2)];
      var $7=$6;
      $ctx87=$7;
      var $8=$3;
      var $9=(($8)|0)!=4;
      if ($9) { __label__ = 3; break; } else { __label__ = 2; break; }
    case 2: 
      var $11=$ctx87;
      var $12=(($11)|0)!=0;
      if ($12) { __label__ = 4; break; } else { __label__ = 3; break; }
    case 3: 
      __label__ = 5; break;
    case 4: 
      var $15=$ctx87;
      var $16=$2;
      _softx87_unpack_raw_int32($15, $16, $tmp);
      var $17=$ctx87;
      _softx87_normalize($17, $tmp);
      var $18=$ctx87;
      var $19=(($18+4)|0);
      var $20=(($19)|0);
      var $21=HEAPU16[(($20)>>1)];
      var $22=(($21)&65535);
      var $23=$22 >> 11;
      var $24=$23 & 7;
      $TOP=$24;
      var $25=$ctx87;
      var $26=$TOP;
      var $27=$ctx87;
      var $28=(($27+4)|0);
      var $29=(($28+36)|0);
      var $30=(($29+$26*12)|0);
      _op_fadd($25, $30, $tmp);
      __label__ = 5; break;
    case 5: 
      STACKTOP = __stackBase__;
      return;
    default: assert(0, "bad label: " + __label__);
  }
}


function _op_fadd32($ctx, $datz, $sz) {
  var __stackBase__  = STACKTOP; STACKTOP += 12; assert(STACKTOP % 4 == 0, "Stack is unaligned"); assert(STACKTOP < STACK_MAX, "Ran out of stack");
  var __label__;
  __label__ = 1; 
  while(1) switch(__label__) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $tmp=__stackBase__;
      var $ctx87;
      var $TOP;
      $1=$ctx;
      $2=$datz;
      $3=$sz;
      var $4=$1;
      var $5=(($4+244)|0);
      var $6=HEAP32[(($5)>>2)];
      var $7=$6;
      $ctx87=$7;
      var $8=$3;
      var $9=(($8)|0)!=4;
      if ($9) { __label__ = 3; break; } else { __label__ = 2; break; }
    case 2: 
      var $11=$ctx87;
      var $12=(($11)|0)!=0;
      if ($12) { __label__ = 4; break; } else { __label__ = 3; break; }
    case 3: 
      __label__ = 5; break;
    case 4: 
      var $15=$ctx87;
      var $16=$2;
      _softx87_unpack_raw_fp32($15, $16, $tmp);
      var $17=$ctx87;
      _softx87_normalize($17, $tmp);
      var $18=$ctx87;
      var $19=(($18+4)|0);
      var $20=(($19)|0);
      var $21=HEAPU16[(($20)>>1)];
      var $22=(($21)&65535);
      var $23=$22 >> 11;
      var $24=$23 & 7;
      $TOP=$24;
      var $25=$ctx87;
      var $26=$TOP;
      var $27=$ctx87;
      var $28=(($27+4)|0);
      var $29=(($28+36)|0);
      var $30=(($29+$26*12)|0);
      _op_fadd($25, $30, $tmp);
      __label__ = 5; break;
    case 5: 
      STACKTOP = __stackBase__;
      return;
    default: assert(0, "bad label: " + __label__);
  }
}


function _op_fadd64($ctx, $datz, $sz) {
  var __stackBase__  = STACKTOP; STACKTOP += 12; assert(STACKTOP % 4 == 0, "Stack is unaligned"); assert(STACKTOP < STACK_MAX, "Ran out of stack");
  var __label__;
  __label__ = 1; 
  while(1) switch(__label__) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $tmp=__stackBase__;
      var $ctx87;
      var $TOP;
      $1=$ctx;
      $2=$datz;
      $3=$sz;
      var $4=$1;
      var $5=(($4+244)|0);
      var $6=HEAP32[(($5)>>2)];
      var $7=$6;
      $ctx87=$7;
      var $8=$3;
      var $9=(($8)|0)!=8;
      if ($9) { __label__ = 3; break; } else { __label__ = 2; break; }
    case 2: 
      var $11=$ctx87;
      var $12=(($11)|0)!=0;
      if ($12) { __label__ = 4; break; } else { __label__ = 3; break; }
    case 3: 
      __label__ = 5; break;
    case 4: 
      var $15=$ctx87;
      var $16=$2;
      _softx87_unpack_raw_fp64($15, $16, $tmp);
      var $17=$ctx87;
      _softx87_normalize($17, $tmp);
      var $18=$ctx87;
      var $19=(($18+4)|0);
      var $20=(($19)|0);
      var $21=HEAPU16[(($20)>>1)];
      var $22=(($21)&65535);
      var $23=$22 >> 11;
      var $24=$23 & 7;
      $TOP=$24;
      var $25=$ctx87;
      var $26=$TOP;
      var $27=$ctx87;
      var $28=(($27+4)|0);
      var $29=(($28+36)|0);
      var $30=(($29+$26*12)|0);
      _op_fadd($25, $30, $tmp);
      __label__ = 5; break;
    case 5: 
      STACKTOP = __stackBase__;
      return;
    default: assert(0, "bad label: " + __label__);
  }
}


function _Sfx86OpcodeExec_group_D8($opcode, $ctx) {
  ;
  var __label__;
  __label__ = 1; 
  while(1) switch(__label__) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $st0;
      var $i;
      var $mod;
      var $reg;
      var $rm;
      $2=$opcode;
      $3=$ctx;
      var $4=$2;
      var $5=(($4)&255);
      var $6=(($5)|0) >= 192;
      if ($6) { __label__ = 2; break; } else { __label__ = 4; break; }
    case 2: 
      var $8=$2;
      var $9=(($8)&255);
      var $10=(($9)|0) < 200;
      if ($10) { __label__ = 3; break; } else { __label__ = 4; break; }
    case 3: 
      var $12=$2;
      var $13=(($12)&255);
      var $14=(($13-192)|0);
      $i=$14;
      var $15=$3;
      var $16=(($15+4)|0);
      var $17=(($16)|0);
      var $18=HEAPU16[(($17)>>1)];
      var $19=(($18)&65535);
      var $20=$19 >> 11;
      var $21=$20 & 7;
      var $22=$i;
      var $23=(($21+$22)|0);
      var $24=$23 & 7;
      $i=$24;
      var $25=$3;
      var $26=(($25+4)|0);
      var $27=(($26)|0);
      var $28=HEAPU16[(($27)>>1)];
      var $29=(($28)&65535);
      var $30=$29 >> 11;
      var $31=$30 & 7;
      var $32=(($31)|0);
      var $33=$32 & 7;
      $st0=$33;
      var $34=$3;
      var $35=$st0;
      var $36=$3;
      var $37=(($36+4)|0);
      var $38=(($37+36)|0);
      var $39=(($38+$35*12)|0);
      var $40=$i;
      var $41=$3;
      var $42=(($41+4)|0);
      var $43=(($42+36)|0);
      var $44=(($43+$40*12)|0);
      _op_fadd($34, $39, $44);
      $1=1;
      __label__ = 11; break;
    case 4: 
      var $46=$2;
      var $47=(($46)&255);
      var $48=(($47)|0) < 192;
      if ($48) { __label__ = 5; break; } else { __label__ = 9; break; }
    case 5: 
      var $50=$2;
      var $51=(($50)&255);
      var $52=$51 >> 6;
      var $53=(($52) & 255);
      $mod=$53;
      var $54=$2;
      var $55=(($54)&255);
      var $56=$55 >> 3;
      var $57=$56 & 7;
      var $58=(($57) & 255);
      $reg=$58;
      var $59=$2;
      var $60=(($59)&255);
      var $61=$60 & 7;
      var $62=(($61) & 255);
      $rm=$62;
      var $63=$reg;
      var $64=(($63)&255);
      var $65=(($64)|0)==0;
      if ($65) { __label__ = 6; break; } else { __label__ = 7; break; }
    case 6: 
      var $67=$3;
      var $68=(($67+136)|0);
      var $69=(($68+16)|0);
      var $70=HEAP32[(($69)>>2)];
      var $71=$3;
      var $72=(($71+172)|0);
      var $73=HEAP32[(($72)>>2)];
      var $74=$mod;
      var $75=$rm;
      FUNCTION_TABLE[$70]($73, $74, $75, 4, 2);
      __label__ = 8; break;
    case 7: 
      $1=0;
      __label__ = 11; break;
    case 8: 
      $1=1;
      __label__ = 11; break;
    case 9: 
      __label__ = 10; break;
    case 10: 
      $1=0;
      __label__ = 11; break;
    case 11: 
      var $81=$1;
      ;
      return $81;
    default: assert(0, "bad label: " + __label__);
  }
}
_Sfx86OpcodeExec_group_D8["X"]=1;

function _Sfx86OpcodeDec_group_D8($opcode, $ctx, $buf) {
  ;
  var __label__;
  __label__ = 1; 
  while(1) switch(__label__) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $mod;
      var $reg;
      var $rm;
      $2=$opcode;
      $3=$ctx;
      $4=$buf;
      var $5=$2;
      var $6=(($5)&255);
      var $7=(($6)|0) >= 192;
      if ($7) { __label__ = 2; break; } else { __label__ = 4; break; }
    case 2: 
      var $9=$2;
      var $10=(($9)&255);
      var $11=(($10)|0) < 200;
      if ($11) { __label__ = 3; break; } else { __label__ = 4; break; }
    case 3: 
      var $13=$4;
      var $14=$2;
      var $15=(($14)&255);
      var $16=(($15-192)|0);
      var $17=_sprintf($13, ((STRING_TABLE.__str13)|0), (tempInt=STACKTOP,STACKTOP += 4,assert(STACKTOP < STACK_ROOT + STACK_MAX, "Ran out of stack"),HEAP32[((tempInt)>>2)]=$16,tempInt));
      $1=1;
      __label__ = 11; break;
    case 4: 
      var $19=$2;
      var $20=(($19)&255);
      var $21=(($20)|0) < 192;
      if ($21) { __label__ = 5; break; } else { __label__ = 9; break; }
    case 5: 
      var $23=$2;
      var $24=(($23)&255);
      var $25=$24 >> 6;
      var $26=(($25) & 255);
      $mod=$26;
      var $27=$2;
      var $28=(($27)&255);
      var $29=$28 >> 3;
      var $30=$29 & 7;
      var $31=(($30) & 255);
      $reg=$31;
      var $32=$2;
      var $33=(($32)&255);
      var $34=$33 & 7;
      var $35=(($34) & 255);
      $rm=$35;
      var $36=$3;
      var $37=(($36+136)|0);
      var $38=(($37+20)|0);
      var $39=HEAP32[(($38)>>2)];
      var $40=$3;
      var $41=(($40+172)|0);
      var $42=HEAP32[(($41)>>2)];
      var $43=$mod;
      var $44=$rm;
      FUNCTION_TABLE[$39]($42, 1, 0, $43, $44, ((_s87op1_tmp)|0));
      var $45=$reg;
      var $46=(($45)&255);
      var $47=(($46)|0)==0;
      if ($47) { __label__ = 6; break; } else { __label__ = 7; break; }
    case 6: 
      var $49=$4;
      var $50=_sprintf($49, ((STRING_TABLE.__str14)|0), (tempInt=STACKTOP,STACKTOP += 4,assert(STACKTOP < STACK_ROOT + STACK_MAX, "Ran out of stack"),HEAP32[((tempInt)>>2)]=((_s87op1_tmp)|0),tempInt));
      __label__ = 8; break;
    case 7: 
      $1=0;
      __label__ = 11; break;
    case 8: 
      $1=1;
      __label__ = 11; break;
    case 9: 
      __label__ = 10; break;
    case 10: 
      var $55=$4;
      var $56=(($55)|0);
      HEAP8[($56)]=0;
      $1=0;
      __label__ = 11; break;
    case 11: 
      var $58=$1;
      ;
      return $58;
    default: assert(0, "bad label: " + __label__);
  }
}
_Sfx86OpcodeDec_group_D8["X"]=1;

function _Sfx86OpcodeExec_group_D9($opcode, $ctx) {
  ;
  var __label__;
  __label__ = 1; 
  while(1) switch(__label__) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $TOP;
      var $TOP1;
      var $TOP2;
      var $i;
      var $mod;
      var $reg;
      var $rm;
      $2=$opcode;
      $3=$ctx;
      var $4=$2;
      var $5=(($4)&255);
      var $6=(($5)|0)==247;
      if ($6) { __label__ = 2; break; } else { __label__ = 3; break; }
    case 2: 
      var $8=$3;
      var $9=(($8+4)|0);
      var $10=(($9)|0);
      var $11=HEAPU16[(($10)>>1)];
      var $12=(($11)&65535);
      var $13=$12 >> 11;
      var $14=$13 & 7;
      $TOP=$14;
      var $15=$3;
      var $16=(($15+4)|0);
      var $17=(($16)|0);
      var $18=HEAPU16[(($17)>>1)];
      var $19=(($18)&65535);
      var $20=$19 & -513;
      var $21=(($20) & 65535);
      HEAP16[(($17)>>1)]=$21;
      var $22=$TOP;
      var $23=(($22+1)|0);
      var $24=$23 & 7;
      $TOP=$24;
      var $25=$3;
      var $26=(($25+4)|0);
      var $27=(($26)|0);
      var $28=HEAPU16[(($27)>>1)];
      var $29=(($28)&65535);
      var $30=$29 & -14337;
      var $31=$TOP;
      var $32=$31 & 7;
      var $33=$32 << 11;
      var $34=$30 | $33;
      var $35=(($34) & 65535);
      var $36=$3;
      var $37=(($36+4)|0);
      var $38=(($37)|0);
      HEAP16[(($38)>>1)]=$35;
      $1=1;
      __label__ = 22; break;
    case 3: 
      var $40=$2;
      var $41=(($40)&255);
      var $42=(($41)|0)==246;
      if ($42) { __label__ = 4; break; } else { __label__ = 5; break; }
    case 4: 
      var $44=$3;
      var $45=(($44+4)|0);
      var $46=(($45)|0);
      var $47=HEAPU16[(($46)>>1)];
      var $48=(($47)&65535);
      var $49=$48 >> 11;
      var $50=$49 & 7;
      $TOP1=$50;
      var $51=$3;
      var $52=(($51+4)|0);
      var $53=(($52)|0);
      var $54=HEAPU16[(($53)>>1)];
      var $55=(($54)&65535);
      var $56=$55 & -513;
      var $57=(($56) & 65535);
      HEAP16[(($53)>>1)]=$57;
      var $58=$TOP1;
      var $59=(($58-1)|0);
      var $60=$59 & 7;
      $TOP1=$60;
      var $61=$3;
      var $62=(($61+4)|0);
      var $63=(($62)|0);
      var $64=HEAPU16[(($63)>>1)];
      var $65=(($64)&65535);
      var $66=$65 & -14337;
      var $67=$TOP1;
      var $68=$67 & 7;
      var $69=$68 << 11;
      var $70=$66 | $69;
      var $71=(($70) & 65535);
      var $72=$3;
      var $73=(($72+4)|0);
      var $74=(($73)|0);
      HEAP16[(($74)>>1)]=$71;
      $1=1;
      __label__ = 22; break;
    case 5: 
      var $76=$2;
      var $77=(($76)&255);
      var $78=(($77)|0)==208;
      if ($78) { __label__ = 6; break; } else { __label__ = 7; break; }
    case 6: 
      $1=1;
      __label__ = 22; break;
    case 7: 
      var $81=$2;
      var $82=(($81)&255);
      var $83=(($82)|0) >= 192;
      if ($83) { __label__ = 8; break; } else { __label__ = 13; break; }
    case 8: 
      var $85=$2;
      var $86=(($85)&255);
      var $87=(($86)|0) < 200;
      if ($87) { __label__ = 9; break; } else { __label__ = 13; break; }
    case 9: 
      var $89=$2;
      var $90=(($89)&255);
      var $91=(($90-192)|0);
      $i=$91;
      var $92=$3;
      var $93=(($92+4)|0);
      var $94=(($93)|0);
      var $95=HEAPU16[(($94)>>1)];
      var $96=(($95)&65535);
      var $97=$96 >> 11;
      var $98=$97 & 7;
      var $99=$i;
      var $100=(($98+$99)|0);
      var $101=$100 & 7;
      $i=$101;
      var $102=$3;
      var $103=(($102+4)|0);
      var $104=(($103)|0);
      var $105=HEAPU16[(($104)>>1)];
      var $106=(($105)&65535);
      var $107=$106 >> 11;
      var $108=$107 & 7;
      $TOP2=$108;
      var $109=$3;
      var $110=(($109+4)|0);
      var $111=(($110+4)|0);
      var $112=HEAPU16[(($111)>>1)];
      var $113=(($112)&65535);
      var $114=$TOP2;
      var $115=((($114<<1))|0);
      var $116=$113 >> (($115)|0);
      var $117=$116 & 3;
      var $118=(($117)|0)!=3;
      if ($118) { __label__ = 10; break; } else { __label__ = 11; break; }
    case 10: 
      var $120=$3;
      var $121=(($120+4)|0);
      var $122=(($121)|0);
      var $123=HEAPU16[(($122)>>1)];
      var $124=(($123)&65535);
      var $125=$124 | 512;
      var $126=(($125) & 65535);
      HEAP16[(($122)>>1)]=$126;
      __label__ = 12; break;
    case 11: 
      var $128=$3;
      var $129=(($128+4)|0);
      var $130=(($129)|0);
      var $131=HEAPU16[(($130)>>1)];
      var $132=(($131)&65535);
      var $133=$132 & -513;
      var $134=(($133) & 65535);
      HEAP16[(($130)>>1)]=$134;
      __label__ = 12; break;
    case 12: 
      var $136=$TOP2;
      var $137=(($136-1)|0);
      var $138=$137 & 7;
      $TOP2=$138;
      var $139=$3;
      var $140=(($139+4)|0);
      var $141=(($140)|0);
      var $142=HEAPU16[(($141)>>1)];
      var $143=(($142)&65535);
      var $144=$143 & -14337;
      var $145=$TOP2;
      var $146=$145 & 7;
      var $147=$146 << 11;
      var $148=$144 | $147;
      var $149=(($148) & 65535);
      var $150=$3;
      var $151=(($150+4)|0);
      var $152=(($151)|0);
      HEAP16[(($152)>>1)]=$149;
      var $153=$3;
      var $154=(($153+4)|0);
      var $155=(($154+4)|0);
      var $156=HEAPU16[(($155)>>1)];
      var $157=(($156)&65535);
      var $158=$TOP2;
      var $159=((($158<<1))|0);
      var $160=3 << $159;
      var $161=$160 ^ -1;
      var $162=$157 & $161;
      var $163=$TOP2;
      var $164=((($163<<1))|0);
      var $165=0 << $164;
      var $166=$162 | $165;
      var $167=(($166) & 65535);
      var $168=$3;
      var $169=(($168+4)|0);
      var $170=(($169+4)|0);
      HEAP16[(($170)>>1)]=$167;
      var $171=$i;
      var $172=$3;
      var $173=(($172+4)|0);
      var $174=(($173+36)|0);
      var $175=(($174+$171*12)|0);
      var $176=(($175+8)|0);
      var $177=HEAP16[(($176)>>1)];
      var $178=$TOP2;
      var $179=$3;
      var $180=(($179+4)|0);
      var $181=(($180+36)|0);
      var $182=(($181+$178*12)|0);
      var $183=(($182+8)|0);
      HEAP16[(($183)>>1)]=$177;
      var $184=$i;
      var $185=$3;
      var $186=(($185+4)|0);
      var $187=(($186+36)|0);
      var $188=(($187+$184*12)|0);
      var $189=(($188)|0);
      var $st$58$0=(($189)|0);
      var $190$0=HEAP32[(($st$58$0)>>2)];
      var $st$58$1=(($189+4)|0);
      var $190$1=HEAP32[(($st$58$1)>>2)];
      var $191=$TOP2;
      var $192=$3;
      var $193=(($192+4)|0);
      var $194=(($193+36)|0);
      var $195=(($194+$191*12)|0);
      var $196=(($195)|0);
      var $st$68$0=(($196)|0);
      HEAP32[(($st$68$0)>>2)]=$190$0;
      var $st$68$1=(($196+4)|0);
      HEAP32[(($st$68$1)>>2)]=$190$1;
      var $197=$i;
      var $198=$3;
      var $199=(($198+4)|0);
      var $200=(($199+36)|0);
      var $201=(($200+$197*12)|0);
      var $202=(($201+10)|0);
      var $203=HEAP8[($202)];
      var $204=$TOP2;
      var $205=$3;
      var $206=(($205+4)|0);
      var $207=(($206+36)|0);
      var $208=(($207+$204*12)|0);
      var $209=(($208+10)|0);
      HEAP8[($209)]=$203;
      $1=1;
      __label__ = 22; break;
    case 13: 
      var $211=$2;
      var $212=(($211)&255);
      var $213=(($212)|0) < 192;
      if ($213) { __label__ = 14; break; } else { __label__ = 18; break; }
    case 14: 
      var $215=$2;
      var $216=(($215)&255);
      var $217=$216 >> 6;
      var $218=(($217) & 255);
      $mod=$218;
      var $219=$2;
      var $220=(($219)&255);
      var $221=$220 >> 3;
      var $222=$221 & 7;
      var $223=(($222) & 255);
      $reg=$223;
      var $224=$2;
      var $225=(($224)&255);
      var $226=$225 & 7;
      var $227=(($226) & 255);
      $rm=$227;
      var $228=$reg;
      var $229=(($228)&255);
      var $230=(($229)|0)==0;
      if ($230) { __label__ = 15; break; } else { __label__ = 16; break; }
    case 15: 
      var $232=$3;
      var $233=(($232+136)|0);
      var $234=(($233+16)|0);
      var $235=HEAP32[(($234)>>2)];
      var $236=$3;
      var $237=(($236+172)|0);
      var $238=HEAP32[(($237)>>2)];
      var $239=$mod;
      var $240=$rm;
      FUNCTION_TABLE[$235]($238, $239, $240, 4, 4);
      __label__ = 17; break;
    case 16: 
      $1=0;
      __label__ = 22; break;
    case 17: 
      $1=1;
      __label__ = 22; break;
    case 18: 
      __label__ = 19; break;
    case 19: 
      __label__ = 20; break;
    case 20: 
      __label__ = 21; break;
    case 21: 
      $1=0;
      __label__ = 22; break;
    case 22: 
      var $248=$1;
      ;
      return $248;
    default: assert(0, "bad label: " + __label__);
  }
}
_Sfx86OpcodeExec_group_D9["X"]=1;

function _Sfx86OpcodeDec_group_D9($opcode, $ctx, $buf) {
  ;
  var __label__;
  __label__ = 1; 
  while(1) switch(__label__) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $mod;
      var $reg;
      var $rm;
      $2=$opcode;
      $3=$ctx;
      $4=$buf;
      var $5=$2;
      var $6=(($5)&255);
      var $7=(($6)|0)==247;
      if ($7) { __label__ = 2; break; } else { __label__ = 3; break; }
    case 2: 
      var $9=$4;
      var $10=_strcpy($9, ((STRING_TABLE.__str8)|0));
      $1=1;
      __label__ = 20; break;
    case 3: 
      var $12=$2;
      var $13=(($12)&255);
      var $14=(($13)|0)==246;
      if ($14) { __label__ = 4; break; } else { __label__ = 5; break; }
    case 4: 
      var $16=$4;
      var $17=_strcpy($16, ((STRING_TABLE.__str9)|0));
      $1=1;
      __label__ = 20; break;
    case 5: 
      var $19=$2;
      var $20=(($19)&255);
      var $21=(($20)|0)==208;
      if ($21) { __label__ = 6; break; } else { __label__ = 7; break; }
    case 6: 
      var $23=$4;
      var $24=_strcpy($23, ((STRING_TABLE.__str10)|0));
      $1=1;
      __label__ = 20; break;
    case 7: 
      var $26=$2;
      var $27=(($26)&255);
      var $28=(($27)|0) >= 192;
      if ($28) { __label__ = 8; break; } else { __label__ = 10; break; }
    case 8: 
      var $30=$2;
      var $31=(($30)&255);
      var $32=(($31)|0) < 200;
      if ($32) { __label__ = 9; break; } else { __label__ = 10; break; }
    case 9: 
      var $34=$4;
      var $35=$2;
      var $36=(($35)&255);
      var $37=(($36-192)|0);
      var $38=_sprintf($34, ((STRING_TABLE.__str11)|0), (tempInt=STACKTOP,STACKTOP += 4,assert(STACKTOP < STACK_ROOT + STACK_MAX, "Ran out of stack"),HEAP32[((tempInt)>>2)]=$37,tempInt));
      $1=1;
      __label__ = 20; break;
    case 10: 
      var $40=$2;
      var $41=(($40)&255);
      var $42=(($41)|0) < 192;
      if ($42) { __label__ = 11; break; } else { __label__ = 15; break; }
    case 11: 
      var $44=$2;
      var $45=(($44)&255);
      var $46=$45 >> 6;
      var $47=(($46) & 255);
      $mod=$47;
      var $48=$2;
      var $49=(($48)&255);
      var $50=$49 >> 3;
      var $51=$50 & 7;
      var $52=(($51) & 255);
      $reg=$52;
      var $53=$2;
      var $54=(($53)&255);
      var $55=$54 & 7;
      var $56=(($55) & 255);
      $rm=$56;
      var $57=$3;
      var $58=(($57+136)|0);
      var $59=(($58+20)|0);
      var $60=HEAP32[(($59)>>2)];
      var $61=$3;
      var $62=(($61+172)|0);
      var $63=HEAP32[(($62)>>2)];
      var $64=$mod;
      var $65=$rm;
      FUNCTION_TABLE[$60]($63, 1, 0, $64, $65, ((_s87op1_tmp)|0));
      var $66=$reg;
      var $67=(($66)&255);
      var $68=(($67)|0)==0;
      if ($68) { __label__ = 12; break; } else { __label__ = 13; break; }
    case 12: 
      var $70=$4;
      var $71=_sprintf($70, ((STRING_TABLE.__str12)|0), (tempInt=STACKTOP,STACKTOP += 4,assert(STACKTOP < STACK_ROOT + STACK_MAX, "Ran out of stack"),HEAP32[((tempInt)>>2)]=((_s87op1_tmp)|0),tempInt));
      __label__ = 14; break;
    case 13: 
      $1=0;
      __label__ = 20; break;
    case 14: 
      $1=1;
      __label__ = 20; break;
    case 15: 
      __label__ = 16; break;
    case 16: 
      __label__ = 17; break;
    case 17: 
      __label__ = 18; break;
    case 18: 
      __label__ = 19; break;
    case 19: 
      var $79=$4;
      var $80=(($79)|0);
      HEAP8[($80)]=0;
      $1=0;
      __label__ = 20; break;
    case 20: 
      var $82=$1;
      ;
      return $82;
    default: assert(0, "bad label: " + __label__);
  }
}
_Sfx86OpcodeDec_group_D9["X"]=1;

function _Sfx86OpcodeExec_group_DA($opcode, $ctx) {
  ;
  var __label__;
  __label__ = 1; 
  while(1) switch(__label__) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $mod;
      var $reg;
      var $rm;
      $2=$opcode;
      $3=$ctx;
      var $4=$2;
      var $5=(($4)&255);
      var $6=(($5)|0) < 192;
      if ($6) { __label__ = 2; break; } else { __label__ = 6; break; }
    case 2: 
      var $8=$2;
      var $9=(($8)&255);
      var $10=$9 >> 6;
      var $11=(($10) & 255);
      $mod=$11;
      var $12=$2;
      var $13=(($12)&255);
      var $14=$13 >> 3;
      var $15=$14 & 7;
      var $16=(($15) & 255);
      $reg=$16;
      var $17=$2;
      var $18=(($17)&255);
      var $19=$18 & 7;
      var $20=(($19) & 255);
      $rm=$20;
      var $21=$reg;
      var $22=(($21)&255);
      var $23=(($22)|0)==0;
      if ($23) { __label__ = 3; break; } else { __label__ = 4; break; }
    case 3: 
      var $25=$3;
      var $26=(($25+136)|0);
      var $27=(($26+16)|0);
      var $28=HEAP32[(($27)>>2)];
      var $29=$3;
      var $30=(($29+172)|0);
      var $31=HEAP32[(($30)>>2)];
      var $32=$mod;
      var $33=$rm;
      FUNCTION_TABLE[$28]($31, $32, $33, 4, 6);
      __label__ = 5; break;
    case 4: 
      $1=0;
      __label__ = 7; break;
    case 5: 
      $1=1;
      __label__ = 7; break;
    case 6: 
      $1=0;
      __label__ = 7; break;
    case 7: 
      var $38=$1;
      ;
      return $38;
    default: assert(0, "bad label: " + __label__);
  }
}
_Sfx86OpcodeExec_group_DA["X"]=1;

function _Sfx86OpcodeDec_group_DA($opcode, $ctx, $buf) {
  ;
  var __label__;
  __label__ = 1; 
  while(1) switch(__label__) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $mod;
      var $reg;
      var $rm;
      $2=$opcode;
      $3=$ctx;
      $4=$buf;
      var $5=$2;
      var $6=(($5)&255);
      var $7=(($6)|0) < 192;
      if ($7) { __label__ = 2; break; } else { __label__ = 6; break; }
    case 2: 
      var $9=$2;
      var $10=(($9)&255);
      var $11=$10 >> 6;
      var $12=(($11) & 255);
      $mod=$12;
      var $13=$2;
      var $14=(($13)&255);
      var $15=$14 >> 3;
      var $16=$15 & 7;
      var $17=(($16) & 255);
      $reg=$17;
      var $18=$2;
      var $19=(($18)&255);
      var $20=$19 & 7;
      var $21=(($20) & 255);
      $rm=$21;
      var $22=$3;
      var $23=(($22+136)|0);
      var $24=(($23+20)|0);
      var $25=HEAP32[(($24)>>2)];
      var $26=$3;
      var $27=(($26+172)|0);
      var $28=HEAP32[(($27)>>2)];
      var $29=$mod;
      var $30=$rm;
      FUNCTION_TABLE[$25]($28, 1, 0, $29, $30, ((_s87op1_tmp)|0));
      var $31=$reg;
      var $32=(($31)&255);
      var $33=(($32)|0)==0;
      if ($33) { __label__ = 3; break; } else { __label__ = 4; break; }
    case 3: 
      var $35=$4;
      var $36=_sprintf($35, ((STRING_TABLE.__str7)|0), (tempInt=STACKTOP,STACKTOP += 4,assert(STACKTOP < STACK_ROOT + STACK_MAX, "Ran out of stack"),HEAP32[((tempInt)>>2)]=((_s87op1_tmp)|0),tempInt));
      __label__ = 5; break;
    case 4: 
      $1=0;
      __label__ = 7; break;
    case 5: 
      $1=1;
      __label__ = 7; break;
    case 6: 
      var $40=$4;
      var $41=(($40)|0);
      HEAP8[($41)]=0;
      $1=0;
      __label__ = 7; break;
    case 7: 
      var $43=$1;
      ;
      return $43;
    default: assert(0, "bad label: " + __label__);
  }
}
_Sfx86OpcodeDec_group_DA["X"]=1;

function _Sfx86OpcodeExec_group_DF($opcode, $ctx) {
  ;
  var __label__;

  var $1;
  var $2;
  $1=$opcode;
  $2=$ctx;
  ;
  return 0;
}


function _Sfx86OpcodeDec_group_DF($opcode, $ctx, $buf) {
  ;
  var __label__;

  var $1;
  var $2;
  var $3;
  $1=$opcode;
  $2=$ctx;
  $3=$buf;
  var $4=$3;
  var $5=(($4)|0);
  HEAP8[($5)]=0;
  ;
  return 0;
}


function _softx87_normalize($ctx, $val) {
  var __stackBase__  = STACKTOP; STACKTOP += 8; assert(STACKTOP % 4 == 0, "Stack is unaligned"); assert(STACKTOP < STACK_MAX, "Ran out of stack");
  var __label__;
  __label__ = 1; 
  while(1) switch(__label__) {
    case 1: 
      var $1;
      var $2;
      var $lead0;
      var $sh=__stackBase__;
      $1=$ctx;
      $2=$val;
      var $3=$2;
      var $4=(($3)|0);
      var $st$8$0=(($4)|0);
      var $5$0=HEAP32[(($st$8$0)>>2)];
      var $st$8$1=(($4+4)|0);
      var $5$1=HEAP32[(($st$8$1)>>2)];
      var $$emscripten$temp$0$0=0;
      var $$emscripten$temp$0$1=0;
      var $6=$5$0 != $$emscripten$temp$0$0 || $5$1 != $$emscripten$temp$0$1;
      if ($6) { __label__ = 3; break; } else { __label__ = 2; break; }
    case 2: 
      __label__ = 9; break;
    case 3: 
      $lead0=0;
      var $$emscripten$temp$1$0=0;
      var $$emscripten$temp$1$1=0;
      var $st$3$0=(($sh)|0);
      HEAP32[(($st$3$0)>>2)]=$$emscripten$temp$1$0;
      var $st$3$1=(($sh+4)|0);
      HEAP32[(($st$3$1)>>2)]=$$emscripten$temp$1$1;
      __label__ = 4; break;
    case 4: 
      var $10=$2;
      var $11=(($10)|0);
      var $st$2$0=(($11)|0);
      var $12$0=HEAP32[(($st$2$0)>>2)];
      var $st$2$1=(($11+4)|0);
      var $12$1=HEAP32[(($st$2$1)>>2)];
      var $st$6$0=(($sh)|0);
      var $13$0=HEAP32[(($st$6$0)>>2)];
      var $st$6$1=(($sh+4)|0);
      var $13$1=HEAP32[(($st$6$1)>>2)];
      var $$emscripten$temp$2$0=63;
      var $$emscripten$temp$2$1=0;
      var $14$0 = ((($$emscripten$temp$2$0)>>>0)+((($$emscripten$temp$2$1)|0)*4294967296))-((($13$0)>>>0)+((($13$1)|0)*4294967296))>>>0; var $14$1 = Math.min(Math.floor((((($$emscripten$temp$2$0)>>>0)+((($$emscripten$temp$2$1)|0)*4294967296))-((($13$0)>>>0)+((($13$1)|0)*4294967296)))/4294967296), 4294967295);
      var $15=Runtime.bitshift64($12$0, $12$1,"lshr",$14$0);var $15$0 = $15[0], $15$1 = $15[1];
      var $$emscripten$temp$3$0=1;
      var $$emscripten$temp$3$1=0;
      var $16$0=$15$0 & $$emscripten$temp$3$0;
      var $16$1=$15$1 & $$emscripten$temp$3$1;
      var $$emscripten$temp$4$0=0;
      var $$emscripten$temp$4$1=0;
      var $17=$16$0 != $$emscripten$temp$4$0 || $16$1 != $$emscripten$temp$4$1;
      var $18=$17 ^ 1;
      if ($18) { __label__ = 5; break; } else { __label__ = 6; break; }
    case 5: 
      var $20=$lead0;
      var $21=(($20+1)|0);
      $lead0=$21;
      var $st$3$0=(($sh)|0);
      var $22$0=HEAP32[(($st$3$0)>>2)];
      var $st$3$1=(($sh+4)|0);
      var $22$1=HEAP32[(($st$3$1)>>2)];
      var $$emscripten$temp$5$0=1;
      var $$emscripten$temp$5$1=0;
      var $23$0 = ((($22$0)>>>0)+((($22$1)|0)*4294967296))+((($$emscripten$temp$5$0)>>>0)+((($$emscripten$temp$5$1)|0)*4294967296))>>>0; var $23$1 = Math.min(Math.floor((((($22$0)>>>0)+((($22$1)|0)*4294967296))+((($$emscripten$temp$5$0)>>>0)+((($$emscripten$temp$5$1)|0)*4294967296)))/4294967296), 4294967295);
      var $st$10$0=(($sh)|0);
      HEAP32[(($st$10$0)>>2)]=$23$0;
      var $st$10$1=(($sh+4)|0);
      HEAP32[(($st$10$1)>>2)]=$23$1;
      __label__ = 4; break;
    case 6: 
      var $st$0$0=(($sh)|0);
      var $25$0=HEAP32[(($st$0$0)>>2)];
      var $st$0$1=(($sh+4)|0);
      var $25$1=HEAP32[(($st$0$1)>>2)];
      var $$emscripten$temp$6$0=0;
      var $$emscripten$temp$6$1=0;
      var $26=$25$0 != $$emscripten$temp$6$0 || $25$1 != $$emscripten$temp$6$1;
      if ($26) { __label__ = 8; break; } else { __label__ = 7; break; }
    case 7: 
      __label__ = 9; break;
    case 8: 
      var $st$0$0=(($sh)|0);
      var $29$0=HEAP32[(($st$0$0)>>2)];
      var $st$0$1=(($sh+4)|0);
      var $29$1=HEAP32[(($st$0$1)>>2)];
      var $30=$2;
      var $31=(($30+8)|0);
      var $32=HEAP16[(($31)>>1)];
      var $33$0=$32;
      var $33$1=0;
      var $34$0 = ((($33$0)>>>0)+((($33$1)|0)*4294967296))-((($29$0)>>>0)+((($29$1)|0)*4294967296))>>>0; var $34$1 = Math.min(Math.floor((((($33$0)>>>0)+((($33$1)|0)*4294967296))-((($29$0)>>>0)+((($29$1)|0)*4294967296)))/4294967296), 4294967295);
      var $35$0=$34$0;
      var $35=$35$0&65535;
      HEAP16[(($31)>>1)]=$35;
      var $st$13$0=(($sh)|0);
      var $36$0=HEAP32[(($st$13$0)>>2)];
      var $st$13$1=(($sh+4)|0);
      var $36$1=HEAP32[(($st$13$1)>>2)];
      var $37=$2;
      var $38=(($37)|0);
      var $st$19$0=(($38)|0);
      var $39$0=HEAP32[(($st$19$0)>>2)];
      var $st$19$1=(($38+4)|0);
      var $39$1=HEAP32[(($st$19$1)>>2)];
      var $40=Runtime.bitshift64($39$0, $39$1,"shl",$36$0);var $40$0 = $40[0], $40$1 = $40[1];
      var $st$24$0=(($38)|0);
      HEAP32[(($st$24$0)>>2)]=$40$0;
      var $st$24$1=(($38+4)|0);
      HEAP32[(($st$24$1)>>2)]=$40$1;
      __label__ = 9; break;
    case 9: 
      STACKTOP = __stackBase__;
      return;
    default: assert(0, "bad label: " + __label__);
  }
}
_softx87_normalize["X"]=1;

function _Sfx86OpcodeExec_group_DB($opcode, $ctx) {
  ;
  var __label__;
  __label__ = 1; 
  while(1) switch(__label__) {
    case 1: 
      var $1;
      var $2;
      var $3;
      $2=$opcode;
      $3=$ctx;
      var $4=$2;
      var $5=(($4)&255);
      var $6=(($5)|0)==227;
      if ($6) { __label__ = 2; break; } else { __label__ = 3; break; }
    case 2: 
      var $8=$3;
      _softx87_finit_setup($8);
      $1=1;
      __label__ = 4; break;
    case 3: 
      $1=0;
      __label__ = 4; break;
    case 4: 
      var $11=$1;
      ;
      return $11;
    default: assert(0, "bad label: " + __label__);
  }
}


function _Sfx86OpcodeDec_group_DB($opcode, $ctx, $buf) {
  ;
  var __label__;
  __label__ = 1; 
  while(1) switch(__label__) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $4;
      $2=$opcode;
      $3=$ctx;
      $4=$buf;
      var $5=$2;
      var $6=(($5)&255);
      var $7=(($6)|0)==227;
      if ($7) { __label__ = 2; break; } else { __label__ = 3; break; }
    case 2: 
      var $9=$4;
      var $10=_strcpy($9, ((STRING_TABLE.__str6)|0));
      $1=1;
      __label__ = 4; break;
    case 3: 
      var $12=$4;
      var $13=(($12)|0);
      HEAP8[($13)]=0;
      $1=0;
      __label__ = 4; break;
    case 4: 
      var $15=$1;
      ;
      return $15;
    default: assert(0, "bad label: " + __label__);
  }
}


function _Sfx86OpcodeExec_group_DC($opcode, $ctx) {
  ;
  var __label__;
  __label__ = 1; 
  while(1) switch(__label__) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $st0;
      var $i;
      var $mod;
      var $reg;
      var $rm;
      $2=$opcode;
      $3=$ctx;
      var $4=$2;
      var $5=(($4)&255);
      var $6=(($5)|0) >= 192;
      if ($6) { __label__ = 2; break; } else { __label__ = 4; break; }
    case 2: 
      var $8=$2;
      var $9=(($8)&255);
      var $10=(($9)|0) < 200;
      if ($10) { __label__ = 3; break; } else { __label__ = 4; break; }
    case 3: 
      var $12=$2;
      var $13=(($12)&255);
      var $14=(($13-192)|0);
      $i=$14;
      var $15=$3;
      var $16=(($15+4)|0);
      var $17=(($16)|0);
      var $18=HEAPU16[(($17)>>1)];
      var $19=(($18)&65535);
      var $20=$19 >> 11;
      var $21=$20 & 7;
      var $22=$i;
      var $23=(($21+$22)|0);
      var $24=$23 & 7;
      $i=$24;
      var $25=$3;
      var $26=(($25+4)|0);
      var $27=(($26)|0);
      var $28=HEAPU16[(($27)>>1)];
      var $29=(($28)&65535);
      var $30=$29 >> 11;
      var $31=$30 & 7;
      var $32=(($31)|0);
      var $33=$32 & 7;
      $st0=$33;
      var $34=$3;
      var $35=$i;
      var $36=$3;
      var $37=(($36+4)|0);
      var $38=(($37+36)|0);
      var $39=(($38+$35*12)|0);
      var $40=$st0;
      var $41=$3;
      var $42=(($41+4)|0);
      var $43=(($42+36)|0);
      var $44=(($43+$40*12)|0);
      _op_fadd($34, $39, $44);
      $1=1;
      __label__ = 11; break;
    case 4: 
      var $46=$2;
      var $47=(($46)&255);
      var $48=(($47)|0) < 192;
      if ($48) { __label__ = 5; break; } else { __label__ = 9; break; }
    case 5: 
      var $50=$2;
      var $51=(($50)&255);
      var $52=$51 >> 6;
      var $53=(($52) & 255);
      $mod=$53;
      var $54=$2;
      var $55=(($54)&255);
      var $56=$55 >> 3;
      var $57=$56 & 7;
      var $58=(($57) & 255);
      $reg=$58;
      var $59=$2;
      var $60=(($59)&255);
      var $61=$60 & 7;
      var $62=(($61) & 255);
      $rm=$62;
      var $63=$reg;
      var $64=(($63)&255);
      var $65=(($64)|0)==0;
      if ($65) { __label__ = 6; break; } else { __label__ = 7; break; }
    case 6: 
      var $67=$3;
      var $68=(($67+136)|0);
      var $69=(($68+16)|0);
      var $70=HEAP32[(($69)>>2)];
      var $71=$3;
      var $72=(($71+172)|0);
      var $73=HEAP32[(($72)>>2)];
      var $74=$mod;
      var $75=$rm;
      FUNCTION_TABLE[$70]($73, $74, $75, 8, 8);
      __label__ = 8; break;
    case 7: 
      $1=0;
      __label__ = 11; break;
    case 8: 
      $1=1;
      __label__ = 11; break;
    case 9: 
      __label__ = 10; break;
    case 10: 
      $1=0;
      __label__ = 11; break;
    case 11: 
      var $81=$1;
      ;
      return $81;
    default: assert(0, "bad label: " + __label__);
  }
}
_Sfx86OpcodeExec_group_DC["X"]=1;

function _Sfx86OpcodeDec_group_DC($opcode, $ctx, $buf) {
  ;
  var __label__;
  __label__ = 1; 
  while(1) switch(__label__) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $mod;
      var $reg;
      var $rm;
      $2=$opcode;
      $3=$ctx;
      $4=$buf;
      var $5=$2;
      var $6=(($5)&255);
      var $7=(($6)|0) >= 192;
      if ($7) { __label__ = 2; break; } else { __label__ = 4; break; }
    case 2: 
      var $9=$2;
      var $10=(($9)&255);
      var $11=(($10)|0) < 200;
      if ($11) { __label__ = 3; break; } else { __label__ = 4; break; }
    case 3: 
      var $13=$4;
      var $14=$2;
      var $15=(($14)&255);
      var $16=(($15-192)|0);
      var $17=_sprintf($13, ((STRING_TABLE.__str4)|0), (tempInt=STACKTOP,STACKTOP += 4,assert(STACKTOP < STACK_ROOT + STACK_MAX, "Ran out of stack"),HEAP32[((tempInt)>>2)]=$16,tempInt));
      $1=1;
      __label__ = 11; break;
    case 4: 
      var $19=$2;
      var $20=(($19)&255);
      var $21=(($20)|0) < 192;
      if ($21) { __label__ = 5; break; } else { __label__ = 9; break; }
    case 5: 
      var $23=$2;
      var $24=(($23)&255);
      var $25=$24 >> 6;
      var $26=(($25) & 255);
      $mod=$26;
      var $27=$2;
      var $28=(($27)&255);
      var $29=$28 >> 3;
      var $30=$29 & 7;
      var $31=(($30) & 255);
      $reg=$31;
      var $32=$2;
      var $33=(($32)&255);
      var $34=$33 & 7;
      var $35=(($34) & 255);
      $rm=$35;
      var $36=$3;
      var $37=(($36+136)|0);
      var $38=(($37+20)|0);
      var $39=HEAP32[(($38)>>2)];
      var $40=$3;
      var $41=(($40+172)|0);
      var $42=HEAP32[(($41)>>2)];
      var $43=$mod;
      var $44=$rm;
      FUNCTION_TABLE[$39]($42, 1, 0, $43, $44, ((_s87op1_tmp)|0));
      var $45=$reg;
      var $46=(($45)&255);
      var $47=(($46)|0)==0;
      if ($47) { __label__ = 6; break; } else { __label__ = 7; break; }
    case 6: 
      var $49=$4;
      var $50=_sprintf($49, ((STRING_TABLE.__str5)|0), (tempInt=STACKTOP,STACKTOP += 4,assert(STACKTOP < STACK_ROOT + STACK_MAX, "Ran out of stack"),HEAP32[((tempInt)>>2)]=((_s87op1_tmp)|0),tempInt));
      __label__ = 8; break;
    case 7: 
      $1=0;
      __label__ = 11; break;
    case 8: 
      $1=1;
      __label__ = 11; break;
    case 9: 
      __label__ = 10; break;
    case 10: 
      var $55=$4;
      var $56=(($55)|0);
      HEAP8[($56)]=0;
      $1=0;
      __label__ = 11; break;
    case 11: 
      var $58=$1;
      ;
      return $58;
    default: assert(0, "bad label: " + __label__);
  }
}
_Sfx86OpcodeDec_group_DC["X"]=1;

function _Sfx86OpcodeExec_group_DD($opcode, $ctx) {
  ;
  var __label__;
  __label__ = 1; 
  while(1) switch(__label__) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $mod;
      var $reg;
      var $rm;
      var $i;
      $2=$opcode;
      $3=$ctx;
      var $4=$2;
      var $5=(($4)&255);
      var $6=(($5)|0) < 192;
      if ($6) { __label__ = 2; break; } else { __label__ = 6; break; }
    case 2: 
      var $8=$2;
      var $9=(($8)&255);
      var $10=$9 >> 6;
      var $11=(($10) & 255);
      $mod=$11;
      var $12=$2;
      var $13=(($12)&255);
      var $14=$13 >> 3;
      var $15=$14 & 7;
      var $16=(($15) & 255);
      $reg=$16;
      var $17=$2;
      var $18=(($17)&255);
      var $19=$18 & 7;
      var $20=(($19) & 255);
      $rm=$20;
      var $21=$reg;
      var $22=(($21)&255);
      var $23=(($22)|0)==0;
      if ($23) { __label__ = 3; break; } else { __label__ = 4; break; }
    case 3: 
      var $25=$3;
      var $26=(($25+136)|0);
      var $27=(($26+16)|0);
      var $28=HEAP32[(($27)>>2)];
      var $29=$3;
      var $30=(($29+172)|0);
      var $31=HEAP32[(($30)>>2)];
      var $32=$mod;
      var $33=$rm;
      FUNCTION_TABLE[$28]($31, $32, $33, 8, 10);
      __label__ = 5; break;
    case 4: 
      $1=0;
      __label__ = 11; break;
    case 5: 
      $1=1;
      __label__ = 11; break;
    case 6: 
      var $37=$2;
      var $38=(($37)&255);
      var $39=(($38)|0) >= 192;
      if ($39) { __label__ = 7; break; } else { __label__ = 9; break; }
    case 7: 
      var $41=$2;
      var $42=(($41)&255);
      var $43=(($42)|0) < 200;
      if ($43) { __label__ = 8; break; } else { __label__ = 9; break; }
    case 8: 
      var $45=$3;
      var $46=(($45+4)|0);
      var $47=(($46)|0);
      var $48=HEAPU16[(($47)>>1)];
      var $49=(($48)&65535);
      var $50=$49 >> 11;
      var $51=$50 & 7;
      var $52=$2;
      var $53=(($52)&255);
      var $54=(($53-192)|0);
      var $55=(($51+$54)|0);
      var $56=$55 & 7;
      $i=$56;
      var $57=$3;
      var $58=(($57+4)|0);
      var $59=(($58+4)|0);
      var $60=HEAPU16[(($59)>>1)];
      var $61=(($60)&65535);
      var $62=$i;
      var $63=((($62<<1))|0);
      var $64=3 << $63;
      var $65=$64 ^ -1;
      var $66=$61 & $65;
      var $67=$i;
      var $68=((($67<<1))|0);
      var $69=3 << $68;
      var $70=$66 | $69;
      var $71=(($70) & 65535);
      var $72=$3;
      var $73=(($72+4)|0);
      var $74=(($73+4)|0);
      HEAP16[(($74)>>1)]=$71;
      $1=1;
      __label__ = 11; break;
    case 9: 
      __label__ = 10; break;
    case 10: 
      $1=0;
      __label__ = 11; break;
    case 11: 
      var $78=$1;
      ;
      return $78;
    default: assert(0, "bad label: " + __label__);
  }
}
_Sfx86OpcodeExec_group_DD["X"]=1;

function _Sfx86OpcodeDec_group_DD($opcode, $ctx, $buf) {
  ;
  var __label__;
  __label__ = 1; 
  while(1) switch(__label__) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $mod;
      var $reg;
      var $rm;
      $2=$opcode;
      $3=$ctx;
      $4=$buf;
      var $5=$2;
      var $6=(($5)&255);
      var $7=(($6)|0) < 192;
      if ($7) { __label__ = 2; break; } else { __label__ = 6; break; }
    case 2: 
      var $9=$2;
      var $10=(($9)&255);
      var $11=$10 >> 6;
      var $12=(($11) & 255);
      $mod=$12;
      var $13=$2;
      var $14=(($13)&255);
      var $15=$14 >> 3;
      var $16=$15 & 7;
      var $17=(($16) & 255);
      $reg=$17;
      var $18=$2;
      var $19=(($18)&255);
      var $20=$19 & 7;
      var $21=(($20) & 255);
      $rm=$21;
      var $22=$3;
      var $23=(($22+136)|0);
      var $24=(($23+20)|0);
      var $25=HEAP32[(($24)>>2)];
      var $26=$3;
      var $27=(($26+172)|0);
      var $28=HEAP32[(($27)>>2)];
      var $29=$mod;
      var $30=$rm;
      FUNCTION_TABLE[$25]($28, 1, 0, $29, $30, ((_s87op1_tmp)|0));
      var $31=$reg;
      var $32=(($31)&255);
      var $33=(($32)|0)==0;
      if ($33) { __label__ = 3; break; } else { __label__ = 4; break; }
    case 3: 
      var $35=$4;
      var $36=_sprintf($35, ((STRING_TABLE.__str2)|0), (tempInt=STACKTOP,STACKTOP += 4,assert(STACKTOP < STACK_ROOT + STACK_MAX, "Ran out of stack"),HEAP32[((tempInt)>>2)]=((_s87op1_tmp)|0),tempInt));
      __label__ = 5; break;
    case 4: 
      $1=0;
      __label__ = 11; break;
    case 5: 
      $1=1;
      __label__ = 11; break;
    case 6: 
      var $40=$2;
      var $41=(($40)&255);
      var $42=(($41)|0) >= 192;
      if ($42) { __label__ = 7; break; } else { __label__ = 9; break; }
    case 7: 
      var $44=$2;
      var $45=(($44)&255);
      var $46=(($45)|0) < 200;
      if ($46) { __label__ = 8; break; } else { __label__ = 9; break; }
    case 8: 
      var $48=$4;
      var $49=$2;
      var $50=(($49)&255);
      var $51=(($50-192)|0);
      var $52=_sprintf($48, ((STRING_TABLE.__str3)|0), (tempInt=STACKTOP,STACKTOP += 4,assert(STACKTOP < STACK_ROOT + STACK_MAX, "Ran out of stack"),HEAP32[((tempInt)>>2)]=$51,tempInt));
      $1=1;
      __label__ = 11; break;
    case 9: 
      __label__ = 10; break;
    case 10: 
      var $55=$4;
      var $56=(($55)|0);
      HEAP8[($56)]=0;
      $1=0;
      __label__ = 11; break;
    case 11: 
      var $58=$1;
      ;
      return $58;
    default: assert(0, "bad label: " + __label__);
  }
}
_Sfx86OpcodeDec_group_DD["X"]=1;

function _Sfx86OpcodeExec_group_DE($opcode, $ctx) {
  ;
  var __label__;
  __label__ = 1; 
  while(1) switch(__label__) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $st0;
      var $i;
      var $mod;
      var $reg;
      var $rm;
      $2=$opcode;
      $3=$ctx;
      var $4=$2;
      var $5=(($4)&255);
      var $6=(($5)|0) >= 192;
      if ($6) { __label__ = 2; break; } else { __label__ = 4; break; }
    case 2: 
      var $8=$2;
      var $9=(($8)&255);
      var $10=(($9)|0) < 200;
      if ($10) { __label__ = 3; break; } else { __label__ = 4; break; }
    case 3: 
      var $12=$2;
      var $13=(($12)&255);
      var $14=(($13-192)|0);
      $i=$14;
      var $15=$3;
      var $16=(($15+4)|0);
      var $17=(($16)|0);
      var $18=HEAPU16[(($17)>>1)];
      var $19=(($18)&65535);
      var $20=$19 >> 11;
      var $21=$20 & 7;
      var $22=$i;
      var $23=(($21+$22)|0);
      var $24=$23 & 7;
      $i=$24;
      var $25=$3;
      var $26=(($25+4)|0);
      var $27=(($26)|0);
      var $28=HEAPU16[(($27)>>1)];
      var $29=(($28)&65535);
      var $30=$29 >> 11;
      var $31=$30 & 7;
      var $32=(($31)|0);
      var $33=$32 & 7;
      $st0=$33;
      var $34=$3;
      var $35=$i;
      var $36=$3;
      var $37=(($36+4)|0);
      var $38=(($37+36)|0);
      var $39=(($38+$35*12)|0);
      var $40=$st0;
      var $41=$3;
      var $42=(($41+4)|0);
      var $43=(($42+36)|0);
      var $44=(($43+$40*12)|0);
      _op_fadd($34, $39, $44);
      var $45=$3;
      _softx86_popstack($45);
      $1=1;
      __label__ = 11; break;
    case 4: 
      var $47=$2;
      var $48=(($47)&255);
      var $49=(($48)|0) < 192;
      if ($49) { __label__ = 5; break; } else { __label__ = 9; break; }
    case 5: 
      var $51=$2;
      var $52=(($51)&255);
      var $53=$52 >> 6;
      var $54=(($53) & 255);
      $mod=$54;
      var $55=$2;
      var $56=(($55)&255);
      var $57=$56 >> 3;
      var $58=$57 & 7;
      var $59=(($58) & 255);
      $reg=$59;
      var $60=$2;
      var $61=(($60)&255);
      var $62=$61 & 7;
      var $63=(($62) & 255);
      $rm=$63;
      var $64=$reg;
      var $65=(($64)&255);
      var $66=(($65)|0)==0;
      if ($66) { __label__ = 6; break; } else { __label__ = 7; break; }
    case 6: 
      var $68=$3;
      var $69=(($68+136)|0);
      var $70=(($69+16)|0);
      var $71=HEAP32[(($70)>>2)];
      var $72=$3;
      var $73=(($72+172)|0);
      var $74=HEAP32[(($73)>>2)];
      var $75=$mod;
      var $76=$rm;
      FUNCTION_TABLE[$71]($74, $75, $76, 2, 12);
      __label__ = 8; break;
    case 7: 
      $1=0;
      __label__ = 11; break;
    case 8: 
      $1=1;
      __label__ = 11; break;
    case 9: 
      __label__ = 10; break;
    case 10: 
      $1=0;
      __label__ = 11; break;
    case 11: 
      var $82=$1;
      ;
      return $82;
    default: assert(0, "bad label: " + __label__);
  }
}
_Sfx86OpcodeExec_group_DE["X"]=1;

function _Sfx86OpcodeDec_group_DE($opcode, $ctx, $buf) {
  ;
  var __label__;
  __label__ = 1; 
  while(1) switch(__label__) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $mod;
      var $reg;
      var $rm;
      $2=$opcode;
      $3=$ctx;
      $4=$buf;
      var $5=$2;
      var $6=(($5)&255);
      var $7=(($6)|0) >= 192;
      if ($7) { __label__ = 2; break; } else { __label__ = 4; break; }
    case 2: 
      var $9=$2;
      var $10=(($9)&255);
      var $11=(($10)|0) < 200;
      if ($11) { __label__ = 3; break; } else { __label__ = 4; break; }
    case 3: 
      var $13=$4;
      var $14=$2;
      var $15=(($14)&255);
      var $16=(($15-192)|0);
      var $17=_sprintf($13, ((STRING_TABLE.__str)|0), (tempInt=STACKTOP,STACKTOP += 4,assert(STACKTOP < STACK_ROOT + STACK_MAX, "Ran out of stack"),HEAP32[((tempInt)>>2)]=$16,tempInt));
      $1=1;
      __label__ = 11; break;
    case 4: 
      var $19=$2;
      var $20=(($19)&255);
      var $21=(($20)|0) < 192;
      if ($21) { __label__ = 5; break; } else { __label__ = 9; break; }
    case 5: 
      var $23=$2;
      var $24=(($23)&255);
      var $25=$24 >> 6;
      var $26=(($25) & 255);
      $mod=$26;
      var $27=$2;
      var $28=(($27)&255);
      var $29=$28 >> 3;
      var $30=$29 & 7;
      var $31=(($30) & 255);
      $reg=$31;
      var $32=$2;
      var $33=(($32)&255);
      var $34=$33 & 7;
      var $35=(($34) & 255);
      $rm=$35;
      var $36=$3;
      var $37=(($36+136)|0);
      var $38=(($37+20)|0);
      var $39=HEAP32[(($38)>>2)];
      var $40=$3;
      var $41=(($40+172)|0);
      var $42=HEAP32[(($41)>>2)];
      var $43=$mod;
      var $44=$rm;
      FUNCTION_TABLE[$39]($42, 1, 0, $43, $44, ((_s87op1_tmp)|0));
      var $45=$reg;
      var $46=(($45)&255);
      var $47=(($46)|0)==0;
      if ($47) { __label__ = 6; break; } else { __label__ = 7; break; }
    case 6: 
      var $49=$4;
      var $50=_sprintf($49, ((STRING_TABLE.__str1)|0), (tempInt=STACKTOP,STACKTOP += 4,assert(STACKTOP < STACK_ROOT + STACK_MAX, "Ran out of stack"),HEAP32[((tempInt)>>2)]=((_s87op1_tmp)|0),tempInt));
      __label__ = 8; break;
    case 7: 
      $1=0;
      __label__ = 11; break;
    case 8: 
      $1=1;
      __label__ = 11; break;
    case 9: 
      __label__ = 10; break;
    case 10: 
      var $55=$4;
      var $56=(($55)|0);
      HEAP8[($56)]=0;
      $1=0;
      __label__ = 11; break;
    case 11: 
      var $58=$1;
      ;
      return $58;
    default: assert(0, "bad label: " + __label__);
  }
}
_Sfx86OpcodeDec_group_DE["X"]=1;

function _softx87_get_fpu_register_double($ctx, $i, $numtype) {
  ;
  var __label__;
  __label__ = 1; 
  while(1) switch(__label__) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $val;
      var $exp;
      $2=$ctx;
      $3=$i;
      $4=$numtype;
      var $5=$3;
      var $6=(($5)|0) < 0;
      if ($6) { __label__ = 3; break; } else { __label__ = 2; break; }
    case 2: 
      var $8=$3;
      var $9=(($8)|0) > 7;
      if ($9) { __label__ = 3; break; } else { __label__ = 6; break; }
    case 3: 
      var $11=$4;
      var $12=(($11)|0)!=0;
      if ($12) { __label__ = 4; break; } else { __label__ = 5; break; }
    case 4: 
      var $14=$4;
      HEAP32[(($14)>>2)]=3;
      __label__ = 5; break;
    case 5: 
      $1=0;
      __label__ = 23; break;
    case 6: 
      var $17=$3;
      var $18=$2;
      var $19=(($18+4)|0);
      var $20=(($19+36)|0);
      var $21=(($20+$17*12)|0);
      var $22=(($21+8)|0);
      var $23=HEAPU16[(($22)>>1)];
      var $24=(($23)&65535);
      var $25=(($24)|0)==32767;
      if ($25) { __label__ = 7; break; } else { __label__ = 18; break; }
    case 7: 
      var $27=$3;
      var $28=$2;
      var $29=(($28+4)|0);
      var $30=(($29+36)|0);
      var $31=(($30+$27*12)|0);
      var $32=(($31)|0);
      var $st$6$0=(($32)|0);
      var $33$0=HEAP32[(($st$6$0)>>2)];
      var $st$6$1=(($32+4)|0);
      var $33$1=HEAP32[(($st$6$1)>>2)];
      var $$emscripten$temp$0$0=0;
      var $$emscripten$temp$0$1=0;
      var $34=$33$0 == $$emscripten$temp$0$0 && $33$1 == $$emscripten$temp$0$1;
      if ($34) { __label__ = 8; break; } else { __label__ = 15; break; }
    case 8: 
      var $36=$3;
      var $37=$2;
      var $38=(($37+4)|0);
      var $39=(($38+36)|0);
      var $40=(($39+$36*12)|0);
      var $41=(($40+10)|0);
      var $42=HEAP8[($41)];
      var $43=(($42 << 24) >> 24)!=0;
      if ($43) { __label__ = 9; break; } else { __label__ = 12; break; }
    case 9: 
      var $45=$4;
      var $46=(($45)|0)!=0;
      if ($46) { __label__ = 10; break; } else { __label__ = 11; break; }
    case 10: 
      var $48=$4;
      HEAP32[(($48)>>2)]=1;
      __label__ = 11; break;
    case 11: 
      $1=0;
      __label__ = 23; break;
    case 12: 
      var $51=$4;
      var $52=(($51)|0)!=0;
      if ($52) { __label__ = 13; break; } else { __label__ = 14; break; }
    case 13: 
      var $54=$4;
      HEAP32[(($54)>>2)]=2;
      __label__ = 14; break;
    case 14: 
      $1=0;
      __label__ = 23; break;
    case 15: 
      var $57=$4;
      var $58=(($57)|0)!=0;
      if ($58) { __label__ = 16; break; } else { __label__ = 17; break; }
    case 16: 
      var $60=$4;
      HEAP32[(($60)>>2)]=3;
      __label__ = 17; break;
    case 17: 
      $1=0;
      __label__ = 23; break;
    case 18: 
      var $63=$3;
      var $64=$2;
      var $65=(($64+4)|0);
      var $66=(($65+36)|0);
      var $67=(($66+$63*12)|0);
      var $68=(($67+8)|0);
      var $69=HEAPU16[(($68)>>1)];
      var $70=(($69)&65535);
      var $71=(($70-16446)|0);
      $exp=$71;
      var $72=$3;
      var $73=$2;
      var $74=(($73+4)|0);
      var $75=(($74+36)|0);
      var $76=(($75+$72*12)|0);
      var $77=(($76)|0);
      var $st$16$0=(($77)|0);
      var $78$0=HEAP32[(($st$16$0)>>2)];
      var $st$16$1=(($77+4)|0);
      var $78$1=HEAP32[(($st$16$1)>>2)];
      var $79=$78$0 + $78$1*4294967296;
      $val=$79;
      var $80=$exp;
      var $81=(($80)|0);
      var $82=_llvm_pow_f64(2, $81);
      var $83=$val;
      var $84=$83*$82;
      $val=$84;
      var $85=$4;
      var $86=(($85)|0)!=0;
      if ($86) { __label__ = 19; break; } else { __label__ = 20; break; }
    case 19: 
      var $88=$4;
      HEAP32[(($88)>>2)]=0;
      __label__ = 20; break;
    case 20: 
      var $90=$3;
      var $91=$2;
      var $92=(($91+4)|0);
      var $93=(($92+36)|0);
      var $94=(($93+$90*12)|0);
      var $95=(($94+10)|0);
      var $96=HEAP8[($95)];
      var $97=(($96 << 24) >> 24)!=0;
      if ($97) { __label__ = 21; break; } else { __label__ = 22; break; }
    case 21: 
      var $99=$val;
      var $100=(-$99);
      $val=$100;
      __label__ = 22; break;
    case 22: 
      var $102=$val;
      $1=$102;
      __label__ = 23; break;
    case 23: 
      var $104=$1;
      ;
      return $104;
    default: assert(0, "bad label: " + __label__);
  }
}
_softx87_get_fpu_register_double["X"]=1;

function _softx87_def_on_softx86_fetch_exec_byte($ctx) {
  ;
  var __label__;

  var $1;
  $1=$ctx;
  ;
  return -1;
}


function _softx87_def_on_softx86_fetch_dec_byte($ctx) {
  ;
  var __label__;

  var $1;
  $1=$ctx;
  ;
  return -1;
}


function _softx87_on_sx86_exec_full_modrmonly_memx($ctx, $mod, $rm, $sz, $op64) {
  ;
  var __label__;

  var $1;
  var $2;
  var $3;
  var $4;
  var $5;
  $1=$ctx;
  $2=$mod;
  $3=$rm;
  $4=$sz;
  $5=$op64;
  ;
  return;
}


function _softx87_on_sx86_dec_full_modrmonly($ctx, $is_word, $dat32, $mod, $rm, $op1) {
  ;
  var __label__;

  var $1;
  var $2;
  var $3;
  var $4;
  var $5;
  var $6;
  $1=$ctx;
  $2=$is_word;
  $3=$dat32;
  $4=$mod;
  $5=$rm;
  $6=$op1;
  ;
  return;
}


function _softx87_getversion($major, $minor, $subminor) {
  ;
  var __label__;
  __label__ = 1; 
  while(1) switch(__label__) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $4;
      $2=$major;
      $3=$minor;
      $4=$subminor;
      var $5=$3;
      var $6=(($5)|0)!=0;
      if ($6) { __label__ = 2; break; } else { __label__ = 4; break; }
    case 2: 
      var $8=$2;
      var $9=(($8)|0)!=0;
      if ($9) { __label__ = 3; break; } else { __label__ = 4; break; }
    case 3: 
      var $11=$4;
      var $12=(($11)|0)!=0;
      if ($12) { __label__ = 5; break; } else { __label__ = 4; break; }
    case 4: 
      $1=0;
      __label__ = 6; break;
    case 5: 
      var $15=$2;
      HEAP32[(($15)>>2)]=0;
      var $16=$3;
      HEAP32[(($16)>>2)]=0;
      var $17=$4;
      HEAP32[(($17)>>2)]=29;
      $1=1;
      __label__ = 6; break;
    case 6: 
      var $19=$1;
      ;
      return $19;
    default: assert(0, "bad label: " + __label__);
  }
}


function _softx87_free($ctx) {
  ;
  var __label__;
  __label__ = 1; 
  while(1) switch(__label__) {
    case 1: 
      var $1;
      var $2;
      $2=$ctx;
      var $3=$2;
      var $4=(($3)|0)!=0;
      if ($4) { __label__ = 3; break; } else { __label__ = 2; break; }
    case 2: 
      $1=0;
      __label__ = 4; break;
    case 3: 
      $1=1;
      __label__ = 4; break;
    case 4: 
      var $8=$1;
      ;
      return $8;
    default: assert(0, "bad label: " + __label__);
  }
}


function _softx87_step_def_on_write_memory($_ctx, $address, $buf, $size) {
  ;
  var __label__;
  __label__ = 1; 
  while(1) switch(__label__) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $ctx;
      $1=$_ctx;
      $2=$address;
      $3=$buf;
      $4=$size;
      var $5=$1;
      var $6=$5;
      $ctx=$6;
      var $7=$ctx;
      var $8=(($7)|0)!=0;
      if ($8) { __label__ = 2; break; } else { __label__ = 4; break; }
    case 2: 
      var $10=$3;
      var $11=(($10)|0)!=0;
      if ($11) { __label__ = 3; break; } else { __label__ = 4; break; }
    case 3: 
      var $13=$4;
      var $14=(($13)|0) < 1;
      if ($14) { __label__ = 4; break; } else { __label__ = 5; break; }
    case 4: 
      __label__ = 5; break;
    case 5: 
      ;
      return;
    default: assert(0, "bad label: " + __label__);
  }
}


function _softx87_setbug($ctx, $bug_id, $on_off) {
  ;
  var __label__;
  __label__ = 1; 
  while(1) switch(__label__) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $4;
      $2=$ctx;
      $3=$bug_id;
      $4=$on_off;
      var $5=$3;
      var $6=(($5)|0)==1450705152;
      if ($6) { __label__ = 2; break; } else { __label__ = 3; break; }
    case 2: 
      var $8=$4;
      var $9=$2;
      var $10=(($9+160)|0);
      var $11=(($10)|0);
      HEAP8[($11)]=$8;
      $1=1;
      __label__ = 4; break;
    case 3: 
      $1=0;
      __label__ = 4; break;
    case 4: 
      var $14=$1;
      ;
      return $14;
    default: assert(0, "bad label: " + __label__);
  }
}


function _softx87_unpack_raw_int16($ctx, $data, $v) {
  ;
  var __label__;
  __label__ = 1; 
  while(1) switch(__label__) {
    case 1: 
      var $1;
      var $2;
      var $3;
      $1=$ctx;
      $2=$data;
      $3=$v;
      var $4=$2;
      var $5=$4;
      var $6=HEAP16[(($5)>>1)];
      var $7$0=$6;
      var $7$1=0;
      var $8=$3;
      var $9=(($8)|0);
      var $st$13$0=(($9)|0);
      HEAP32[(($st$13$0)>>2)]=$7$0;
      var $st$13$1=(($9+4)|0);
      HEAP32[(($st$13$1)>>2)]=$7$1;
      var $10=$3;
      var $11=(($10)|0);
      var $st$19$0=(($11)|0);
      var $12$0=HEAPU32[(($st$19$0)>>2)];
      var $st$19$1=(($11+4)|0);
      var $12$1=HEAPU32[(($st$19$1)>>2)];
      var $13$0=($12$0 >>> 15) | ($12$1 << 17);
      var $13$1=($12$1 >>> 15) | (0 << 17);
      var $14$0=$13$0;
      var $14=$14$0&255;
      var $15=$3;
      var $16=(($15+10)|0);
      HEAP8[($16)]=$14;
      var $17=$3;
      var $18=(($17+8)|0);
      HEAP16[(($18)>>1)]=14;
      var $19=$3;
      var $20=(($19+10)|0);
      var $21=HEAP8[($20)];
      var $22=(($21 << 24) >> 24)!=0;
      if ($22) { __label__ = 2; break; } else { __label__ = 3; break; }
    case 2: 
      var $24=$3;
      var $25=(($24)|0);
      var $st$2$0=(($25)|0);
      var $26$0=HEAP32[(($st$2$0)>>2)];
      var $st$2$1=(($25+4)|0);
      var $26$1=HEAP32[(($st$2$1)>>2)];
      var $$emscripten$temp$0$0=65535;
      var $$emscripten$temp$0$1=0;
      var $27$0=$26$0 ^ $$emscripten$temp$0$0;
      var $27$1=$26$1 ^ $$emscripten$temp$0$1;
      var $$emscripten$temp$1$0=1;
      var $$emscripten$temp$1$1=0;
      var $28$0 = ((($27$0)>>>0)+((($27$1)|0)*4294967296))+((($$emscripten$temp$1$0)>>>0)+((($$emscripten$temp$1$1)|0)*4294967296))>>>0; var $28$1 = Math.min(Math.floor((((($27$0)>>>0)+((($27$1)|0)*4294967296))+((($$emscripten$temp$1$0)>>>0)+((($$emscripten$temp$1$1)|0)*4294967296)))/4294967296), 4294967295);
      var $29=$3;
      var $30=(($29)|0);
      var $st$15$0=(($30)|0);
      HEAP32[(($st$15$0)>>2)]=$28$0;
      var $st$15$1=(($30+4)|0);
      HEAP32[(($st$15$1)>>2)]=$28$1;
      __label__ = 3; break;
    case 3: 
      var $32=$3;
      var $33=(($32)|0);
      var $st$2$0=(($33)|0);
      var $34$0=HEAPU32[(($st$2$0)>>2)];
      var $st$2$1=(($33+4)|0);
      var $34$1=HEAP32[(($st$2$1)>>2)];
      var $35$0=(0 << 17) | (0 >>> 15);
      var $35$1=($34$0 << 17) | (0 >>> 15);
      var $st$8$0=(($33)|0);
      HEAP32[(($st$8$0)>>2)]=$35$0;
      var $st$8$1=(($33+4)|0);
      HEAP32[(($st$8$1)>>2)]=$35$1;
      var $36=$3;
      var $37=(($36+8)|0);
      var $38=HEAPU16[(($37)>>1)];
      var $39=(($38)&65535);
      var $40=(($39+16383)|0);
      var $41=(($40) & 65535);
      var $42=$3;
      var $43=(($42+8)|0);
      HEAP16[(($43)>>1)]=$41;
      ;
      return;
    default: assert(0, "bad label: " + __label__);
  }
}
_softx87_unpack_raw_int16["X"]=1;

function _softx87_unpack_raw_int32($ctx, $data, $v) {
  ;
  var __label__;
  __label__ = 1; 
  while(1) switch(__label__) {
    case 1: 
      var $1;
      var $2;
      var $3;
      $1=$ctx;
      $2=$data;
      $3=$v;
      var $4=$2;
      var $5=$4;
      var $6=HEAP32[(($5)>>2)];
      var $7$0=$6;
      var $7$1=0;
      var $8=$3;
      var $9=(($8)|0);
      var $st$13$0=(($9)|0);
      HEAP32[(($st$13$0)>>2)]=$7$0;
      var $st$13$1=(($9+4)|0);
      HEAP32[(($st$13$1)>>2)]=$7$1;
      var $10=$3;
      var $11=(($10)|0);
      var $st$19$0=(($11)|0);
      var $12$0=HEAPU32[(($st$19$0)>>2)];
      var $st$19$1=(($11+4)|0);
      var $12$1=HEAPU32[(($st$19$1)>>2)];
      var $13$0=($12$0 >>> 31) | ($12$1 << 1);
      var $13$1=($12$1 >>> 31) | (0 << 1);
      var $14$0=$13$0;
      var $14=$14$0&255;
      var $15=$3;
      var $16=(($15+10)|0);
      HEAP8[($16)]=$14;
      var $17=$3;
      var $18=(($17+8)|0);
      HEAP16[(($18)>>1)]=30;
      var $19=$3;
      var $20=(($19+10)|0);
      var $21=HEAP8[($20)];
      var $22=(($21 << 24) >> 24)!=0;
      if ($22) { __label__ = 2; break; } else { __label__ = 3; break; }
    case 2: 
      var $24=$3;
      var $25=(($24)|0);
      var $st$2$0=(($25)|0);
      var $26$0=HEAP32[(($st$2$0)>>2)];
      var $st$2$1=(($25+4)|0);
      var $26$1=HEAP32[(($st$2$1)>>2)];
      var $$emscripten$temp$0$0=-1;
      var $$emscripten$temp$0$1=0;
      var $27$0=$26$0 ^ $$emscripten$temp$0$0;
      var $27$1=$26$1 ^ $$emscripten$temp$0$1;
      var $$emscripten$temp$1$0=1;
      var $$emscripten$temp$1$1=0;
      var $28$0 = ((($27$0)>>>0)+((($27$1)|0)*4294967296))+((($$emscripten$temp$1$0)>>>0)+((($$emscripten$temp$1$1)|0)*4294967296))>>>0; var $28$1 = Math.min(Math.floor((((($27$0)>>>0)+((($27$1)|0)*4294967296))+((($$emscripten$temp$1$0)>>>0)+((($$emscripten$temp$1$1)|0)*4294967296)))/4294967296), 4294967295);
      var $29=$3;
      var $30=(($29)|0);
      var $st$15$0=(($30)|0);
      HEAP32[(($st$15$0)>>2)]=$28$0;
      var $st$15$1=(($30+4)|0);
      HEAP32[(($st$15$1)>>2)]=$28$1;
      __label__ = 3; break;
    case 3: 
      var $32=$3;
      var $33=(($32)|0);
      var $st$2$0=(($33)|0);
      var $34$0=HEAPU32[(($st$2$0)>>2)];
      var $st$2$1=(($33+4)|0);
      var $34$1=HEAP32[(($st$2$1)>>2)];
      var $35$0=(0 << 1) | (0 >>> 31);
      var $35$1=($34$0 << 1) | (0 >>> 31);
      var $st$8$0=(($33)|0);
      HEAP32[(($st$8$0)>>2)]=$35$0;
      var $st$8$1=(($33+4)|0);
      HEAP32[(($st$8$1)>>2)]=$35$1;
      var $36=$3;
      var $37=(($36+8)|0);
      var $38=HEAPU16[(($37)>>1)];
      var $39=(($38)&65535);
      var $40=(($39+16383)|0);
      var $41=(($40) & 65535);
      var $42=$3;
      var $43=(($42+8)|0);
      HEAP16[(($43)>>1)]=$41;
      ;
      return;
    default: assert(0, "bad label: " + __label__);
  }
}
_softx87_unpack_raw_int32["X"]=1;

function _softx87_unpack_raw_fp32($ctx, $data, $v) {
  ;
  var __label__;

  var $1;
  var $2;
  var $3;
  $1=$ctx;
  $2=$data;
  $3=$v;
  var $4=$2;
  var $5=$4;
  var $6=HEAP32[(($5)>>2)];
  var $7$0=$6;
  var $7$1=0;
  var $8=$3;
  var $9=(($8)|0);
  var $st$13$0=(($9)|0);
  HEAP32[(($st$13$0)>>2)]=$7$0;
  var $st$13$1=(($9+4)|0);
  HEAP32[(($st$13$1)>>2)]=$7$1;
  var $10=$3;
  var $11=(($10)|0);
  var $st$19$0=(($11)|0);
  var $12$0=HEAPU32[(($st$19$0)>>2)];
  var $st$19$1=(($11+4)|0);
  var $12$1=HEAPU32[(($st$19$1)>>2)];
  var $13$0=($12$0 >>> 31) | ($12$1 << 1);
  var $13$1=($12$1 >>> 31) | (0 << 1);
  var $14$0=$13$0;
  var $14=$14$0&255;
  var $15=$3;
  var $16=(($15+10)|0);
  HEAP8[($16)]=$14;
  var $17=$3;
  var $18=(($17)|0);
  var $st$32$0=(($18)|0);
  var $19$0=HEAPU32[(($st$32$0)>>2)];
  var $st$32$1=(($18+4)|0);
  var $19$1=HEAPU32[(($st$32$1)>>2)];
  var $20$0=($19$0 >>> 23) | ($19$1 << 9);
  var $20$1=($19$1 >>> 23) | (0 << 9);
  var $$emscripten$temp$0$0=255;
  var $$emscripten$temp$0$1=0;
  var $21$0=$20$0 & $$emscripten$temp$0$0;
  var $21$1=$20$1 & $$emscripten$temp$0$1;
  var $22$0=$21$0;
  var $22=$22$0&65535;
  var $23=$3;
  var $24=(($23+8)|0);
  HEAP16[(($24)>>1)]=$22;
  var $25=$3;
  var $26=(($25)|0);
  var $st$49$0=(($26)|0);
  var $27$0=HEAP32[(($st$49$0)>>2)];
  var $st$49$1=(($26+4)|0);
  var $27$1=HEAP32[(($st$49$1)>>2)];
  var $$emscripten$temp$1$0=8388607;
  var $$emscripten$temp$1$1=0;
  var $28$0=$27$0 & $$emscripten$temp$1$0;
  var $28$1=$27$1 & $$emscripten$temp$1$1;
  var $st$57$0=(($26)|0);
  HEAP32[(($st$57$0)>>2)]=$28$0;
  var $st$57$1=(($26+4)|0);
  HEAP32[(($st$57$1)>>2)]=$28$1;
  var $29=$3;
  var $30=(($29)|0);
  var $st$63$0=(($30)|0);
  var $31$0=HEAP32[(($st$63$0)>>2)];
  var $st$63$1=(($30+4)|0);
  var $31$1=HEAP32[(($st$63$1)>>2)];
  var $$emscripten$temp$2$0=8388608;
  var $$emscripten$temp$2$1=0;
  var $32$0=$31$0 | $$emscripten$temp$2$0;
  var $32$1=$31$1 | $$emscripten$temp$2$1;
  var $st$71$0=(($30)|0);
  HEAP32[(($st$71$0)>>2)]=$32$0;
  var $st$71$1=(($30+4)|0);
  HEAP32[(($st$71$1)>>2)]=$32$1;
  var $33=$3;
  var $34=(($33)|0);
  var $st$77$0=(($34)|0);
  var $35$0=HEAPU32[(($st$77$0)>>2)];
  var $st$77$1=(($34+4)|0);
  var $35$1=HEAP32[(($st$77$1)>>2)];
  var $36$0=(0 << 8) | (0 >>> 24);
  var $36$1=($35$0 << 8) | (0 >>> 24);
  var $st$83$0=(($34)|0);
  HEAP32[(($st$83$0)>>2)]=$36$0;
  var $st$83$1=(($34+4)|0);
  HEAP32[(($st$83$1)>>2)]=$36$1;
  var $37=$3;
  var $38=(($37+8)|0);
  var $39=HEAPU16[(($38)>>1)];
  var $40=(($39)&65535);
  var $41=(($40-127)|0);
  var $42=(($41+16383)|0);
  var $43=(($42) & 65535);
  var $44=$3;
  var $45=(($44+8)|0);
  HEAP16[(($45)>>1)]=$43;
  ;
  return;
}
_softx87_unpack_raw_fp32["X"]=1;

function _softx87_unpack_raw_fp64($ctx, $data, $v) {
  ;
  var __label__;

  var $1;
  var $2;
  var $3;
  $1=$ctx;
  $2=$data;
  $3=$v;
  var $4=$2;
  var $5=$4;
  var $st$8$0=(($5)|0);
  var $6$0=HEAP32[(($st$8$0)>>2)];
  var $st$8$1=(($5+4)|0);
  var $6$1=HEAP32[(($st$8$1)>>2)];
  var $7=$3;
  var $8=(($7)|0);
  var $st$14$0=(($8)|0);
  HEAP32[(($st$14$0)>>2)]=$6$0;
  var $st$14$1=(($8+4)|0);
  HEAP32[(($st$14$1)>>2)]=$6$1;
  var $9=$3;
  var $10=(($9)|0);
  var $st$20$0=(($10)|0);
  var $11$0=HEAP32[(($st$20$0)>>2)];
  var $st$20$1=(($10+4)|0);
  var $11$1=HEAPU32[(($st$20$1)>>2)];
  var $12$0=($11$1 >>> 31) | (0 << 1);
  var $12$1=(0 >>> 31) | (0 << 1);
  var $13$0=$12$0;
  var $13=$13$0&255;
  var $14=$3;
  var $15=(($14+10)|0);
  HEAP8[($15)]=$13;
  var $16=$3;
  var $17=(($16)|0);
  var $st$33$0=(($17)|0);
  var $18$0=HEAP32[(($st$33$0)>>2)];
  var $st$33$1=(($17+4)|0);
  var $18$1=HEAPU32[(($st$33$1)>>2)];
  var $19$0=($18$1 >>> 20) | (0 << 12);
  var $19$1=(0 >>> 20) | (0 << 12);
  var $$emscripten$temp$0$0=2047;
  var $$emscripten$temp$0$1=0;
  var $20$0=$19$0 & $$emscripten$temp$0$0;
  var $20$1=$19$1 & $$emscripten$temp$0$1;
  var $21$0=$20$0;
  var $21=$21$0&65535;
  var $22=$3;
  var $23=(($22+8)|0);
  HEAP16[(($23)>>1)]=$21;
  var $24=$3;
  var $25=(($24)|0);
  var $st$50$0=(($25)|0);
  var $26$0=HEAP32[(($st$50$0)>>2)];
  var $st$50$1=(($25+4)|0);
  var $26$1=HEAP32[(($st$50$1)>>2)];
  var $$emscripten$temp$1$0=-1;
  var $$emscripten$temp$1$1=1048575;
  var $27$0=$26$0 & $$emscripten$temp$1$0;
  var $27$1=$26$1 & $$emscripten$temp$1$1;
  var $st$58$0=(($25)|0);
  HEAP32[(($st$58$0)>>2)]=$27$0;
  var $st$58$1=(($25+4)|0);
  HEAP32[(($st$58$1)>>2)]=$27$1;
  var $28=$3;
  var $29=(($28)|0);
  var $st$64$0=(($29)|0);
  var $30$0=HEAP32[(($st$64$0)>>2)];
  var $st$64$1=(($29+4)|0);
  var $30$1=HEAP32[(($st$64$1)>>2)];
  var $$emscripten$temp$2$0=0;
  var $$emscripten$temp$2$1=1048576;
  var $31$0=$30$0 | $$emscripten$temp$2$0;
  var $31$1=$30$1 | $$emscripten$temp$2$1;
  var $st$72$0=(($29)|0);
  HEAP32[(($st$72$0)>>2)]=$31$0;
  var $st$72$1=(($29+4)|0);
  HEAP32[(($st$72$1)>>2)]=$31$1;
  var $32=$3;
  var $33=(($32)|0);
  var $st$78$0=(($33)|0);
  var $34$0=HEAPU32[(($st$78$0)>>2)];
  var $st$78$1=(($33+4)|0);
  var $34$1=HEAPU32[(($st$78$1)>>2)];
  var $35$0=($34$0 << 11) | (0 >>> 21);
  var $35$1=($34$1 << 11) | ($34$0 >>> 21);
  var $st$84$0=(($33)|0);
  HEAP32[(($st$84$0)>>2)]=$35$0;
  var $st$84$1=(($33+4)|0);
  HEAP32[(($st$84$1)>>2)]=$35$1;
  var $36=$3;
  var $37=(($36+8)|0);
  var $38=HEAPU16[(($37)>>1)];
  var $39=(($38)&65535);
  var $40=(($39-1023)|0);
  var $41=(($40+16383)|0);
  var $42=(($41) & 65535);
  var $43=$3;
  var $44=(($43+8)|0);
  HEAP16[(($44)>>1)]=$42;
  ;
  return;
}
_softx87_unpack_raw_fp64["X"]=1;

function _softx87_set_fpu_register_double($ctx, $i, $val) {
  ;
  var __label__;
  __label__ = 1; 
  while(1) switch(__label__) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $sal;
      var $l2b;
      var $sgn;
      $1=$ctx;
      $2=$i;
      $3=$val;
      var $4=$2;
      var $5=(($4)|0) < 0;
      if ($5) { __label__ = 3; break; } else { __label__ = 2; break; }
    case 2: 
      var $7=$2;
      var $8=(($7)|0) > 7;
      if ($8) { __label__ = 3; break; } else { __label__ = 4; break; }
    case 3: 
      __label__ = 10; break;
    case 4: 
      var $11=$3;
      var $12=$11 < 0;
      if ($12) { __label__ = 5; break; } else { __label__ = 6; break; }
    case 5: 
      $sgn=1;
      var $14=$3;
      var $15=(-$14);
      $3=$15;
      __label__ = 7; break;
    case 6: 
      $sgn=0;
      __label__ = 7; break;
    case 7: 
      var $18=$3;
      var $19=$18 == 0;
      if ($19) { __label__ = 8; break; } else { __label__ = 9; break; }
    case 8: 
      var $21=$sgn;
      var $22=(($21) & 255);
      var $23=$2;
      var $24=$1;
      var $25=(($24+4)|0);
      var $26=(($25+36)|0);
      var $27=(($26+$23*12)|0);
      var $28=(($27+10)|0);
      HEAP8[($28)]=$22;
      var $29=$2;
      var $30=$1;
      var $31=(($30+4)|0);
      var $32=(($31+36)|0);
      var $33=(($32+$29*12)|0);
      var $34=(($33+8)|0);
      HEAP16[(($34)>>1)]=0;
      var $35=$2;
      var $36=$1;
      var $37=(($36+4)|0);
      var $38=(($37+36)|0);
      var $39=(($38+$35*12)|0);
      var $40=(($39)|0);
      var $$emscripten$temp$0$0=0;
      var $$emscripten$temp$0$1=0;
      var $st$24$0=(($40)|0);
      HEAP32[(($st$24$0)>>2)]=$$emscripten$temp$0$0;
      var $st$24$1=(($40+4)|0);
      HEAP32[(($st$24$1)>>2)]=$$emscripten$temp$0$1;
      __label__ = 10; break;
    case 9: 
      var $42=$3;
      var $43=_log($42);
      var $44=_log(2);
      var $45=$43/$44;
      var $46=_ceil($45);
      var $47=(($46)|0);
      $l2b=$47;
      var $48=$3;
      var $49=$l2b;
      var $50=((63-$49)|0);
      var $51=(($50)|0);
      var $52=_llvm_pow_f64(2, $51);
      var $53=$48*$52;
      $sal=$53;
      var $54=$l2b;
      var $55=(($54+16383)|0);
      $l2b=$55;
      var $56=$sgn;
      var $57=(($56) & 255);
      var $58=$2;
      var $59=$1;
      var $60=(($59+4)|0);
      var $61=(($60+36)|0);
      var $62=(($61+$58*12)|0);
      var $63=(($62+10)|0);
      HEAP8[($63)]=$57;
      var $64=$l2b;
      var $65=(($64) & 65535);
      var $66=$2;
      var $67=$1;
      var $68=(($67+4)|0);
      var $69=(($68+36)|0);
      var $70=(($69+$66*12)|0);
      var $71=(($70+8)|0);
      HEAP16[(($71)>>1)]=$65;
      var $72=$sal;
      var $73$0 = $72>>>0; var $73$1 = Math.min(Math.floor(($72)/4294967296), 4294967295);
      var $74=$2;
      var $75=$1;
      var $76=(($75+4)|0);
      var $77=(($76+36)|0);
      var $78=(($77+$74*12)|0);
      var $79=(($78)|0);
      var $st$43$0=(($79)|0);
      HEAP32[(($st$43$0)>>2)]=$73$0;
      var $st$43$1=(($79+4)|0);
      HEAP32[(($st$43$1)>>2)]=$73$1;
      __label__ = 10; break;
    case 10: 
      ;
      return;
    default: assert(0, "bad label: " + __label__);
  }
}
_softx87_set_fpu_register_double["X"]=1;

function _softx87_on_fpu_opcode_exec($_ctx86, $_ctx87, $opcode) {
  ;
  var __label__;
  __label__ = 1; 
  while(1) switch(__label__) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $sop;
      var $ctx86;
      var $ctx87;
      var $op2;
      $2=$_ctx86;
      $3=$_ctx87;
      $4=$opcode;
      var $5=$2;
      var $6=$5;
      $ctx86=$6;
      var $7=$3;
      var $8=$7;
      $ctx87=$8;
      var $9=$2;
      var $10=(($9)|0)!=0;
      if ($10) { __label__ = 2; break; } else { __label__ = 3; break; }
    case 2: 
      var $12=$3;
      var $13=(($12)|0)!=0;
      if ($13) { __label__ = 4; break; } else { __label__ = 3; break; }
    case 3: 
      $1=0;
      __label__ = 8; break;
    case 4: 
      var $16=$4;
      var $17=(($16)&255);
      var $18=(($17)|0) < 216;
      if ($18) { __label__ = 6; break; } else { __label__ = 5; break; }
    case 5: 
      var $20=$4;
      var $21=(($20)&255);
      var $22=(($21)|0) > 223;
      if ($22) { __label__ = 6; break; } else { __label__ = 7; break; }
    case 6: 
      $1=0;
      __label__ = 8; break;
    case 7: 
      var $25=$ctx87;
      var $26=(($25+164)|0);
      var $27=HEAP32[(($26)>>2)];
      var $28=$27;
      $sop=$28;
      var $29=$ctx87;
      var $30=(($29+136)|0);
      var $31=(($30+8)|0);
      var $32=HEAP32[(($31)>>2)];
      var $33=$ctx86;
      var $34=FUNCTION_TABLE[$32]($33);
      $op2=$34;
      var $35=$4;
      var $36=(($35)&255);
      var $37=(($36-216)|0);
      var $38=$sop;
      var $39=(($38)|0);
      var $40=(($39+($37<<3))|0);
      var $41=(($40)|0);
      var $42=HEAP32[(($41)>>2)];
      var $43=$op2;
      var $44=$ctx87;
      var $45=FUNCTION_TABLE[$42]($43, $44);
      $1=$45;
      __label__ = 8; break;
    case 8: 
      var $47=$1;
      ;
      return $47;
    default: assert(0, "bad label: " + __label__);
  }
}
_softx87_on_fpu_opcode_exec["X"]=1;

function _softx87_on_fpu_opcode_dec($_ctx86, $_ctx87, $opcode, $buf) {
  ;
  var __label__;
  __label__ = 1; 
  while(1) switch(__label__) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $5;
      var $sop;
      var $ctx86;
      var $ctx87;
      var $op2;
      $2=$_ctx86;
      $3=$_ctx87;
      $4=$opcode;
      $5=$buf;
      var $6=$2;
      var $7=$6;
      $ctx86=$7;
      var $8=$3;
      var $9=$8;
      $ctx87=$9;
      var $10=$2;
      var $11=(($10)|0)!=0;
      if ($11) { __label__ = 2; break; } else { __label__ = 3; break; }
    case 2: 
      var $13=$3;
      var $14=(($13)|0)!=0;
      if ($14) { __label__ = 4; break; } else { __label__ = 3; break; }
    case 3: 
      $1=0;
      __label__ = 8; break;
    case 4: 
      var $17=$4;
      var $18=(($17)&255);
      var $19=(($18)|0) < 216;
      if ($19) { __label__ = 6; break; } else { __label__ = 5; break; }
    case 5: 
      var $21=$4;
      var $22=(($21)&255);
      var $23=(($22)|0) > 223;
      if ($23) { __label__ = 6; break; } else { __label__ = 7; break; }
    case 6: 
      $1=0;
      __label__ = 8; break;
    case 7: 
      var $26=$ctx87;
      var $27=(($26+164)|0);
      var $28=HEAP32[(($27)>>2)];
      var $29=$28;
      $sop=$29;
      var $30=$ctx87;
      var $31=(($30+136)|0);
      var $32=(($31+12)|0);
      var $33=HEAP32[(($32)>>2)];
      var $34=$ctx86;
      var $35=FUNCTION_TABLE[$33]($34);
      $op2=$35;
      var $36=$4;
      var $37=(($36)&255);
      var $38=(($37-216)|0);
      var $39=$sop;
      var $40=(($39)|0);
      var $41=(($40+($38<<3))|0);
      var $42=(($41+4)|0);
      var $43=HEAP32[(($42)>>2)];
      var $44=$op2;
      var $45=$ctx87;
      var $46=$5;
      var $47=FUNCTION_TABLE[$43]($44, $45, $46);
      $1=$47;
      __label__ = 8; break;
    case 8: 
      var $49=$1;
      ;
      return $49;
    default: assert(0, "bad label: " + __label__);
  }
}
_softx87_on_fpu_opcode_dec["X"]=1;

function _softx87_finit_setup($ctx) {
  ;
  var __label__;

  var $1;
  $1=$ctx;
  var $2=$1;
  _softx87_set_fpu_register_double($2, 0, 0);
  var $3=$1;
  _softx87_set_fpu_register_double($3, 1, 0);
  var $4=$1;
  _softx87_set_fpu_register_double($4, 2, 0);
  var $5=$1;
  _softx87_set_fpu_register_double($5, 3, 0);
  var $6=$1;
  _softx87_set_fpu_register_double($6, 4, 0);
  var $7=$1;
  _softx87_set_fpu_register_double($7, 5, 0);
  var $8=$1;
  _softx87_set_fpu_register_double($8, 6, 0);
  var $9=$1;
  _softx87_set_fpu_register_double($9, 7, 0);
  var $10=$1;
  var $11=(($10+4)|0);
  var $12=(($11+2)|0);
  HEAP16[(($12)>>1)]=895;
  var $13=$1;
  var $14=(($13+4)|0);
  var $15=(($14)|0);
  HEAP16[(($15)>>1)]=0;
  var $16=$1;
  var $17=(($16+4)|0);
  var $18=(($17+4)|0);
  HEAP16[(($18)>>1)]=-1;
  var $19=$1;
  var $20=(($19+4)|0);
  var $21=(($20+24)|0);
  var $22=(($21)|0);
  HEAP32[(($22)>>2)]=0;
  var $23=$1;
  var $24=(($23+4)|0);
  var $25=(($24+24)|0);
  var $26=(($25+4)|0);
  HEAP16[(($26)>>1)]=0;
  var $27=$1;
  var $28=(($27+4)|0);
  var $29=(($28+8)|0);
  var $30=(($29)|0);
  HEAP32[(($30)>>2)]=0;
  var $31=$1;
  var $32=(($31+4)|0);
  var $33=(($32+8)|0);
  var $34=(($33+4)|0);
  HEAP16[(($34)>>1)]=0;
  var $35=$1;
  var $36=(($35+4)|0);
  var $37=(($36+32)|0);
  HEAP16[(($37)>>1)]=0;
  ;
  return;
}
_softx87_finit_setup["X"]=1;

function _softx87_reset($ctx) {
  ;
  var __label__;
  __label__ = 1; 
  while(1) switch(__label__) {
    case 1: 
      var $1;
      var $2;
      $2=$ctx;
      var $3=$2;
      var $4=(($3)|0)!=0;
      if ($4) { __label__ = 3; break; } else { __label__ = 2; break; }
    case 2: 
      $1=0;
      __label__ = 4; break;
    case 3: 
      var $7=$2;
      var $8=(($7+168)|0);
      var $9=HEAP32[(($8)>>2)];
      var $10=(($9)|0) <= 0;
      var $11=$10 ? 1 : 0;
      var $12=(($11) & 255);
      var $13=$2;
      var $14=(($13+160)|0);
      var $15=(($14)|0);
      HEAP8[($15)]=$12;
      var $16=$2;
      var $17=(($16+164)|0);
      HEAP32[(($17)>>2)]=_optab8087;
      var $18=$2;
      _softx87_finit_setup($18);
      $1=1;
      __label__ = 4; break;
    case 4: 
      var $20=$1;
      ;
      return $20;
    default: assert(0, "bad label: " + __label__);
  }
}


function _softx87_init($ctx, $level) {
  ;
  var __label__;
  __label__ = 1; 
  while(1) switch(__label__) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $ret;
      $2=$ctx;
      $3=$level;
      $ret=1;
      var $4=$2;
      var $5=(($4)|0)!=0;
      if ($5) { __label__ = 3; break; } else { __label__ = 2; break; }
    case 2: 
      $1=0;
      __label__ = 12; break;
    case 3: 
      var $8=$3;
      var $9=(($8)|0) > 1;
      if ($9) { __label__ = 4; break; } else { __label__ = 5; break; }
    case 4: 
      $1=0;
      __label__ = 12; break;
    case 5: 
      var $12=$3;
      var $13=(($12)|0) < 0;
      if ($13) { __label__ = 6; break; } else { __label__ = 7; break; }
    case 6: 
      $1=0;
      __label__ = 12; break;
    case 7: 
      var $16=$3;
      var $17=(($16)|0) > 0;
      if ($17) { __label__ = 8; break; } else { __label__ = 9; break; }
    case 8: 
      $ret=2;
      __label__ = 9; break;
    case 9: 
      var $20=$3;
      var $21=$2;
      var $22=(($21+168)|0);
      HEAP32[(($22)>>2)]=$20;
      var $23=$2;
      var $24=_softx87_reset($23);
      var $25=(($24)|0)!=0;
      if ($25) { __label__ = 11; break; } else { __label__ = 10; break; }
    case 10: 
      $1=0;
      __label__ = 12; break;
    case 11: 
      var $28=$2;
      var $29=(($28)|0);
      HEAP8[($29)]=0;
      var $30=$2;
      var $31=(($30+1)|0);
      HEAP8[($31)]=0;
      var $32=$2;
      var $33=(($32+2)|0);
      HEAP16[(($33)>>1)]=29;
      var $34=$2;
      var $35=(($34+136)|0);
      var $36=(($35)|0);
      HEAP32[(($36)>>2)]=14;
      var $37=$2;
      var $38=(($37+136)|0);
      var $39=(($38+4)|0);
      HEAP32[(($39)>>2)]=16;
      var $40=$2;
      var $41=(($40+136)|0);
      var $42=(($41+8)|0);
      HEAP32[(($42)>>2)]=18;
      var $43=$2;
      var $44=(($43+136)|0);
      var $45=(($44+12)|0);
      HEAP32[(($45)>>2)]=20;
      var $46=$2;
      var $47=(($46+136)|0);
      var $48=(($47+16)|0);
      HEAP32[(($48)>>2)]=22;
      var $49=$2;
      var $50=(($49+136)|0);
      var $51=(($50+20)|0);
      HEAP32[(($51)>>2)]=24;
      var $52=$ret;
      $1=$52;
      __label__ = 12; break;
    case 12: 
      var $54=$1;
      ;
      return $54;
    default: assert(0, "bad label: " + __label__);
  }
}
_softx87_init["X"]=1;

function _softx87_step_def_on_read_memory($_ctx, $address, $buf, $size) {
  ;
  var __label__;
  __label__ = 1; 
  while(1) switch(__label__) {
    case 1: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $ctx;
      $1=$_ctx;
      $2=$address;
      $3=$buf;
      $4=$size;
      var $5=$1;
      var $6=$5;
      $ctx=$6;
      var $7=$ctx;
      var $8=(($7)|0)!=0;
      if ($8) { __label__ = 2; break; } else { __label__ = 4; break; }
    case 2: 
      var $10=$3;
      var $11=(($10)|0)!=0;
      if ($11) { __label__ = 3; break; } else { __label__ = 4; break; }
    case 3: 
      var $13=$4;
      var $14=(($13)|0) < 1;
      if ($14) { __label__ = 4; break; } else { __label__ = 5; break; }
    case 4: 
      __label__ = 6; break;
    case 5: 
      var $17=$3;
      var $18=$4;
      _memset($17, -1, $18, 1);
      __label__ = 6; break;
    case 6: 
      ;
      return;
    default: assert(0, "bad label: " + __label__);
  }
}


  
  function _memcpy(dest, src, num, align) {
      assert(num % 1 === 0, 'memcpy given ' + num + ' bytes to copy. Problem with quantum=1 corrections perhaps?');
      if (num >= 20 && src % 2 == dest % 2) {
        // This is unaligned, but quite large, and potentially alignable, so work hard to get to aligned settings
        if (src % 4 == dest % 4) {
          var stop = src + num;
          while (src % 4) { // no need to check for stop, since we have large num
            HEAP8[dest++] = HEAP8[src++];
          }
          var src4 = src >> 2, dest4 = dest >> 2, stop4 = stop >> 2;
          while (src4 < stop4) {
            HEAP32[dest4++] = HEAP32[src4++];
          }
          src = src4 << 2;
          dest = dest4 << 2;
          while (src < stop) {
            HEAP8[dest++] = HEAP8[src++];
          }
        } else {
          var stop = src + num;
          if (src % 2) { // no need to check for stop, since we have large num
            HEAP8[dest++] = HEAP8[src++];
          }
          var src2 = src >> 1, dest2 = dest >> 1, stop2 = stop >> 1;
          while (src2 < stop2) {
            HEAP16[dest2++] = HEAP16[src2++];
          }
          src = src2 << 1;
          dest = dest2 << 1;
          if (src < stop) {
            HEAP8[dest++] = HEAP8[src++];
          }
        }
      } else {
        while (num--) {
          HEAP8[dest++] = HEAP8[src++];
        }
      }
    }var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;

  
  
  function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = (tempDoubleI32[0]=HEAP32[((varargs+argIndex)>>2)],tempDoubleI32[1]=HEAP32[((varargs+argIndex+4)>>2)],tempDoubleF64[0]);
        } else if (type == 'i64') {
          ret = [HEAP32[((varargs+argIndex)>>2)],
                 HEAP32[((varargs+argIndex+4)>>2)]];
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[((varargs+argIndex)>>2)];
        }
        argIndex += Runtime.getNativeFieldSize(type);
        return ret;
      }
  
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[(textIndex+1)];
        if (curr == '%'.charCodeAt(0)) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          flagsLoop: while (1) {
            switch (next) {
              case '+'.charCodeAt(0):
                flagAlwaysSigned = true;
                break;
              case '-'.charCodeAt(0):
                flagLeftAlign = true;
                break;
              case '#'.charCodeAt(0):
                flagAlternative = true;
                break;
              case '0'.charCodeAt(0):
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[(textIndex+1)];
          }
  
          // Handle width.
          var width = 0;
          if (next == '*'.charCodeAt(0)) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[(textIndex+1)];
          } else {
            while (next >= '0'.charCodeAt(0) && next <= '9'.charCodeAt(0)) {
              width = width * 10 + (next - '0'.charCodeAt(0));
              textIndex++;
              next = HEAP8[(textIndex+1)];
            }
          }
  
          // Handle precision.
          var precisionSet = false;
          if (next == '.'.charCodeAt(0)) {
            var precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[(textIndex+1)];
            if (next == '*'.charCodeAt(0)) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[(textIndex+1)];
                if (precisionChr < '0'.charCodeAt(0) ||
                    precisionChr > '9'.charCodeAt(0)) break;
                precision = precision * 10 + (precisionChr - '0'.charCodeAt(0));
                textIndex++;
              }
            }
            next = HEAP8[(textIndex+1)];
          } else {
            var precision = 6; // Standard default.
          }
  
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[(textIndex+2)];
              if (nextNext == 'h'.charCodeAt(0)) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[(textIndex+2)];
              if (nextNext == 'l'.charCodeAt(0)) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[(textIndex+1)];
  
          // Handle type specifier.
          if (['d', 'i', 'u', 'o', 'x', 'X', 'p'].indexOf(String.fromCharCode(next)) != -1) {
            // Integer.
            var signed = next == 'd'.charCodeAt(0) || next == 'i'.charCodeAt(0);
            argSize = argSize || 4;
            var currArg = getNextArg('i' + (argSize * 8));
            // Flatten i64-1 [low, high] into a (slightly rounded) double
            if (argSize == 8) {
              currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 'u'.charCodeAt(0));
            }
            // Truncate to requested size.
            if (argSize <= 4) {
              var limit = Math.pow(256, argSize) - 1;
              currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
            }
            // Format the number.
            var currAbsArg = Math.abs(currArg);
            var argText;
            var prefix = '';
            if (next == 'd'.charCodeAt(0) || next == 'i'.charCodeAt(0)) {
              argText = reSign(currArg, 8 * argSize, 1).toString(10);
            } else if (next == 'u'.charCodeAt(0)) {
              argText = unSign(currArg, 8 * argSize, 1).toString(10);
              currArg = Math.abs(currArg);
            } else if (next == 'o'.charCodeAt(0)) {
              argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
            } else if (next == 'x'.charCodeAt(0) || next == 'X'.charCodeAt(0)) {
              prefix = flagAlternative ? '0x' : '';
              if (currArg < 0) {
                // Represent negative numbers in hex as 2's complement.
                currArg = -currArg;
                argText = (currAbsArg - 1).toString(16);
                var buffer = [];
                for (var i = 0; i < argText.length; i++) {
                  buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                }
                argText = buffer.join('');
                while (argText.length < argSize * 2) argText = 'f' + argText;
              } else {
                argText = currAbsArg.toString(16);
              }
              if (next == 'X'.charCodeAt(0)) {
                prefix = prefix.toUpperCase();
                argText = argText.toUpperCase();
              }
            } else if (next == 'p'.charCodeAt(0)) {
              if (currAbsArg === 0) {
                argText = '(nil)';
              } else {
                prefix = '0x';
                argText = currAbsArg.toString(16);
              }
            }
            if (precisionSet) {
              while (argText.length < precision) {
                argText = '0' + argText;
              }
            }
  
            // Add sign if needed
            if (flagAlwaysSigned) {
              if (currArg < 0) {
                prefix = '-' + prefix;
              } else {
                prefix = '+' + prefix;
              }
            }
  
            // Add padding.
            while (prefix.length + argText.length < width) {
              if (flagLeftAlign) {
                argText += ' ';
              } else {
                if (flagZeroPad) {
                  argText = '0' + argText;
                } else {
                  prefix = ' ' + prefix;
                }
              }
            }
  
            // Insert the result into the buffer.
            argText = prefix + argText;
            argText.split('').forEach(function(chr) {
              ret.push(chr.charCodeAt(0));
            });
          } else if (['f', 'F', 'e', 'E', 'g', 'G'].indexOf(String.fromCharCode(next)) != -1) {
            // Float.
            var currArg = getNextArg('double');
            var argText;
  
            if (isNaN(currArg)) {
              argText = 'nan';
              flagZeroPad = false;
            } else if (!isFinite(currArg)) {
              argText = (currArg < 0 ? '-' : '') + 'inf';
              flagZeroPad = false;
            } else {
              var isGeneral = false;
              var effectivePrecision = Math.min(precision, 20);
  
              // Convert g/G to f/F or e/E, as per:
              // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
              if (next == 'g'.charCodeAt(0) || next == 'G'.charCodeAt(0)) {
                isGeneral = true;
                precision = precision || 1;
                var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                if (precision > exponent && exponent >= -4) {
                  next = ((next == 'g'.charCodeAt(0)) ? 'f' : 'F').charCodeAt(0);
                  precision -= exponent + 1;
                } else {
                  next = ((next == 'g'.charCodeAt(0)) ? 'e' : 'E').charCodeAt(0);
                  precision--;
                }
                effectivePrecision = Math.min(precision, 20);
              }
  
              if (next == 'e'.charCodeAt(0) || next == 'E'.charCodeAt(0)) {
                argText = currArg.toExponential(effectivePrecision);
                // Make sure the exponent has at least 2 digits.
                if (/[eE][-+]\d$/.test(argText)) {
                  argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                }
              } else if (next == 'f'.charCodeAt(0) || next == 'F'.charCodeAt(0)) {
                argText = currArg.toFixed(effectivePrecision);
              }
  
              var parts = argText.split('e');
              if (isGeneral && !flagAlternative) {
                // Discard trailing zeros and periods.
                while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                       (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                  parts[0] = parts[0].slice(0, -1);
                }
              } else {
                // Make sure we have a period in alternative mode.
                if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                // Zero pad until required precision.
                while (precision > effectivePrecision++) parts[0] += '0';
              }
              argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
  
              // Capitalize 'E' if needed.
              if (next == 'E'.charCodeAt(0)) argText = argText.toUpperCase();
  
              // Add sign.
              if (flagAlwaysSigned && currArg >= 0) {
                argText = '+' + argText;
              }
            }
  
            // Add padding.
            while (argText.length < width) {
              if (flagLeftAlign) {
                argText += ' ';
              } else {
                if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                  argText = argText[0] + '0' + argText.slice(1);
                } else {
                  argText = (flagZeroPad ? '0' : ' ') + argText;
                }
              }
            }
  
            // Adjust case.
            if (next < 'a'.charCodeAt(0)) argText = argText.toUpperCase();
  
            // Insert the result into the buffer.
            argText.split('').forEach(function(chr) {
              ret.push(chr.charCodeAt(0));
            });
          } else if (next == 's'.charCodeAt(0)) {
            // String.
            var arg = getNextArg('i8*');
            var copiedString;
            if (arg) {
              copiedString = String_copy(arg);
              if (precisionSet && copiedString.length > precision) {
                copiedString = copiedString.slice(0, precision);
              }
            } else {
              copiedString = intArrayFromString('(null)', true);
            }
            if (!flagLeftAlign) {
              while (copiedString.length < width--) {
                ret.push(' '.charCodeAt(0));
              }
            }
            ret = ret.concat(copiedString);
            if (flagLeftAlign) {
              while (copiedString.length < width--) {
                ret.push(' '.charCodeAt(0));
              }
            }
          } else if (next == 'c'.charCodeAt(0)) {
            // Character.
            if (flagLeftAlign) ret.push(getNextArg('i8'));
            while (--width > 0) {
              ret.push(' '.charCodeAt(0));
            }
            if (!flagLeftAlign) ret.push(getNextArg('i8'));
          } else if (next == 'n'.charCodeAt(0)) {
            // Write the length written so far to the next parameter.
            var ptr = getNextArg('i32*');
            HEAP32[((ptr)>>2)]=ret.length
          } else if (next == '%'.charCodeAt(0)) {
            // Literal percent sign.
            ret.push(curr);
          } else {
            // Unknown specifiers remain untouched.
            for (var i = startTextIndex; i < textIndex + 2; i++) {
              ret.push(HEAP8[(i)]);
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _snprintf(s, n, format, varargs) {
      // int snprintf(char *restrict s, size_t n, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var limit = (n === undefined) ? result.length
                                    : Math.min(result.length, n - 1);
      for (var i = 0; i < limit; i++) {
        HEAP8[(s+i)]=result[i];
      }
      HEAP8[(s+i)]=0;
      return result.length;
    }function _sprintf(s, format, varargs) {
      // int sprintf(char *restrict s, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      return _snprintf(s, undefined, format, varargs);
    }

  function _strcpy(pdest, psrc) {
      var i = 0;
      do {
        HEAP8[(pdest+i)]=HEAP8[(psrc+i)];
        i ++;
      } while (HEAP8[(psrc+i-1)] != 0);
      return pdest;
    }

  var _llvm_pow_f64=Math.pow;

  var _ceil=Math.ceil;

  var _log=Math.log;

  
  function _memset(ptr, value, num, align) {
      // TODO: make these settings, and in memcpy, {{'s
      if (num >= 20) {
        // This is unaligned, but quite large, so work hard to get to aligned settings
        var stop = ptr + num;
        while (ptr % 4) { // no need to check for stop, since we have large num
          HEAP8[ptr++] = value;
        }
        if (value < 0) value += 256; // make it unsigned
        var ptr4 = ptr >> 2, stop4 = stop >> 2, value4 = value | (value << 8) | (value << 16) | (value << 24);
        while (ptr4 < stop4) {
          HEAP32[ptr4++] = value4;
        }
        ptr = ptr4 << 2;
        while (ptr < stop) {
          HEAP8[ptr++] = value;
        }
      } else {
        while (num--) {
          HEAP8[ptr++] = value;
        }
      }
    }var _llvm_memset_p0i8_i32=_memset;



  function _malloc(bytes) {
      /* Over-allocate to make sure it is byte-aligned by 8.
       * This will leak memory, but this is only the dummy
       * implementation (replaced by dlmalloc normally) so
       * not an issue.
       */
      ptr = Runtime.staticAlloc(bytes + 8);
      return (ptr+8) & 0xFFFFFFF8;
    }
  Module["_malloc"] = _malloc;

  function _free(){}
  Module["_free"] = _free;

// === Auto-generated postamble setup entry stuff ===

Module.callMain = function callMain(args) {
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_STATIC) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_STATIC));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_STATIC);

  return _main(argc, argv, 0);
}


var _optab8087;
var _s87op1_tmp;
var _s87op2_tmp;















_optab8087=allocate([26, 0, 0, 0, 28, 0, 0, 0, 30, 0, 0, 0, 32, 0, 0, 0, 34, 0, 0, 0, 36, 0, 0, 0, 38, 0, 0, 0, 40, 0, 0, 0, 42, 0, 0, 0, 44, 0, 0, 0, 46, 0, 0, 0, 48, 0, 0, 0, 50, 0, 0, 0, 52, 0, 0, 0, 54, 0, 0, 0, 56, 0, 0, 0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_STATIC);
_s87op1_tmp=allocate(32, "i8", ALLOC_STATIC);
_s87op2_tmp=allocate(32, "i8", ALLOC_STATIC);
STRING_TABLE.__str=allocate([70,65,68,68,80,32,83,84,40,37,100,41,44,83,84,40,48,41,0] /* FADDP ST(%d),ST(0)\0 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str1=allocate([70,73,65,68,68,32,37,115,32,40,109,101,109,49,54,41,0] /* FIADD %s (mem16)\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str2=allocate([70,76,68,32,37,115,32,40,109,101,109,54,52,41,0] /* FLD %s (mem64)\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str3=allocate([70,70,82,69,69,32,83,84,40,37,100,41,0] /* FFREE ST(%d)\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str4=allocate([70,65,68,68,32,83,84,40,37,100,41,44,83,84,40,48,41,0] /* FADD ST(%d),ST(0)\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str5=allocate([70,65,68,68,32,37,115,32,40,109,101,109,54,52,41,0] /* FADD %s (mem64)\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str6=allocate([70,73,78,73,84,0] /* FINIT\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str7=allocate([70,73,65,68,68,32,37,115,32,40,109,101,109,51,50,41,0] /* FIADD %s (mem32)\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str8=allocate([70,73,78,67,83,84,80,0] /* FINCSTP\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str9=allocate([70,68,69,67,83,84,80,0] /* FDECSTP\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str10=allocate([70,78,79,80,0] /* FNOP\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str11=allocate([70,76,68,32,83,84,40,37,100,41,0] /* FLD ST(%d)\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str12=allocate([70,76,68,32,37,115,32,40,109,101,109,51,50,41,0] /* FLD %s (mem32)\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str13=allocate([70,65,68,68,32,83,84,40,48,41,44,83,84,40,37,100,41,0] /* FADD ST(0),ST(%d)\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str14=allocate([70,65,68,68,32,37,115,32,40,109,101,109,51,50,41,0] /* FADD %s (mem32)\00 */, "i8", ALLOC_STATIC);
FUNCTION_TABLE = [0,0,_op_fadd32,0,_op_fld32,0,_op_fiadd32,0,_op_fadd64,0,_op_fld64,0,_op_fiadd16,0,_softx87_step_def_on_read_memory,0,_softx87_step_def_on_write_memory,0,_softx87_def_on_softx86_fetch_exec_byte,0,_softx87_def_on_softx86_fetch_dec_byte,0,_softx87_on_sx86_exec_full_modrmonly_memx,0,_softx87_on_sx86_dec_full_modrmonly,0,_Sfx86OpcodeExec_group_D8,0,_Sfx86OpcodeDec_group_D8,0,_Sfx86OpcodeExec_group_D9,0,_Sfx86OpcodeDec_group_D9,0,_Sfx86OpcodeExec_group_DA,0,_Sfx86OpcodeDec_group_DA,0,_Sfx86OpcodeExec_group_DB,0,_Sfx86OpcodeDec_group_DB,0,_Sfx86OpcodeExec_group_DC,0,_Sfx86OpcodeDec_group_DC,0,_Sfx86OpcodeExec_group_DD,0,_Sfx86OpcodeDec_group_DD,0,_Sfx86OpcodeExec_group_DE,0,_Sfx86OpcodeDec_group_DE,0,_Sfx86OpcodeExec_group_DF,0,_Sfx86OpcodeDec_group_DF,0]; Module["FUNCTION_TABLE"] = FUNCTION_TABLE;


function run(args) {
  args = args || Module['arguments'];

  initRuntime();

  var ret = null;
  if (Module['_main']) {
    ret = Module.callMain(args);
    if (!Module['noExitRuntime']) {
      exitRuntime();
    }
  }
  return ret;
}
Module['run'] = run;

// {{PRE_RUN_ADDITIONS}}

if (Module['preRun']) {
  Module['preRun']();
}


if (runDependencies == 0) {
  var ret = run();
}

// {{POST_RUN_ADDITIONS}}

if (Module['postRun']) {
  Module['postRun']();
}





  // {{MODULE_ADDITIONS}}


// EMSCRIPTEN_GENERATED_FUNCTIONS: ["_softx86_popstack","_op_fld32","_op_fld64","_op_fiadd16","_op_fadd","_op_fiadd32","_op_fadd32","_op_fadd64","_Sfx86OpcodeExec_group_D8","_Sfx86OpcodeDec_group_D8","_Sfx86OpcodeExec_group_D9","_Sfx86OpcodeDec_group_D9","_Sfx86OpcodeExec_group_DA","_Sfx86OpcodeDec_group_DA","_Sfx86OpcodeExec_group_DF","_Sfx86OpcodeDec_group_DF","_softx87_normalize","_Sfx86OpcodeExec_group_DB","_Sfx86OpcodeDec_group_DB","_Sfx86OpcodeExec_group_DC","_Sfx86OpcodeDec_group_DC","_Sfx86OpcodeExec_group_DD","_Sfx86OpcodeDec_group_DD","_Sfx86OpcodeExec_group_DE","_Sfx86OpcodeDec_group_DE","_softx87_get_fpu_register_double","_softx87_def_on_softx86_fetch_exec_byte","_softx87_def_on_softx86_fetch_dec_byte","_softx87_on_sx86_exec_full_modrmonly_memx","_softx87_on_sx86_dec_full_modrmonly","_softx87_getversion","_softx87_free","_softx87_step_def_on_write_memory","_softx87_setbug","_softx87_unpack_raw_int16","_softx87_unpack_raw_int32","_softx87_unpack_raw_fp32","_softx87_unpack_raw_fp64","_softx87_set_fpu_register_double","_softx87_on_fpu_opcode_exec","_softx87_on_fpu_opcode_dec","_softx87_finit_setup","_softx87_reset","_softx87_init","_softx87_step_def_on_read_memory"]

