`timescale 10ns/1ns

module tb;
  reg reset_n = 0;
  initial begin
     $dumpfile("nco.vcd");
     $dumpvars(0, tb);
     # 4 reset_n = 1;
     # 1000 $finish;
  end

  reg clk = 1;
  always #0.5 clk = !clk;

  wire t_angle_req = 1'b1;
  wire t_angle_ack;
  wire i_nco_req;
  wire i_nco_ack = 1'b1;

  reg [31:0] t_angle_dat = 32'h0;
  always #1 t_angle_dat = t_angle_dat + 32'h56789abc;

  wire [31:0] i_nco_dat;

  nco u0 (
    .t_angle_dat  (t_angle_dat),
    .t_angle_req  (t_angle_req),
    .t_angle_ack  (t_angle_ack),
    .i_nco_dat    (i_nco_dat),
    .i_nco_req    (i_nco_req),
    .i_nco_ack    (i_nco_ack),
    .reset_n      (reset_n),
    .clk          (clk)
  );

endmodule
