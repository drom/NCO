'use strict';

const range = require('lodash.range');

module.exports = function (addrWidth, dataWidth, nCordics, corrector, scale) {
    addrWidth = addrWidth >>> 0;
    scale = scale || 1;

    const lutSize = Math.pow(2, addrWidth);

    // float to fixed point
    const dataScale = (1 << dataWidth);

    // circle approximation error correction
    const extraScale = ((1 / Math.cos(Math.PI / 8 / lutSize) - 1) * 0.5 + 1);

    // compensate for cordic scale
    const cordicScale = scale / range(nCordics)
        .map(i => {
            const shift = i + addrWidth + 2 + corrector;
            const sigma = Math.atan(1 / (1 << shift));
            return 1 / Math.cos(sigma);
        })
        .reduce((prev, cur) => (prev * cur), 1);

    // SIN-COS Look-Up table
    const lut = Array(lutSize)
        .fill(0)
        .map((e, i) => Math.PI * ((i + 0.5) / lutSize / 4))
        .map(phi => ({
            re: (dataScale * cordicScale * extraScale * Math.cos(phi)) | 0,
            im: (dataScale * cordicScale * extraScale * Math.sin(phi)) | 0
        }));
    return lut;
};
