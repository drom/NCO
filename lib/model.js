'use strict';

const lutGen = require('./lut');
const cordicGen = require('./cordic');

// fixed-point NCO model
module.exports = function (addrWidth, dataWidth, nCordics, corrector) {
    addrWidth = addrWidth >>> 0;

    // float to fixed point
    const dataScale = (1 << dataWidth);

    const lut = lutGen(addrWidth, dataWidth, nCordics, corrector);

    console.log(lut.map(e => e.re.toString(16) + ' +j ' + e.im.toString(16)).join('\n'));

    // const betaRange = 2 * Math.PI / 8 / lutSize;
    // const startShift = -Math.log2(Math.tan(betaRange));
    // console.log('beta=' + betaRange, 'tan=' + startShift);

    const phaseOffset = 32 - 3;
    const phaseMask = 0x7;

    const addrOffset = phaseOffset - addrWidth;
    const addrMask = (1 << addrWidth) - 1;

    const betaOffset = addrWidth + 3; // offset from the left
    const betaMask = (1 << addrOffset) - 1;

    // console.log(betaOffset);

    const cordics = cordicGen(addrWidth, dataWidth, nCordics, corrector);

    console.log(cordics.map(e => 's:' + e.sigma.toString(16) + ' >>:' + e.shift).join('\n'));

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
            val.re = -val.re;
        }
        if (((phase >> 2) & 1)) {
            val.im = -val.im;
        }

        // beta<> , val<I,Q>


        // let beta = ((angle & betaMask) << betaOffset) ^ 0x7fffffff;
        // cordics.map(p => {
        //     if (beta > 0) {
        //         beta = beta - p.sigma;
        //         const re = val.re + (val.im >> p.shift);
        //         val.im   = val.im - (val.re >> p.shift);
        //         val.re   = re;
        //     } else {
        //         beta = beta + p.sigma;
        //         const re = val.re - (val.im >> p.shift);
        //         val.im   = val.im + (val.re >> p.shift);
        //         val.re   = re;
        //     }
        //     // console.log(beta, p.sigma, val.re, val.im);
        // });

        let beta = ((angle & betaMask) << betaOffset) ^ 0x80000000;
        cordics.map(p => {
            if (beta > 0) {
                beta = beta - p.sigma;
                const re = val.re - (val.im >> p.shift);
                val.im   = val.im + (val.re >> p.shift);
                val.re   = re;
            } else {
                beta = beta + p.sigma;
                const re = val.re + (val.im >> p.shift);
                val.im   = val.im - (val.re >> p.shift);
                val.re   = re;
            }
        });
        // console.log(beta);

        return {
            re: val.re / dataScale,
            im: val.im / dataScale
        };
    };
};
