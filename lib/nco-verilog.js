'use strict';

const reqack = require('reqack');
const range = require('lodash.range');
const lutGen = require('./lut');
const cordicGen = require('./cordic');

module.exports = config => {

    const dataWidth = config.dataWidth;
    const addrWidth = config.addrWidth;
    const nCordics = config.nCordics;

    const lut = lutGen(addrWidth, dataWidth, nCordics, 2);
    const cordics = cordicGen(addrWidth, dataWidth, nCordics, 2);

    const macros = {
        'nco_lut': {
            data: p => {
                const pre = 'node' + p.id + '_';
                return `
// Look-Up stage
/*
${JSON.stringify(lut, null, 4)}
*/

wire [2:0] ${pre}a0;
wire [${addrWidth - 1}:0] ${pre}a1;
wire ${pre}re_sig, ${pre}im_sig, ${pre}sel;
assign {a0, a1} = phase;

assign ${pre}addr = ${pre}a0[0] ? (0 - ${pre}a1) : ${pre}a1;
assign ${pre}re_sig = ^${pre}a0[2:1];
assign ${pre}im_sig = ${pre}a0[2];
assign ${pre}sel = ^${pre}a0[1:0];
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

`;
            }
        }
    };

    const g = reqack.circuit();

    const tNode = g();
    const lutNode = g('nco_lut');

    tNode({width: dataWidth, capacity: 1})(lutNode);

    const n2 = range(nCordics).reduce((prev) => {
        const n = g('nco_cordic');
        prev({width: dataWidth, capacity: 1})(n);
        return n;
    }, lutNode);

    n2({width: dataWidth, capacity: 1})(g());

    const verilog = '// ' + JSON.stringify(config) + '\n' + reqack.verilog(g, macros);

    // console.log(verilog);

    return verilog;

};
