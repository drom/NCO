'use strict';

const range = require('lodash.range');

// fixed-point NCO model
module.exports = function (addrWidth, dataWidth, nCordics) {
    addrWidth = addrWidth >>> 0;
    const dataScale = 1 << dataWidth;

    // SIN-COS Look-Up table
    const lutSize = Math.pow(2, addrWidth);
    const lut = Array(lutSize)
        .fill(0)
        .map((e, i) => Math.PI * ((i + 0.5) / lutSize / 4))
        .map(phi => ({
            re: (dataScale * Math.cos(phi)) | 0,
            im: (dataScale * Math.sin(phi)) | 0
            // re: Math.round(dataScale * Math.cos(phi)) | 0,
            // im: Math.round(dataScale * Math.sin(phi)) | 0
        }));

    // const betaRange = 2 * Math.PI / 8 / lutSize;
    // const startShift = -Math.log2(Math.tan(betaRange));
    // console.log('beta=' + betaRange, 'tan=' + startShift);

    const addrOffset = 32 - 3 - addrWidth;
    const addrMask = (1 << addrWidth) - 1;
    const phaseOffset = 32 - 3;
    const phaseMask = 0x7;

    const betaMask = (1 << addrOffset) - 1;
    // console.log(betaMask);

    const cordics = range(nCordics).map(i => ({
        // sigma: Math.atan(1 / (1 << (i + addrWidth))),
        sigma: (Math.atan(1 / (1 << (i + addrWidth))) * (1 << addrOffset)) | 0,
        shift: i + addrWidth
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

        const beta = angle & betaMask;

        cordics.map(p => {

        });

        return {
            re: val.re / dataScale,
            im: val.im / dataScale
        };
    };
};
