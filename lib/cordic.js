'use strict';

const range = require('lodash.range');

module.exports = function (config) {
    const addrWidth = config.addrWidth >>> 0;
    const nCordics = config.nCordics >>> 0;
    const corrector = config.corrector >>> 0;
    const betaWidth = config.betaWidth >>> 0;

    // const betaOffset = 32 - 3 + addrWidth + betaWidth;

    const cordics = range(nCordics).map(i => {
        const shift = i + addrWidth + 2 + corrector;
        const scale = Math.pow(2, betaWidth + addrWidth);
        return {
            sigma: Math.round(scale * Math.atan(1 / (1 << shift))),
            shift: shift
        };
    });

    return cordics;

};
