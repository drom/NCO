'use strict';

const range = require('lodash.range');

// fixed-point NCO model
module.exports = function (addrWidth, dataWidth, nCordics) {
    addrWidth = addrWidth >>> 0;
    const lutSize = Math.pow(2, addrWidth);
    const dataScale = (1 << dataWidth);
    const extraScale = ((1 / Math.cos(Math.PI / 8 / lutSize) - 1) * 0.5 + 1);
    // console.log(extraScale);

    // SIN-COS Look-Up table
    const lut = Array(lutSize)
        .fill(0)
        .map((e, i) => Math.PI * ((i + 0.5) / lutSize / 4))
        .map(phi => ({
            // re: (dataScale * Math.cos(phi)) | 0,
            // im: (dataScale * Math.sin(phi)) | 0
            re: Math.round(dataScale * extraScale * Math.cos(phi)) | 0,
            im: Math.round(dataScale * extraScale * Math.sin(phi)) | 0
        }));

    // console.log(lut);
    // const betaRange = 2 * Math.PI / 8 / lutSize;
    // const startShift = -Math.log2(Math.tan(betaRange));
    // console.log('beta=' + betaRange, 'tan=' + startShift);

    const addrOffset = 32 - 3 - addrWidth;
    const addrMask = (1 << addrWidth) - 1;
    const phaseOffset = 32 - 3;
    const phaseMask = 0x7;

    const betaMask = (1 << addrOffset) - 1;
    const betaOffset = addrWidth + 3;
    console.log(betaOffset);

    const cordics = range(nCordics).map(i => ({
        // sigma: Math.atan(1 / (1 << (i + addrWidth))),
        sigma: (Math.atan(1 / (1 << (i + addrWidth + 2))) * 64 * (1 << (33 - addrWidth)) ),
        shift: i + addrWidth + 2
    }));

    console.log(cordics);


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

        let beta = (((angle & betaMask) >>> 0) << betaOffset) |0;
        // console.log(beta);
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
            // console.log(beta, '--');
        });

        return {
            re: val.re / dataScale,
            im: val.im / dataScale
        };
    };
};
