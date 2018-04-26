'use strict';

const range = require('lodash.range');

module.exports = function (addrWidth, dataWidth, nCordics, corrector) {
    addrWidth = addrWidth >>> 0;

    const lutSize = Math.pow(2, addrWidth);

    // float to fixed point
    const dataScale = (1 << dataWidth);

    // circle approximation error correction
    const extraScale = ((1 / Math.cos(Math.PI / 8 / lutSize) - 1) * 0.5 + 1);

    // compensate for cordic scale
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
    return lut;
};
