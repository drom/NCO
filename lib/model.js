'use strict';

const lutGen = require('./lut.js');
const cordicGen = require('./cordic.js');

// fixed-point NCO model
module.exports = function (config) {
    const addrWidth = config.addrWidth >>> 0;
    const dataWidth = config.dataWidth >>> 0;
    const betaWidth = config.betaWidth >>> 0;

    // float to fixed point
    const dataScale = (1 << dataWidth);

    const lut = lutGen(config);

    // console.log(lut.map(e => e.re.toString(16) + ' +j ' + e.im.toString(16)).join('\n'));

    // const betaRange = 2 * Math.PI / 8 / lutSize;
    // const startShift = -Math.log2(Math.tan(betaRange));
    // console.log('beta=' + betaRange, 'tan=' + startShift);

    const phaseOffset = 32 - 3;
    const phaseMask = 0x7;

    const addrOffset = phaseOffset - addrWidth;
    const addrMask = (1 << addrWidth) - 1;

    const betaOffset = 32 - 3 - addrWidth - betaWidth;
    const betaMask = (1 << betaWidth) - 1;

    // console.log(betaOffset, betaMask.toString(16));

    const cordics = cordicGen(config);

    // console.log(cordics.map(e => 's:' + e.sigma.toString(16) + ' >>:' + e.shift).join('\n'));

    return function (angle) {
        angle = angle >>> 0;

        // phase <3bit>, addr <addrWidth>, beta<rest>

        const rawAddr = (angle >>> addrOffset) & addrMask;
        const phase = (angle >>> phaseOffset) & phaseMask;
        const addr = (phase & 1) ? rawAddr ^ addrMask : rawAddr;

        let val = Object.assign({}, lut[addr]);
        if (((phase & 1) ^ ((phase >> 1) & 1))) { // swap
            val = {re: val.im, im: val.re};
        }
        if ((((phase >> 2) & 1) ^ ((phase >> 1) & 1))) {
            val.re = val.re ^ 0xffffffff;
        }
        if (((phase >> 2) & 1)) {
            val.im = val.im ^ 0xffffffff;
        }

        // beta<> , val<I,Q>

        /*
                ^ 0x8000        ^ 0x7fff
    0   000     100     -4      011     3
    1   001     101     -3      010     2
    2   010     110     -2      001     1
    3   011     111     -1      000     0
    4   100     000     0       111     -1
    5   101     001     1       110     -2
    6   110     010     2       101     -3
    7   111     011     3       100     -4
        */


        // let beta = ((1 << (betaWidth - 1)) - ((angle >> betaOffset) & betaMask));

        let beta = ((1 << (betaWidth - 1)) - ((angle >> betaOffset) & betaMask));

        // console.log(beta.toString(16), val.re, val.im, ' START');

        // const betaDeg = 360 * beta / (1 << (betaWidth + addrWidth + 3));
        // const b1 = Math.atan2(val.im, val.re);

        cordics.map(p => {
            if (beta > 0) {
                beta = beta - p.sigma;
                const re = val.re + (val.im >> p.shift);
                val.im   = val.im - (val.re >> p.shift);
                val.re   = re;
            } else {
                beta = beta + p.sigma;
                const re = val.re - (val.im >> p.shift);
                val.im   = val.im + (val.re >> p.shift);
                val.re   = re;
            }
            // console.log(beta.toString(16), val.re, val.im);
        });

        // const b2 = Math.atan2(val.im, val.re);
        // const b2b1 = 180 * (b2 - b1) / Math.PI;
        // console.log(b2b1 / betaDeg);

        return {
            re: val.re / dataScale,
            im: val.im / dataScale
        };
    };
};
