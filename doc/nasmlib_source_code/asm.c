/* ----------------------------------------------------------------------- *
 *
 *   Copyright 1996-2012 The NASM Authors - All Rights Reserved
 *   See the file AUTHORS included with the NASM distribution for
 *   the specific copyright holders.
 *
 *   Redistribution and use in source and binary forms, with or without
 *   modification, are permitted provided that the following
 *   conditions are met:
 *
 *   * Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 *   * Redistributions in binary form must reproduce the above
 *     copyright notice, this list of conditions and the following
 *     disclaimer in the documentation and/or other materials provided
 *     with the distribution.
 *
 *     THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND
 *     CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
 *     INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 *     MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 *     DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
 *     CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 *     SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *     NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 *     LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 *     HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 *     CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
 *     OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
 *     EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ----------------------------------------------------------------------- */

/*
 * The Netwide Assembler main program module
 */

#include "compiler.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <inttypes.h>
#include <limits.h>

#include "nasm.h"
#include "nasmlib.h"
#include "stdscan.h"
#include "insns.h"
#include "parser.h"
#include "assemble.h"


/* Gratuitous fluff added just to please the linker */
#define MAX_OPTIMIZE (INT_MAX >> 1)

struct ofmt *ofmt = NULL;
struct ofmt_alias *ofmt_alias = NULL;
const struct dfmt *dfmt;

static FILE *error_file;        /* Where to write error messages */

FILE *ofile = NULL;
int optimizing = MAX_OPTIMIZE; /* number of optimization passes to take */
static int sb, cmd_sb = 16;    /* by default */
static uint32_t cmd_cpu = IF_PLEVEL;       /* highest level by default */
static uint32_t cpu = IF_PLEVEL;   /* passed to insn_size & assemble.c */
int64_t global_offset_changed;      /* referenced in labels.c */
int64_t prev_offset_changed;
int32_t stall_count;

static struct location location;
int in_abs_seg;                 /* Flag we are in ABSOLUTE seg */
int32_t abs_seg;                   /* ABSOLUTE segment basis */
int32_t abs_offset;                /* ABSOLUTE offset */

static struct RAA *offsets;

static struct SAA *forwrefs;    /* keep track of forward references */
static const struct forwrefinfo *forwref;

static struct preproc_ops *preproc;


static int using_debug_info, opt_verbose_info;
bool tasm_compatible_mode = false;
int pass0, passn;
int maxbits = 0;
int globalrel = 0;
int user_nolist = 0;
/* End gratuitous fluff */


static struct ofmt out;
static char* output_buffer;
static char* output_buffer_curr_offset;
static int64_t output_buffer_size;


static void output(int32_t segto, const void *data, enum out_type type, uint64_t size, int32_t segment, int32_t wrt)
{
    char* incoming;
    incoming = (char*)data;
    memcpy(output_buffer_curr_offset, incoming, size);
    output_buffer_curr_offset += size;
}

static int32_t segbase(int32_t segment)
{
    return segment;
}

static void output_buffer_init()
{
    output_buffer = malloc(output_buffer_size);
    output_buffer_curr_offset = output_buffer;
}

/* Assembles the given instruction into a 32 bit Intel machine code */
int64_t assemble_instruction(char* mnemonic, char** output)
{
    int bits;
    uint32_t cpu;
    insn parsed_instruction;

    out.output = output;
    out.segbase = segbase;

    tolower_init();

    parse_line(mnemonic, &parsed_instruction);

    cpu = IF_PLEVEL;
    bits = 32;
    output_buffer_size = insn_size(bits, cpu, &parsed_instruction, nasm_error);        
    output_buffer_init();

    assemble(bits, cpu, &parsed_instruction, &out, nasm_error);

    cleanup_insn(&parsed_instruction);

    *output = output_buffer;

    /* TODO : RETURN -1 in case of error */
    return output_buffer_size;
}
