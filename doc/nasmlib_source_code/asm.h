
#ifndef ASM_H
#define ASM_H

/* Assembles the given instruction into a 32 bit Intel machine code */
int64_t assemble_instruction(char* mnemonic, char** output);


#endif