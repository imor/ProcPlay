/* softx86cfg.h
 *
 * Configuration #defines for Softx86 emulation library.
 *
 * (C) 2003 Jonathan Campbell.
 *
 * If ENDIAN.H is present, this header file determines the native byte
 * order from that. If WIN32 is defined, this header assumes little
 * Endian since the Win32 environment exists only on the x86 platform.
 * If neither happens, a set of #defines will be used that must be modified
 * manually to fit your system.
 *  */

/* If we're being compiled with GCC and NOT MINGW assume Linux environment
   and headers */
#ifdef __GNUC__
#ifndef __MINGW32__
#include <endian.h>	/*   /usr/include/endian.h   */
#endif
#endif //__GNUC__

/* AUTODETECT USING ENDIAN.H UNDER LINUX */
#ifdef _ENDIAN_H

#if __BYTE_ORDER == __LITTLE_ENDIAN
#define SX86_BYTE_ORDER			LE
#elif __BYTE_ORDER == __BIG_ENDIAN
#define SX86_BYTE_ORDER			BE
#endif /* __BYTE_ORDER */

/* 32-bit Windows */
#elif WIN32

#define SX86_BYTE_ORDER			LE

/* 32-bit Windows, using MINGW */
#elif __MINGW32__

#define SX86_BYTE_ORDER			LE

#else
/* WE HAVE NO IDEA, SO WHOEVER IS COMPILING THE LIBRARY AND DEPENDENT
 * CODE NEEDS TO MODIFY THESE MANUALLY TO FIT THEIR PLATFORM */

/* modify these to your platform. acceptable values are LE and BE */
#define SX86_BYTE_ORDER			LE

#endif
