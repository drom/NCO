[Numerically controlled oscillator](https://en.wikipedia.org/wiki/Numerically_controlled_oscillator) (NCO) in Verilog RTL

Configurable hybrid implementation:
  * complex output {Im, Re}
  * Integer (2's complement) implementation
  * Pi/4 Look-up table stage
  * N2 - CORDIC stages
  * N3 - Dynamic Rotation CORDIC stages

## Parameters
  * WD : data width (per component)
  * SCALE : fixed point magnitude of the output signal
  * WA1 : Look-up table bits
  * WA2 : bits for the CORDIC stages
  * WA3 : bits for the Dynamic Rotation CORDIC
