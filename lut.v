module nco_lut #(
    parameter WA0 = 3,
    parameter WA1 = 4
) (
    input  [WA0 +  WA1 - 1: 0] phase,
    output        [WA1 - 1: 0] addr,
    output re_sig, im_sig, sel
);

/*
phi   re  im  addr

000   lo  hi   a
001   hi  lo  -a
010  -hi  lo   a
011  -lo  hi  -a
100  -lo -hi   a
101  -hi -lo  -a
110   hi -lo   a
111   lo -hi  -a
*/

    wire [WA0 - 1 : 0] a0;
    wire [WA1 - 1 : 0] a1;
    assign {a0, a1} = phase;

    assign addr = a0[0] ? (1 - a1) : a1;
    assign re_sig = ^a0[2:1];
    assign im_sig = a0[2];
    assign sel = ^a0[1:0];

endmodule
