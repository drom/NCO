'use strict';

const range = require('lodash.range');

module.exports = function (addrWidth, dataWidth, nCordics, corrector) {
    addrWidth = addrWidth >>> 0;

    const betaOffset = addrWidth + 3; // offset from the left

    const cordics = range(nCordics).map(i => {
        const shift = i + addrWidth + 2 + corrector;
        const scale = Math.pow(2, betaOffset + 29 + corrector);
        return {
            sigma: Math.round(scale * Math.atan(1 / (1 << shift))),
            shift: shift
        };
    });

    return cordics;

};
