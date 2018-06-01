'use strict';

const reqack = require('reqack');
const range = require('lodash.range');
const lutGen = require('./lut');
const cordicGen = require('./cordic');

module.exports = config => {

    const perLutEntry = (e, i) => `${i} : ncolut = {${dataWidth}'d${e.im}, ${dataWidth}'d${e.re}};`;

    const angleWidth=32;
    const dataWidth = config.dataWidth;
    const addrWidth = config.addrWidth;
    const betaWidth = angleWidth - 3 - config.addrWidth;
    const nCordics = config.nCordics;

    const lut = lutGen(config);
    const cordics = cordicGen(config);


    const imSelect = `${dataWidth*2-1}:${dataWidth}`;
    const reSelect = `${dataWidth-1}:0`;
    const imSelectSign = `${dataWidth*2+3}:${dataWidth+2}`;
    const reSelectSign = `${dataWidth+1}:0`;
    // const imSign2Select = `${dataWidth*2+1}:${dataWidth+2}`;
    // const reSign2Select = `${dataWidth}:1`;

    const addrSelect = `${angleWidth-3-1}:${angleWidth-3-addrWidth}`;
    const betaSelect = `${angleWidth-3-1-addrWidth}:0`;
    const phaseSelect = `${angleWidth-1}:${angleWidth-3}`;
    const lutString = lut.map(perLutEntry).join('\n');
    const macros = {
        'nco_lut': {
            data: p => {
                const pre = 'node' + p.id + '_';
                return `
// Look-Up stage
/*
{JSON.stringify(lut, null, 4)}
*/

reg [${2*dataWidth-1}:0] ncolut;

always @*
casez (${pre}addr)
${lutString}
endcase

wire [${angleWidth-1}:0] ${pre}angle;
wire [2:0] ${pre}phase;
wire [${addrWidth - 1}:0] ${pre}addr;
wire [${dataWidth+1}:0] ${pre}reSwap;
wire [${dataWidth+1}:0] ${pre}imSwap;


assign ${pre}angle = ${p.t[0].wire};
assign ${pre}phase = ${pre}angle[${phaseSelect}]; //3 bit phase
assign ${pre}addr = ${pre}phase[0]?~${pre}angle[${addrSelect}]:${pre}angle[${addrSelect}];
//re = ${reSelect}  im = ${imSelect}
assign ${pre}reSwap[${dataWidth+1}:${dataWidth}]=2'b0;
assign ${pre}imSwap[${dataWidth+1}:${dataWidth}]=2'b0;
assign ${pre}reSwap[${dataWidth-1}:0] = ${pre}phase[0]^${pre}phase[1] ? ncolut[${imSelect}]:ncolut[${reSelect}];
assign ${pre}imSwap[${dataWidth-1}:0] = ${pre}phase[0]^${pre}phase[1] ? ncolut[${reSelect}]:ncolut[${imSelect}];

assign ${p.i[0].wire}[${reSelectSign}] = ${pre}phase[2]^${pre}phase[1]?~${pre}reSwap:${pre}reSwap;
assign ${p.i[0].wire}[${imSelectSign}] = ${pre}phase[2]?~${pre}imSwap:${pre}imSwap;
assign ${p.i[0].wire}[${dataWidth*2+betaWidth+4-1}:${dataWidth*2+4}] = ${pre}angle[${betaWidth-1}:0];
`;
            }
        },
        'nco_cordic': {
            data: p => {
                const idx = p.id - 2;
                return `
// CORDIC stage ${idx}
/*
${JSON.stringify(cordics[idx], null, 4)}
*/

wire [${betaWidth-1}:0] beta${idx};
wire [${betaWidth-1}:0] beta_calc${idx};
wire [${dataWidth+1}:0] re${idx},im${idx},re_shift${idx},im_shift${idx};


assign  beta${idx} = ${p.t[0].wire}[${betaSelect}];

assign re${idx}=${p.t[0].wire}[${reSelectSign}];
assign im${idx}=${p.t[0].wire}[${imSelectSign}];

//assign re_shift${idx}={{${cordics[idx].shift}{re${idx}[${dataWidth+1}]}},re${idx} >> ${cordics[idx].shift}};
//assign im_shift${idx}={{${cordics[idx].shift}{im${idx}[${dataWidth+1}]}},im${idx} >> ${cordics[idx].shift}};

assign re_shift${idx}=$signed(re${idx}) >> ${cordics[idx].shift};
assign im_shift${idx}=$signed(im${idx}) >> ${cordics[idx].shift};

assign beta_calc${idx} = beta${idx}[${betaWidth-1}]?beta${idx}+${cordics[idx].sigma}:beta${idx}-${cordics[idx].sigma};
assign ${p.i[0].wire}[${reSelectSign}] = beta${idx}[${betaWidth-1}]?re${idx}-im_shift${idx} : re${idx}+im_shift${idx};
assign ${p.i[0].wire}[${imSelectSign}] = beta${idx}[${betaWidth-1}]?im${idx}+re_shift${idx} : im${idx}-re_shift${idx};
assign ${p.i[0].wire}[${dataWidth*2+betaWidth+4-1}:${dataWidth*2+4}] = beta_calc${idx};

`;
            }
        },
        'saturation' : {
            data : p => {
                return `
wire [${dataWidth+1}:0] recalc${p.id},imcalc${p.id};
wire [${dataWidth-1}:0] redata${p.id},imdata${p.id};

assign recalc${p.id}=${p.t[0].wire}[${reSelectSign}];
assign imcalc${p.id}=${p.t[0].wire}[${imSelectSign}];

assign ${p.i[0].wire}[${reSelect}]=^recalc${p.id}[${dataWidth+1}:${dataWidth}]?{recalc${p.id}[${dataWidth+1}],{${dataWidth-1}{~recalc${p.id}[${dataWidth+1}]}}}:{recalc${p.id}[${dataWidth+1}],recalc${p.id}[${dataWidth-1}:1]};

assign ${p.i[0].wire}[${imSelect}]=^imcalc${p.id}[${dataWidth+1}:${dataWidth}]?{imcalc${p.id}[${dataWidth+1}],{${dataWidth-1}{~imcalc${p.id}[${dataWidth+1}]}}}:{imcalc${p.id}[${dataWidth+1}],imcalc${p.id}[${dataWidth-1}:1]};

assign redata${p.id} = ${p.i[0].wire}[${reSelect}];
assign imdata${p.id} = ${p.i[0].wire}[${imSelect}];

`;
            }
        }
    };

    const g = reqack.circuit('nco');

    const tNode = g('angle');
    const lutNode = g('nco_lut');


    tNode({width: angleWidth, capacity: 1})(lutNode);

    const n2 = range(nCordics).reduce((prev) => {
        const n = g('nco_cordic');
        prev({width: angleWidth + 2*dataWidth + 4, capacity: 1})(n);
        return n;
    }, lutNode);

    //    n2({width: angleWidth + 2*dataWidth, capacity: 1})(g('nco'));
    const rlsb = g('saturation');
    n2({width: angleWidth + 2*dataWidth+4, capacity: 1})(rlsb);
    rlsb({width: 2*dataWidth})(g('nco'));

    const verilog = '// ' + JSON.stringify(config) + '\n' + reqack.verilog(g, macros);

    // ncoLutStringArray(lut);
    console.log(verilog);

    return verilog;

};
