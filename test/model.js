'use strict';

const genModel = require('../lib/model');

const exp = phase => {
    const phi = Math.PI * (phase / ((1 << 31) >>> 0));
    return {
        re: Math.cos(phi),
        im: Math.sin(phi)
    };
};

const errVectorRot = (ref, res) => ({
    re:  1 - (res.re * ref.re + res.im * ref.im),
    im: -res.re * ref.im + res.im * ref.re
});

const errVector = (ref, res) => ({
    re:  ref.re - res.re,
    im:  ref.im - res.im
});

const cplxMag = cplx => Math.sqrt(Math.pow(cplx.re, 2) + Math.pow(cplx.im, 2));

const averageErr = arr => arr.reduce((prev, cur) => prev + cur, 0) / arr.length;

const averageMagErr = arr => averageErr(arr.map(cplxMag));

const randomPhase = () => (Math.random() * (1 << 31)) >>> 0;

describe('Model', () => {
    [2, 3, 4, 5, 6, 7, 8].map(addrSize => {
        it('lut' + addrSize, done => {
            const model = genModel(addrSize);
            const errors = Array(1000).fill(0).map((e, i) => {
                const phase = randomPhase();
                // const phase = (i << (32 - 3 - 2) >>> 0);
                const res = model(phase);
                const ref = exp(phase);
                // return errMag(ref, res);
                return errVectorRot(ref, res);
            });
            console.log(averageMagErr(errors));
            done();
        });
    });
});
