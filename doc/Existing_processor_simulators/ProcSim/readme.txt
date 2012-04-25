  ----------------------------------------------------------
               ProcSim MIPS v2.0
  ----------------------------------------------------------
        ------James Garton (c) 2005-----


This program simulates a MIPS R2000 Processor. It can display a number of datapaths through the processor, showing how each component of the architecture works with the input. Assembly programs can be input in to the program using supported instructions. These vary with the architecture used. Different architectures can be created or loaded using an XML format, in conjunction with an in program diagram designer. You can see an explanation of the XML format used below.

This program is great for learning how the processor works. And can be used to design your own architectures to practice your understanding (although you cannot add new instructions to the ISA - only the following are supported: add, sub, and, or, slt, lw, sw, beq, addi, andi, ori, j).

You need Java v1.5 to run this program. You can download it from http://www.java.com/en/download/manual.jsp.

Minimum System Requirements:
OS: Windows 95-XP, (Linux).
Processor: 1GHz CPU
Resolution Monitor: 1024*768

Recommended:
OS: Windows 2k-XP
Processor: >1.5GHz
Resolution Monitor: 1280*1024


-------------------------
Running ProcSim MIPS
-------------------------
Make sure you have the Java runtime environment (JRE) V1.5 before running ProcSim.

Windows:
Unzip the program, and double click the ProcSim.exe file.
If this fails to run for any reason, then you can run the \classes\ProcSim.jar or  \classes\ProcSim.bat files instead.

Linux: 
It is recommened to run this software on Windows!
There are a few different ways ProcSim could be run in Linux...
- Type: "java ProcSim" in a console window, in the directory ".\classes\"
- Double click ProcSim.jar in a windowing environment in the directory ".\classes\".
If there is a message saying java does not exist, make sure java is installed. Then find out which directory it is in, and type:
export PATH=/usr/java/j2re1.5/bin:$PATH
replacing "/usr/java/j2re1.5/bin" with the path to your java directory.
Now it should be possible to type "java ProcSim"
-If this still does not work, simply type "./usr/java/j2re1.5/bin/java ProcSim" in the ".\classes\" dir.

-----------------------
Simulation Usage Help
-----------------------

---Simulation Window---

A number of architectures and assembly programs are included, and one is loaded at startup. So it is possible to just start straight away and click "Start Simulation". What you see now is a very simple datapath just supporting the arithmetic R-Format instruction (add, and, or, sub). To start the simulation running, you must click "Start Execution".

You should then see the animation running. You can slow it down by moving the Speed bar on the control panel to the left.

Other Control Panel controls:
Step: Shows one animation step and stops until you click it again, or press resume.
Registers: Shows the Registers frame (which should already be on the screen).
Main Memory: Shows the Main Memory frame.
Intruction Memory: Shows the Intruction Memory frame (which should already be on the screen).
Super Speed: Only animates at each corner of a bus. So goes very fast.
Instant Speed: Does no animation. If you minimise the simulation window aswell, it should almost instantly finish the exection of the assembly program.
Close: Closes the simulation window.

Registers Window:
Shows all the registers that currently have values stored in them. The columns are as follows: Reg - Binary value of the register address, Reg - String value of the registers, Bin Val - The value stored in this register in binary, and Dec Val - The value in Decimal.
You can press Show All to see all registers rather than just those with values.
Press Done to hide the window.

Instruction Memory Window:
This is similar, but here you can choose between seeing the instruction as Assembly or as Machine Code.
Each instruction is stored in 4 bytes, so the addresses go up by 4 each time as the MIPS architecture is a byte addressable machine. You can see an instructions comment by clicking on it.

Main Memory Window:
This shows each byte's address, as well as each word's address. This is beacuse the MIPS can choose to read a whole word, or just a byte.

Main Frame Menu:
To load a different architecture, you can click "File\Open Sim..." and choose one of the example ".xml" files.
To load an assembly program you can click "File\Open Assembly..." and choose a ".asm" file.
To edit either of these, you must close the sim window and choose the corresponding option on the main program window.

Hints:
A small subscript 2 on an animating value, means that it is binary. If there is no subscript on the animation then it is decimal.
You can click on a component for a description of what it does.
If the animation runs too slow or "jerkily", try minimising or closing the other windows. Also turn off Transparency in the settings menu.
A component will only execute if all its input buses are set (they are all red coloured). The only exeption to this is if a bus is optional (which is set in the XML architecture doc).

-----------------------------
Assembly Code
-----------------------------

To edit the assembly code, click "Assembly Code" on the main window. This new screen acts like a text editor.
Supported Assembly:
The supported ISA depends on the currently loaded architecture file. You can see the supported ISA by clicking "Help\Supported ISA" (these are retrived from the currently loaded XML doc). 
To set registers to default values, you can use an assembler directive: ".register <R1> <value>" for example ".register $s0 21". 
Comments can be used. The comment charachter is "#".
Labels cannot be placed alone on a line, they have to have an instruction next to them. The only exception is ":exit" placed at the very end of a program.

To assemble the code, click Assemble. This will then tell you if your program has been successfully assembled or not. If not, you can look at the console windows error panel to find where the problem occured.

Machine code can be used instead of assembly. Only 32bits are supported, and there are other limitations with XML architecture.

-----------------------------------
Architecture Files (XML)
-----------------------------------

To create different architectures you must create an XML file to detail the components, buses and how they interact. You can use the in program editor to do this. Once you have an XML architecture, you can use the diagram designer to draw your architectures components on a canvas.

First click "Processor Architecture" on the main window. This will show you a window with the currently loaded architectures diagram on it.

Click on "Edit Architecture" to edit the XML. Now you can create/load a new XML doc, or edit the current one. Just look at the examples to work out how to use the XML. All features are used somewhere in the examples.

All supported "<do func="s are as follows:
mux, or, zero, multiplexor, add, and, sub, readmem, writemem, bitout, out, split, readreg, writereg, getInstruction, shiftleft, signextend, slt, join.

Once you have finished creating the architecture, press "Parse". This will tell you if it succedes or fails. If it fails look at the error panel on the console for information about where the problem is.

Hints:
A component must always be able to do at least one op if all its input buses are set during an execution.
All input and output bus names must match up (case sensitive).
"<output name="Result" bits="32" alternativeStr="true"  optional="true">" means that this output buses name is Result and it has 32 bits. The other attributes are optional. alternativeStr means that the bus will show instead of a binary vale, a decimal value (or assembly in the case of an instruction). "optional" means that this bus does not have to be set for the connected component to do its ops.
The least a component must have is the following:
	<Component>
		<name>A</name>
		<description>A Description</description>
		<inputBuses>
			<input name="Z" bits="1"/>
		</inputBuses>
	</Component>
(The input Z must be connected up to an outputbus from a different component - which may only have an output).
<specialComponent comp="StartComp"/> means that this component will be the first to start executing. It will set all its output buses to 0 when starting execution. Mostly used for PC.

----------------------------------
Architecture Diagram
-----------------------------------

Once you have created an XML architecture document you can create the diagram to go with it. To edit this, click on Processor Architecture on the main screen. You can now see the currently loaded architecture. Use the File/Load menu if you need to load an XML doc you did before.
You can now add the components to the diagram. Just click on one of the items in the list in the top right. Then click anywhere on the canvas. A square box will be placed down. You can drag it around the screen. Change its height and width in the boxes on the right. 
Once you have placed some components down, you can start drawing the buses. To do this click on the component you wish to add buses to, then click on a bus in the middle list on the right ("Connected buses"). You will now see the two component that this bus joins together change colour. The red component is the output bus, and blue is input. Click on the canvas anywhere close to the output component to place the bus on it. Now you can keep clicking to place more lines down (all joined up). Click on the input component to finish editing that bus.
Now you will see some bus names. You can move them too. You can also hide any bus names you feel are irelevant by clicking "Hide Bus Names" on the right bottom.
When you are happy with the diagram, you can press "Done".


For more help look through the extensive set of examples.



James M Garton 18/09/2005
jmg@jamesgart.com
http://jamesgart.com/procsim