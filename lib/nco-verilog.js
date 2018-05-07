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
	arr.push(`ncolut[${i}]={16'd${lut[i]['re']},16'd${lut[i]['im']}};`);
    }
    return arr.join('\n');
}

module.exports = config => {

    const angleWidth=32;
    const dataWidth = config.dataWidth;
    const addrWidth = config.addrWidth;
    const betaWidth = angleWidth-3-config.addrWidth;
    const nCordics = config.nCordics;

    const lut = lutGen(config);
    const cordics = cordicGen(config);


    const reSelect = `${dataWidth*2-1}:${dataWidth}`;
    const imSelect = `${dataWidth-1}:0`;
    const addrSelect = `${angleWidth-3-1}:${angleWidth-3-addrWidth}`;
    const betaSelect = `${angleWidth-3-1-addrWidth}:0`;
    const phaseSelect = `${angleWidth-1}:${angleWidth-3}`;
    const lutString = ncoLutStringArray(lut);
    const macros = {
        'nco_lut': {
            data: p => {
                const pre = 'node' + p.id + '_';
                return `
// Look-Up stage
/*
{JSON.stringify(lut, null, 4)}
*/

reg [${2*dataWidth-1}:0] ncolut[0:${Math.pow(2,addrWidth)-1}];

initial begin
${lutString}
end

wire [${angleWidth-1}:0] ${pre}angle;
wire [2:0] ${pre}phase;
wire [${addrWidth - 1}:0] ${pre}addr;
wire [${dataWidth - 1}:0] ${pre}reSwap;
wire [${dataWidth - 1}:0] ${pre}imSwap;


assign ${pre}angle = ${p.t[0].wire};
assign ${pre}phase = ${pre}angle[${phaseSelect}]; //3 bit phase
assign ${pre}addr = ${pre}phase[0]?~${pre}angle[${addrSelect}]:${pre}angle[${addrSelect}];
//re = ${reSelect}  im = ${imSelect}
assign ${pre}reSwap = ${pre}phase[0]^${pre}phase[1]?ncolut[${pre}addr][${imSelect}]:ncolut[${pre}addr][${reSelect}];
assign ${pre}imSwap = ${pre}phase[0]^${pre}phase[1]?ncolut[${pre}addr][${reSelect}]:ncolut[${pre}addr][${imSelect}];

assign ${p.i[0].wire}[${reSelect}] = ${pre}phase[2]^${pre}phase[1]?~${pre}reSwap:${pre}reSwap;
assign ${p.i[0].wire}[${imSelect}] = ${pre}phase[2]?~${pre}imSwap:${pre}imSwap;
assign ${p.i[0].wire}[${dataWidth*2+betaWidth-1}:${dataWidth*2}] = ${pre}angle[${betaWidth-1}:0];
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

assign  beta${idx} = ${p.t[0].wire}[${betaSelect}];

assign beta_calc${idx} = beta${idx}[${betaWidth-1}]?beta${idx}-${cordics[idx].sigma}:beta${idx}+${cordics[idx].sigma};
assign ${p.i[0].wire}[${reSelect}] = beta${idx}[${betaWidth-1}]?${p.t[0].wire}[${reSelect}]+(${p.t[0].wire}[${imSelect}] >> ${cordics[idx].shift}) : ${p.t[0].wire}[${reSelect}]-(${p.t[0].wire}[${imSelect}] >> ${cordics[idx].shift});
assign ${p.i[0].wire}[${imSelect}] = beta${idx}[${betaWidth-1}]?${p.t[0].wire}[${imSelect}]-(${p.t[0].wire}[${reSelect}] >> ${cordics[idx].shift}) : ${p.t[0].wire}[${imSelect}]+(${p.t[0].wire}[${reSelect}] >> ${cordics[idx].shift});
assign ${p.i[0].wire}[${dataWidth*2+betaWidth-1}:${dataWidth*2}] = beta_calc${idx};

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
        prev({width: angleWidth + 2*dataWidth, capacity: 1})(n);
        return n;
    }, lutNode);

    n2({width: angleWidth + 2*dataWidth, capacity: 1})(g('nco'));

    const verilog = '// ' + JSON.stringify(config) + '\n' + reqack.verilog(g, macros);

    ncoLutStringArray(lut);
     console.log(verilog);

    return verilog;

};
