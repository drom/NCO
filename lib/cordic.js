'use strict';

const range = require('lodash.range');

module.exports = function (addrWidth, dataWidth, nCordics, corrector) {
    addrWidth = addrWidth >>> 0;

    const betaOffset = addrWidth + 3; // offset from the left

    const cordics = range(nCordics).map(i => ({
        // sigma: Math.atan(1 / (1 << (i + addrWidth))),
        // sigma: (Math.atan(1 / (1 << (i + addrWidth + 2))) * 32 * (1 << (33 - addrWidth)) << betaOffset) >>>0,
        sigma: Math.round(Math.atan(1 / (1 << (i + addrWidth + corrector))) * Math.pow(2, betaOffset + 27 + corrector)),
        shift: i + addrWidth + corrector
    }));

    return cordics;

};
