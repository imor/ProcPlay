# SOFTX86DBG Makefile for Linux/GCC 3.xx
# (C) 2003 Jonathan Campbell
#
# NOTE: Assumes subdirectory ./obj/ and places all object files there
#       rather than mix them up with the source code. It's less messy
#       that way. The only exception is the final output, softx86.o.

ALL_TARGETS = __obj ../bin/softx86dbg ../bin/softx86dbg-static
ALL_OBJS = obj/main.o
INCLUDZ = -I../include
LIBINCLUDZ = -L../lib

# external makefile created by the root makefile
# when softx87 source tree autodetection is made
include Makefile.softx87

all:: $(ALL_TARGETS)

clean::
	rm -f $(ALL_OBJS)

distclean:: clean
	rm -f ../bin/softx86dbg
	rm -f ../bin/softx86dbg-static
	if [[ -d obj ]]; then rmdir obj; fi

../bin/softx86dbg: $(ALL_OBJS)
	g++ $(LIBINCLUDZ) -lsoftx86 -o ../bin/softx86dbg $(ALL_OBJS)

../bin/softx86dbg-static: $(ALL_OBJS)
	g++ $(LIBINCLUDZ) -static -lsoftx86 -o ../bin/softx86dbg-static $(ALL_OBJS)

# make sure there is an "obj" subdirectory
__obj:
	if [[ !(-d obj) ]]; then mkdir obj; fi

obj/main.o: main.cpp
	g++ $(INCLUDZ) -c -o obj/main.o main.cpp

