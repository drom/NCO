'use strict';

const range = require('lodash.range');
const d3Polygon = require('d3-polygon');
const genModel = require('./model');

const dbrange = 512;

const randomPhase = () => (Math.random() * (1 << 31)) >>> 0;

const exp = phase => {
    const phi = Math.PI * (phase / ((1 << 31) >>> 0));
    return {
        re: Math.cos(phi),
        im: Math.sin(phi)
    };
};

const errVectorRot = (ref, res) => ({
    re:  (res.re * ref.re + res.im * ref.im) - 1,
    im: -res.im * ref.re + res.re * ref.im
});

const scaler = val => {
    const tmp = Math.log2(val);
    if (tmp === -Infinity) {
        return -dbrange;
    }
    return 16 * tmp;
};

const scaler1 = val => (val > 0) ? (dbrange + scaler(val)) : (-dbrange - scaler(-val));

const hullErr = arr => {
    const cont = d3Polygon.polygonHull(arr.map(e => [e.re, e.im]));
    const cont1 = [cont.map(e => [scaler1(e[0]), scaler1(e[1])])];
    return cont1;
};

module.exports = config => {
    // create chain of designs
    const addrWidth = config.addrWidth;
    const dataWidth = config.dataWidth;

    const designs = range(addrWidth).map(i => ({
        addrWidth: i + 1,
        nCordics: 0
    }))
        .concat(range(config.nCordics).map(i => ({
            addrWidth: addrWidth,
            nCordics: i + 1
        })));

    // console.log(designs);

    const results = designs.map(design => {
        const model = genModel(design.addrWidth, dataWidth, design.nCordics, config.corrector);
        const errors = Array(5000).fill(0).map(() => {
            const phase = randomPhase();
            // const phase = (i << (32 - 3 - 2) >>> 0);
            const res = model(phase);
            const ref = exp(phase);
            // return errMag(ref, res);
            return errVectorRot(ref, res);
        });
        return hullErr(errors);
    });

    return results;
};
