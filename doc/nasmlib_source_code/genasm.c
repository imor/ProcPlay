#include <stdio.h>
#include <inttypes.h>
#include "asm.h"

static void print_bytes(char* arr, int64_t size)
{
    int64_t i;
    for (i = 0; i < size; i++)
    {
        printf("%02x ", arr[i]);
    }
}


int main(int argc, char** argv)
{
    char* mnemonic;
    char* output;
    int64_t output_size;

    if (argc != 2)
    {
        printf("%s", "Usage: nasm 'mnemonic'\n"); return;
    }
    
    mnemonic = argv[1];

    printf("Requested code for '%s'...\n", mnemonic);

    output_size = assemble_instruction(mnemonic, 16, &output);

    printf("%s", "The output is: ");
    print_bytes(output, output_size);
    printf("\n");
}
