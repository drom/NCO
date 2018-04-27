'use strict';

const reqack = require('reqack');
const range = require('lodash.range');
const lutGen = require('./lut');
const cordicGen = require('./cordic');

function ncoLutStringArray(lut){
    let arr = new Array();
    let idx=0;
    for(var i=0;i<lut.length;i++){
//	console.log('lut idx: ' + i + ' re: ' + lut[i]['re'] );
	arr.push(`{16'd${lut[i]['re']},16'd${lut[i]['im']}}`);
    }
    return `'{` + arr.join(',') + '}';
}

module.exports = config => {

    const dataWidth = config.dataWidth;
    const addrWidth = config.addrWidth;
    const nCordics = config.nCordics;

    const lut = lutGen(addrWidth, dataWidth, nCordics, 2);
    const cordics = cordicGen(addrWidth, dataWidth, nCordics, 2);

    const reSelect = '31:15';
    const imSelect = '15:0';
    const lutString = ncoLutStringArray(lut);
    const macros = {
        'nco_lut': {
            data: p => {
                const pre = 'node' + p.id + '_';
                return `
// Look-Up stage
/*
${JSON.stringify(lut, null, 4)}
*/

reg ncolut = ${lutString};

wire ${pre}angle;
wire ${pre}phase;
wire [2:0] ${pre}a0;
wire [${addrWidth - 1}:0] ${pre}addr;
wire [${dataWidth - 1}:0] ${pre}reSwap;
wire [${dataWidth - 1}:0] ${pre}imSwap;

assign {a0, a1} = phase;

assign ${pre}angle = ${p.t[0].wire};
assign ${pre}phase = ${pre}angle[31:29]; //3 bit phase
assign ${pre}addr = ${pre}angle[28:${28-addrWidth-1}];
//re = 31:16  im = 15:0
assign ${pre}reSwap = ${pre}phase[0]^${pre}phase[1]?ncolut[addr][${imSelect}]:ncolut[addr][${reSlect}];
assign ${pre}imSwap = ${pre}phase[0]^${pre}phase[1]?ncolut[addr][${reSelect}]:ncolut[addr][${imSelect}];

assign ${p.i[0].wire}[${reSelect}] = ${pre}phase[2]^${pre}phase[1]?~${pre}reSwap:${pre}reSwap;
assign ${p.i[0].wire}[${imSelect}] = ${pre}phase[2]?~${pre}imSwap:${pre}imSwap;
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

wire $beta{idx};
wire $beta_calc{idx};

assign  $beta{idx} = ${p.t[0].wire}[betaSelect];

assign $beta_calc{idx} = beta${idx}[betaWidth-1]?beta${idx}-${cordic[idx].sigma}:beta${idx}+${cordic[idx].sigma};
assign ${p.i[0].wire}[${reSelect}] = beta${idx}[betaWidth-1]?${p.t[0].wire}[${reSelect}]+(${p.i[0].wire}[${imSelect}] >> ${cordic[idx].shift}) : ${p.t[0].wire}[${reSelect}]-(${p.i[0].wire}[${imSelect}] >> ${cordic[idx].shift});
assign ${p.i[0].wire}[${imSelect}] = beta${idx}[betaWidth-1]?${p.t[0].wire}[${imSelect}]-(${p.i[0].wire}[${reSelect}] >> ${cordic[idx].shift}) : ${p.t[0].wire}[${imSelect}]+(${p.i[0].wire}[${reSelect}] >> ${cordic[idx].shift});

`;
            }
        }
    };

    const g = reqack.circuit();

    const tNode = g('angle');
    const lutNode = g('nco_lut');

    tNode({width: dataWidth, capacity: 1})(lutNode);

    const n2 = range(nCordics).reduce((prev) => {
        const n = g('nco_cordic');
        prev({width: dataWidth, capacity: 1})(n);
        return n;
    }, lutNode);

    n2({width: dataWidth, capacity: 1})(g());

    const verilog = '// ' + JSON.stringify(config) + '\n' + reqack.verilog(g, macros);

    ncoLutStringArray(lut);
     console.log(verilog);

    return verilog;

};
