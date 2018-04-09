'use strict';

// fixed-point NCO model
module.exports = function (addrWidth) {
    addrWidth = addrWidth >>> 0;
    const lutSize = Math.pow(2, addrWidth);
    const lut = Array(lutSize)
        .fill(0)
        .map((e, i) => Math.PI * ((i + 0.5) / lutSize / 4))
        .map(phi => ({re: Math.cos(phi), im: Math.sin(phi)}));
    // console.log(lut);

    const addrOffset = 32 - 3 - addrWidth;
    const addrMask = (1 << addrWidth) - 1;
    const phaseOffset = 32 - 3;
    const phaseMask = 0x7;

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
        return val;
    };
};
