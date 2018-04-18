'use strict';

const range = require('lodash.range');

// fixed-point NCO model
module.exports = function (addrWidth, dataWidth, nCordics) {
    addrWidth = addrWidth >>> 0;

    const corrector = 2;

    const lutSize = Math.pow(2, addrWidth);
    const dataScale = (1 << dataWidth);
    const extraScale = ((1 / Math.cos(Math.PI / 8 / lutSize) - 1) * 0.5 + 1);
    const cordicScale = 1 / range(nCordics)
        .map(i => 1 / Math.cos(Math.atan(1.35 / (1 << (i + addrWidth + corrector)))))
        .reduce((prev, cur) => (prev * cur), 1);

    // SIN-COS Look-Up table
    const lut = Array(lutSize)
        .fill(0)
        .map((e, i) => Math.PI * ((i + 0.5) / lutSize / 4))
        .map(phi => ({
            re: Math.round(dataScale * cordicScale * extraScale * Math.cos(phi)) | 0,
            im: Math.round(dataScale * cordicScale * extraScale * Math.sin(phi)) | 0
        }));

    // console.log(lut);
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

    const cordics = range(nCordics).map(i => ({
        // sigma: Math.atan(1 / (1 << (i + addrWidth))),
        // sigma: (Math.atan(1 / (1 << (i + addrWidth + 2))) * 32 * (1 << (33 - addrWidth)) << betaOffset) >>>0,
        sigma: Math.round(Math.atan(1 / (1 << (i + addrWidth + corrector))) * Math.pow(2, betaOffset + 27 + corrector)),
        shift: i + addrWidth + corrector
    }));

    // console.log(cordics);

    return function (angle) {
        angle = angle >>> 0;
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
