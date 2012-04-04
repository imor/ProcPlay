/*
 * optable.c
 *
 * Copyright (C) 2003 Jonathan Campbell <jcampbell@mdjk.com>
 *
 * Opcode jumptable.
 *
 * Allows the recognition of many opcodes without having to write approximately
 * 500+ if...then...else statements which is a) inefficient and b) apparently can
 * cause some compilers such as Microsoft C++ to crash during the compile stage with
 * an error. Since it's a table, it can be referred to via a pointer that can be easily
 * redirected to other opcode tables (i.e., one for the 8086, one for the 80286, etc.)
 * without much hassle.
 * 
 * The table contains two pointers: one for an "execute" function, and one for a
 * "decompile" function. The execute function is given the context and the initial opcode.
 * If more opcodes are needed the function calls softx86_fetch_exec_byte(). The decode
 * function is also given the opcode but also a char[] array where it is expected to
 * sprintf() or strcpy() the disassembled output. If that function needs more opcodes
 * it calls softx86_fetch_dec_byte().
 *
 ***********************************************************************************
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.
 ************************************************************************************/

#include <softx87.h>
#include <string.h>
#include <stdlib.h>
#include <stdio.h>
#include "optab87.h"

void op_fadd(softx87_ctx* ctx,softx87_reg80 *dst,softx87_reg80 *src);

char				s87op1_tmp[32];
char				s87op2_tmp[32];

/* pops value from FPU stack */
void softx86_popstack(softx87_ctx* ctx87)
{
	int TOP;

	TOP = SX87_FPUSTAT_TOP(ctx87->state.status_word);
	SX87_FPUTAGW_TAG_SET(ctx87->state.tag_word,TOP,SX87_FPUTAGVAL_EMPTY);
	TOP = (TOP+1)&7;
	SX87_FPUSTAT_TOP_SET(ctx87->state.status_word,TOP);
}

/* the hard work behind FLD [mem32] is here */
void op_fld32(softx86_ctx* ctx,char *datz,int sz)
{
	softx87_reg80 tmp;
	softx87_ctx* ctx87;
	int TOP;

/* sanity check */
	ctx87 = (softx87_ctx*)ctx->ref_softx87_ctx;
	if (sz != 4 || !ctx87) return;

/* convert to 80-bit floating point */
	softx87_unpack_raw_fp32(ctx87,datz,&tmp);
/* normalize */
	softx87_normalize(ctx87,&tmp);

	TOP = SX87_FPUSTAT_TOP(ctx87->state.status_word);
/* set C1 if stack overflow */
	if (SX87_FPUTAGW_TAG(ctx87->state.tag_word,TOP) != SX87_FPUTAGVAL_EMPTY)
		ctx87->state.status_word |=  SX87_FPUSTAT_C1;
	else
		ctx87->state.status_word &= ~SX87_FPUSTAT_C1;
/* decrement TOP, tag as valid */
	TOP = (TOP-1)&7;
	SX87_FPUSTAT_TOP_SET(ctx87->state.status_word,TOP);
	SX87_FPUTAGW_TAG_SET(ctx87->state.tag_word,TOP,SX87_FPUTAGVAL_VALID);
/* store */
	ctx87->state.st[TOP].exponent =	tmp.exponent;
	ctx87->state.st[TOP].mantissa =	tmp.mantissa;
	ctx87->state.st[TOP].sign_bit =	tmp.sign_bit;
}

/* the hard work behind FLD [mem64] is here */
void op_fld64(softx86_ctx* ctx,char *datz,int sz)
{
	softx87_reg80 tmp;
	softx87_ctx* ctx87;
	int TOP;

/* sanity check */
	ctx87 = (softx87_ctx*)ctx->ref_softx87_ctx;
	if (sz != 8 || !ctx87) return;

/* convert to 80-bit floating point */
	softx87_unpack_raw_fp64(ctx87,datz,&tmp);
/* normalize */
	softx87_normalize(ctx87,&tmp);

	TOP = SX87_FPUSTAT_TOP(ctx87->state.status_word);
/* set C1 if stack overflow */
	if (SX87_FPUTAGW_TAG(ctx87->state.tag_word,TOP) != SX87_FPUTAGVAL_EMPTY)
		ctx87->state.status_word |=  SX87_FPUSTAT_C1;
	else
		ctx87->state.status_word &= ~SX87_FPUSTAT_C1;
/* decrement TOP, tag as valid */
	TOP = (TOP-1)&7;
	SX87_FPUSTAT_TOP_SET(ctx87->state.status_word,TOP);
	SX87_FPUTAGW_TAG_SET(ctx87->state.tag_word,TOP,SX87_FPUTAGVAL_VALID);
/* store */
	ctx87->state.st[TOP].exponent =	tmp.exponent;
	ctx87->state.st[TOP].mantissa =	tmp.mantissa;
	ctx87->state.st[TOP].sign_bit =	tmp.sign_bit;
}

/* FIADD [mem16] */
void op_fiadd16(softx86_ctx* ctx,char *datz,int sz)
{
	softx87_reg80 tmp;
	softx87_ctx* ctx87;
	int TOP;

/* sanity check */
	ctx87 = (softx87_ctx*)ctx->ref_softx87_ctx;
	if (sz != 2 || !ctx87) return;

/* convert to 80-bit floating point */
	softx87_unpack_raw_int16(ctx87,datz,&tmp);
/* normalize */
	softx87_normalize(ctx87,&tmp);

/* do it */
	TOP = SX87_FPUSTAT_TOP(ctx87->state.status_word);
	op_fadd(ctx87,&ctx87->state.st[TOP],&tmp);
}

/* FIADD [mem32] */
void op_fiadd32(softx86_ctx* ctx,char *datz,int sz)
{
	softx87_reg80 tmp;
	softx87_ctx* ctx87;
	int TOP;

/* sanity check */
	ctx87 = (softx87_ctx*)ctx->ref_softx87_ctx;
	if (sz != 4 || !ctx87) return;

/* convert to 80-bit floating point */
	softx87_unpack_raw_int32(ctx87,datz,&tmp);
/* normalize */
	softx87_normalize(ctx87,&tmp);

/* do it */
	TOP = SX87_FPUSTAT_TOP(ctx87->state.status_word);
	op_fadd(ctx87,&ctx87->state.st[TOP],&tmp);
}

/* FADD [mem32] */
void op_fadd32(softx86_ctx* ctx,char *datz,int sz)
{
	softx87_reg80 tmp;
	softx87_ctx* ctx87;
	int TOP;

/* sanity check */
	ctx87 = (softx87_ctx*)ctx->ref_softx87_ctx;
	if (sz != 4 || !ctx87) return;

/* convert to 80-bit floating point */
	softx87_unpack_raw_fp32(ctx87,datz,&tmp);
/* normalize */
	softx87_normalize(ctx87,&tmp);

/* do it */
	TOP = SX87_FPUSTAT_TOP(ctx87->state.status_word);
	op_fadd(ctx87,&ctx87->state.st[TOP],&tmp);
}

/* FADD [mem64] */
void op_fadd64(softx86_ctx* ctx,char *datz,int sz)
{
	softx87_reg80 tmp;
	softx87_ctx* ctx87;
	int TOP;

/* sanity check */
	ctx87 = (softx87_ctx*)ctx->ref_softx87_ctx;
	if (sz != 8 || !ctx87) return;

/* convert to 80-bit floating point */
	softx87_unpack_raw_fp64(ctx87,datz,&tmp);
/* normalize */
	softx87_normalize(ctx87,&tmp);

/* do it */
	TOP = SX87_FPUSTAT_TOP(ctx87->state.status_word);
	op_fadd(ctx87,&ctx87->state.st[TOP],&tmp);
}

/* general purpose FADD */
void op_fadd(softx87_ctx* ctx,softx87_reg80 *dst,softx87_reg80 *src)
{
	softx87_reg80 major;
	softx87_reg80 minor;
	sx87_uldword waste,threshhold;
	int exb;
/* TODO: check and perform cases as documented:

-infinity + (anything) =	-infinity
-infinity + +infinity  =        #IA exception
NaN       + (anything) =        NaN
*/

/* in doing this... how many extra bits will we need? */
	exb   = (int)(src->mantissa>>((sx87_uldword)63));
	exb  += (int)(dst->mantissa>>((sx87_uldword)63));
	exb >>= 1;
	if (src->sign_bit != dst->sign_bit) exb++;
/* avoid addition if it wouldn't make any difference */
	if (dst->exponent >= (src->exponent+(64-exb)))
		return;
/* copy src => dst if the destination value is dwarfed by the source value */
	else if (dst->exponent <= (src->exponent-(64-exb))) {
		memcpy(dst,src,sizeof(softx87_reg80));
		return;
	}

/* scale them up so their exponents match */
	if (dst->exponent > src->exponent) {
		memcpy(&major,dst,sizeof(softx87_reg80));
		memcpy(&minor,src,sizeof(softx87_reg80));
	}
	else if (dst->exponent < src->exponent) {
		memcpy(&major,src,sizeof(softx87_reg80));
		memcpy(&minor,dst,sizeof(softx87_reg80));
	}
	else {
		memcpy(&major,dst,sizeof(softx87_reg80));
		memcpy(&minor,src,sizeof(softx87_reg80));
	}

/* "major" should have the highest exponent */
	if ((major.exponent+exb) > minor.exponent) {
		int b;

		b = (major.exponent - minor.exponent)+exb;
		threshhold   = (sx87_uldword)-1;
		threshhold >>= (sx87_uldword)(64-b);
		waste        = minor.mantissa & threshhold;
		threshhold   = (threshhold>>1)+1;

/* scale up the minor value */
		minor.exponent  += b;
		minor.mantissa >>= (sx87_uldword)b;
/* round it */
		if (		SX87_FPUCTRLW_RNDCTL(ctx->state.control_word) ==
				SX87_FPUCTRLW_RNDCTL_NEAREST) {
			if (waste >= threshhold) minor.mantissa++;
		}
		else if (	SX87_FPUCTRLW_RNDCTL(ctx->state.control_word) ==
				SX87_FPUCTRLW_RNDCTL_DOWNINF) {
			if (waste != 0L && minor.sign_bit) minor.mantissa++;
		}
		else if (	SX87_FPUCTRLW_RNDCTL(ctx->state.control_word) ==
				SX87_FPUCTRLW_RNDCTL_UPINF) {
			if (waste != 0L && !minor.sign_bit) minor.mantissa++;
		}
		else if (	SX87_FPUCTRLW_RNDCTL(ctx->state.control_word) ==
				SX87_FPUCTRLW_RNDCTL_ZERO) {
			/* nothing */
		}
	}

	if (exb > 0) {
/* scale up the major value */
		threshhold   = (sx87_uldword)-1;
		threshhold >>= (sx87_uldword)(64-exb);
		waste        = major.mantissa & threshhold;
		threshhold   = (threshhold>>1)+1;

		major.exponent  += exb;
		major.mantissa >>= (sx87_uldword)exb;
/* round it */
		if (		SX87_FPUCTRLW_RNDCTL(ctx->state.control_word) ==
				SX87_FPUCTRLW_RNDCTL_NEAREST) {
			if (waste >= threshhold) major.mantissa++;
		}
		else if (	SX87_FPUCTRLW_RNDCTL(ctx->state.control_word) ==
				SX87_FPUCTRLW_RNDCTL_DOWNINF) {
			if (waste != 0L && major.sign_bit) major.mantissa++;
		}
		else if (	SX87_FPUCTRLW_RNDCTL(ctx->state.control_word) ==
				SX87_FPUCTRLW_RNDCTL_UPINF) {
			if (waste != 0L && !major.sign_bit) major.mantissa++;
		}
		else if (	SX87_FPUCTRLW_RNDCTL(ctx->state.control_word) ==
				SX87_FPUCTRLW_RNDCTL_ZERO) {
			/* nothing */
		}
	}

	if (src->sign_bit == dst->sign_bit) {
		/* simply add */
		dst->exponent = major.exponent;
		dst->sign_bit = major.sign_bit;
		dst->mantissa = minor.mantissa + major.mantissa;
	}
	else {
		/* negate mantissa based on sign */
		if (minor.sign_bit)	minor.mantissa = -minor.mantissa;
		if (major.sign_bit)	major.mantissa = -major.mantissa;
		/* now add, treating 63rd bit as sign */
		dst->exponent = major.exponent;
		dst->mantissa = minor.mantissa + major.mantissa;
		dst->sign_bit = dst->mantissa>>((sx87_uldword)63);
		if (dst->sign_bit) dst->mantissa = -dst->mantissa;
	}
}

static int Sfx86OpcodeExec_group_D8(sx87_ubyte opcode,softx87_ctx* ctx)
{
/* FADD ST(0),ST(i) */
	if (opcode >= 0xC0 && opcode < 0xC8) {
		int st0,i;

		i   = (int)(opcode-0xC0);
		i   = SX87_FPU_ST(SX87_FPUSTAT_TOP(ctx->state.status_word),i);
		st0 = SX87_FPU_ST(SX87_FPUSTAT_TOP(ctx->state.status_word),0);
/* add */
		op_fadd(ctx,&ctx->state.st[st0],&ctx->state.st[i]);
/* done */
		return 1;
	}
/* combo */
	else if (opcode < 0xC0) {
		sx86_ubyte mod,reg,rm;

		sx86_modregrm_unpack(opcode,mod,reg,rm);

		if (reg == 0)	/* FADD mem32 */
			ctx->callbacks.on_sx86_exec_full_modrmonly_memx(ctx->ref_softx86,mod,rm,4,op_fadd32);
		else
			return 0;

		return 1;
	}

	return 0;
}

static int Sfx86OpcodeDec_group_D8(sx87_ubyte opcode,softx87_ctx* ctx,char buf[128])
{
/* FADD ST(0),ST(i) */
	if (opcode >= 0xC0 && opcode < 0xC8) {
		sprintf(buf,"FADD ST(0),ST(%d)",opcode-0xC0);
		return 1;
	}
/* combo */
	else if (opcode < 0xC0) {
		sx86_ubyte mod,reg,rm;

		sx86_modregrm_unpack(opcode,mod,reg,rm);
		ctx->callbacks.on_sx86_dec_full_modrmonly(ctx->ref_softx86,1,0,mod,rm,s87op1_tmp);

		if (reg == 0)
			sprintf(buf,"FADD %s (mem32)",s87op1_tmp);
		else
			return 0;

		return 1;
	}

	buf[0]=0;
	return 0;
}

static int Sfx86OpcodeExec_group_D9(sx87_ubyte opcode,softx87_ctx* ctx)
{
/* FINCSTP */
	if (opcode == 0xF7) {
		int TOP;

		TOP = SX87_FPUSTAT_TOP(ctx->state.status_word);
		ctx->state.status_word &= ~SX87_FPUSTAT_C1;
/* decrement Top Of Stack. nothing is tagged empty. */
		TOP = (TOP+1)&7;
		SX87_FPUSTAT_TOP_SET(ctx->state.status_word,TOP);
/* done */
		return 1;
	}
/* FDECSTP */
	if (opcode == 0xF6) {
		int TOP;

		TOP = SX87_FPUSTAT_TOP(ctx->state.status_word);
		ctx->state.status_word &= ~SX87_FPUSTAT_C1;
/* decrement Top Of Stack. nothing is tagged empty. */
		TOP = (TOP-1)&7;
		SX87_FPUSTAT_TOP_SET(ctx->state.status_word,TOP);
/* done */
		return 1;
	}
/* FNOP */
	else if (opcode == 0xD0) {
		/* no-op */
		return 1;
	}
/* FLD ST(i) */
	else if (opcode >= 0xC0 && opcode < 0xC8) {
		int TOP,i;

		i   = (int)(opcode-0xC0);
		i   = SX87_FPU_ST(SX87_FPUSTAT_TOP(ctx->state.status_word),i);
		TOP = SX87_FPUSTAT_TOP(ctx->state.status_word);
/* set C1 if stack overflow */
		if (SX87_FPUTAGW_TAG(ctx->state.tag_word,TOP) != SX87_FPUTAGVAL_EMPTY)
			ctx->state.status_word |=  SX87_FPUSTAT_C1;
		else
			ctx->state.status_word &= ~SX87_FPUSTAT_C1;
/* decrement Top Of Stack, Tag as valid, and store */
		TOP = (TOP-1)&7;
		SX87_FPUSTAT_TOP_SET(ctx->state.status_word,TOP);
		SX87_FPUTAGW_TAG_SET(ctx->state.tag_word,TOP,SX87_FPUTAGVAL_VALID);
/* copy */
		ctx->state.st[TOP].exponent =	ctx->state.st[i].exponent;
		ctx->state.st[TOP].mantissa =	ctx->state.st[i].mantissa;
		ctx->state.st[TOP].sign_bit =	ctx->state.st[i].sign_bit;
/* done */
		return 1;
	}
/* combo */
	else if (opcode < 0xC0) {
		sx86_ubyte mod,reg,rm;

		sx86_modregrm_unpack(opcode,mod,reg,rm);

		if (reg == 0)	/* FLD mem32 */
			ctx->callbacks.on_sx86_exec_full_modrmonly_memx(ctx->ref_softx86,mod,rm,4,op_fld32);
		else
			return 0;

		return 1;
	}

	return 0;
}

static int Sfx86OpcodeDec_group_D9(sx87_ubyte opcode,softx87_ctx* ctx,char buf[128])
{
/* FINCSTP */
	if (opcode == 0xF7) {
		strcpy(buf,"FINCSTP");
		return 1;
	}
/* FDECSTP */
	else if (opcode == 0xF6) {
		strcpy(buf,"FDECSTP");
		return 1;
	}
/* FNOP */
	else if (opcode == 0xD0) {
		strcpy(buf,"FNOP");
		return 1;
	}
/* FLD ST(i) */
	else if (opcode >= 0xC0 && opcode < 0xC8) {
		sprintf(buf,"FLD ST(%d)",opcode-0xC0);
		return 1;
	}
/* combo */
	else if (opcode < 0xC0) {
		sx86_ubyte mod,reg,rm;

		sx86_modregrm_unpack(opcode,mod,reg,rm);
		ctx->callbacks.on_sx86_dec_full_modrmonly(ctx->ref_softx86,1,0,mod,rm,s87op1_tmp);

		if (reg == 0)
			sprintf(buf,"FLD %s (mem32)",s87op1_tmp);
		else
			return 0;

		return 1;
	}

	buf[0]=0;
	return 0;
}

static int Sfx86OpcodeExec_group_DA(sx87_ubyte opcode,softx87_ctx* ctx)
{
/* combo */
	if (opcode < 0xC0) {
		sx86_ubyte mod,reg,rm;

		sx86_modregrm_unpack(opcode,mod,reg,rm);

		if (reg == 0)	/* FIADD mem32 */
			ctx->callbacks.on_sx86_exec_full_modrmonly_memx(ctx->ref_softx86,mod,rm,4,op_fiadd32);
		else
			return 0;

		return 1;
	}

	return 0;
}

static int Sfx86OpcodeDec_group_DA(sx87_ubyte opcode,softx87_ctx* ctx,char buf[128])
{
/* combo */
	if (opcode < 0xC0) {
		sx86_ubyte mod,reg,rm;

		sx86_modregrm_unpack(opcode,mod,reg,rm);
		ctx->callbacks.on_sx86_dec_full_modrmonly(ctx->ref_softx86,1,0,mod,rm,s87op1_tmp);

		if (reg == 0)
			sprintf(buf,"FIADD %s (mem32)",s87op1_tmp);
		else
			return 0;

		return 1;
	}

	buf[0]=0;
	return 0;
}

static int Sfx86OpcodeExec_group_DB(sx87_ubyte opcode,softx87_ctx* ctx)
{
/* FINIT a.k.a. FNINIT */
	if (opcode == 0xE3) {
		softx87_finit_setup(ctx);
		return 1;
	}

	return 0;
}

static int Sfx86OpcodeDec_group_DB(sx87_ubyte opcode,softx87_ctx* ctx,char buf[128])
{
/* FINIT a.k.a. FNINIT */
	if (opcode == 0xE3) {
		strcpy(buf,"FINIT");
		return 1;
	}

	buf[0]=0;
	return 0;
}

static int Sfx86OpcodeExec_group_DC(sx87_ubyte opcode,softx87_ctx* ctx)
{
/* FADD ST(i),ST(0) */
	if (opcode >= 0xC0 && opcode < 0xC8) {
		int st0,i;

		i   = (int)(opcode-0xC0);
		i   = SX87_FPU_ST(SX87_FPUSTAT_TOP(ctx->state.status_word),i);
		st0 = SX87_FPU_ST(SX87_FPUSTAT_TOP(ctx->state.status_word),0);
/* add */
		op_fadd(ctx,&ctx->state.st[i],&ctx->state.st[st0]);
/* done */
		return 1;
	}
/* combo */
	else if (opcode < 0xC0) {
		sx86_ubyte mod,reg,rm;

		sx86_modregrm_unpack(opcode,mod,reg,rm);

		if (reg == 0)	/* FADD mem64 */
			ctx->callbacks.on_sx86_exec_full_modrmonly_memx(ctx->ref_softx86,mod,rm,8,op_fadd64);
		else
			return 0;

		return 1;
	}

	return 0;
}

static int Sfx86OpcodeDec_group_DC(sx87_ubyte opcode,softx87_ctx* ctx,char buf[128])
{
/* FADD ST(i),ST(0) */
	if (opcode >= 0xC0 && opcode < 0xC8) {
		sprintf(buf,"FADD ST(%d),ST(0)",opcode-0xC0);
		return 1;
	}
/* combo */
	else if (opcode < 0xC0) {
		sx86_ubyte mod,reg,rm;

		sx86_modregrm_unpack(opcode,mod,reg,rm);
		ctx->callbacks.on_sx86_dec_full_modrmonly(ctx->ref_softx86,1,0,mod,rm,s87op1_tmp);

		if (reg == 0)
			sprintf(buf,"FADD %s (mem64)",s87op1_tmp);
		else
			return 0;

		return 1;
	}

	buf[0]=0;
	return 0;
}

static int Sfx86OpcodeExec_group_DD(sx87_ubyte opcode,softx87_ctx* ctx)
{
/* combo */
	if (opcode < 0xC0) {
		sx86_ubyte mod,reg,rm;

		sx86_modregrm_unpack(opcode,mod,reg,rm);

		if (reg == 0)	/* FLD mem64 */
			ctx->callbacks.on_sx86_exec_full_modrmonly_memx(ctx->ref_softx86,mod,rm,8,op_fld64);
		else
			return 0;

		return 1;
	}
/* FFREE ST(i) */
	else if (opcode >= 0xC0 && opcode < 0xC8) {
		int i;

		i = SX87_FPU_ST(SX87_FPUSTAT_TOP(ctx->state.status_word),(int)(opcode-0xC0));
		SX87_FPUTAGW_TAG_SET(ctx->state.tag_word,i,SX87_FPUTAGVAL_EMPTY);

		return 1;
	}

	return 0;
}

static int Sfx86OpcodeDec_group_DD(sx87_ubyte opcode,softx87_ctx* ctx,char buf[128])
{
/* combo */
	if (opcode < 0xC0) {
		sx86_ubyte mod,reg,rm;

		sx86_modregrm_unpack(opcode,mod,reg,rm);
		ctx->callbacks.on_sx86_dec_full_modrmonly(ctx->ref_softx86,1,0,mod,rm,s87op1_tmp);

		if (reg == 0)
			sprintf(buf,"FLD %s (mem64)",s87op1_tmp);
		else
			return 0;

		return 1;
	}
/* FFREE ST(i) */
	else if (opcode >= 0xC0 && opcode < 0xC8) {
		sprintf(buf,"FFREE ST(%d)",opcode-0xC0);
		return 1;
	}

	buf[0]=0;
	return 0;
}

static int Sfx86OpcodeExec_group_DE(sx87_ubyte opcode,softx87_ctx* ctx)
{
/* FADDP ST(i),ST(0) */
	if (opcode >= 0xC0 && opcode < 0xC8) {
		int st0,i;

		i   = (int)(opcode-0xC0);
		i   = SX87_FPU_ST(SX87_FPUSTAT_TOP(ctx->state.status_word),i);
		st0 = SX87_FPU_ST(SX87_FPUSTAT_TOP(ctx->state.status_word),0);
/* add */
		op_fadd(ctx,&ctx->state.st[i],&ctx->state.st[st0]);
/* pop */
		softx86_popstack(ctx);
/* done */
		return 1;
	}
/* combo */
	else if (opcode < 0xC0) {
		sx86_ubyte mod,reg,rm;

		sx86_modregrm_unpack(opcode,mod,reg,rm);

		if (reg == 0)	/* FIADD mem16 */
			ctx->callbacks.on_sx86_exec_full_modrmonly_memx(ctx->ref_softx86,mod,rm,2,op_fiadd16);
		else
			return 0;

		return 1;
	}

	return 0;
}

static int Sfx86OpcodeDec_group_DE(sx87_ubyte opcode,softx87_ctx* ctx,char buf[128])
{
/* FADDP ST(i),ST(0) */
	if (opcode >= 0xC0 && opcode < 0xC8) {
		sprintf(buf,"FADDP ST(%d),ST(0)",opcode-0xC0);
		return 1;
	}
/* combo */
	else if (opcode < 0xC0) {
		sx86_ubyte mod,reg,rm;

		sx86_modregrm_unpack(opcode,mod,reg,rm);
		ctx->callbacks.on_sx86_dec_full_modrmonly(ctx->ref_softx86,1,0,mod,rm,s87op1_tmp);

		if (reg == 0)
			sprintf(buf,"FIADD %s (mem16)",s87op1_tmp);
		else
			return 0;

		return 1;
	}

	buf[0]=0;
	return 0;
}

static int Sfx86OpcodeExec_group_DF(sx87_ubyte opcode,softx87_ctx* ctx)
{
	return 0;
}

static int Sfx86OpcodeDec_group_DF(sx87_ubyte opcode,softx87_ctx* ctx,char buf[128])
{
	buf[0]=0;
	return 0;
}

Sfx87OpcodeTable optab8087 = {
{
	{Sfx86OpcodeExec_group_D8,	Sfx86OpcodeDec_group_D8},				/* 0xD8xx */
	{Sfx86OpcodeExec_group_D9,	Sfx86OpcodeDec_group_D9},				/* 0xD9xx */
	{Sfx86OpcodeExec_group_DA,	Sfx86OpcodeDec_group_DA},				/* 0xDAxx */
	{Sfx86OpcodeExec_group_DB,	Sfx86OpcodeDec_group_DB},				/* 0xDBxx */
	{Sfx86OpcodeExec_group_DC,	Sfx86OpcodeDec_group_DC},				/* 0xDCxx */
	{Sfx86OpcodeExec_group_DD,	Sfx86OpcodeDec_group_DD},				/* 0xDDxx */
	{Sfx86OpcodeExec_group_DE,	Sfx86OpcodeDec_group_DE},				/* 0xDExx */
	{Sfx86OpcodeExec_group_DF,	Sfx86OpcodeDec_group_DF},				/* 0xDFxx */
},
};
