#include "nco/Vnco.h"
#include "verilated.h"
#include "verilated_vcd_c.h"

int main(int argc, char **argv, char **env) {
  Verilated::commandArgs(argc, argv);
  // init top verilog instance
  Vnco* top = new Vnco;
  // init trace dump
  Verilated::traceEverOn(true);
  VerilatedVcdC* tfp = new VerilatedVcdC;
  top->trace(tfp, 1);
  tfp->open("nco.vcd");
  // initialize simulation inputs
  top->clk = 1;
  top->reset_n = 0;
  top->t_angle_req = 0;
  top->i_nco_ack = 0;
  int angle = 0;
  for (int i = 0; i < 2000; i += 2) {
      top->reset_n = (i > 10);

      top->t_angle_dat = angle;
      if (i > 12) {
        top->t_angle_req = 1;
        top->i_nco_ack = 1;
        angle = angle + 0x2000000;
      }

      tfp->dump(i);
      top->clk = 0;
      top->eval();

      tfp->dump(i + 1);
      top->clk = 1;
      top->eval();

      if (Verilated::gotFinish()) exit(0);
  }
  tfp->close();
  exit(0);
}
