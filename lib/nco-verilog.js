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
            data: p =>
                p.i.map(lhs => `
// Here is my Look Up data for ${addrWidth} address bits
/*
${JSON.stringify(lut, null, 4)}
*/
`
            )
        },
        'nco_cordic': {
            data: p =>
                p.i.map(lhs => `
// CORDIC {p.id}
/*
${JSON.stringify(cordics[p.id - 2], null, 4)}
*/

`
            )
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

    console.log(verilog);

    return verilog;

};
