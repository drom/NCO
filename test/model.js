'use strict';

const genModel = require('../lib/model');
const onml = require('onml');
const fs = require('fs-extra');
const range = require('lodash.range');

const hsl = idx => 'hsl(' + (idx * 77) % 360 + ', 100%, 40%)';

const boxChart = (props) => {
    const w = 1024;
    const h = 1024;
    return ['svg', {
        xmlns: 'http://www.w3.org/2000/svg',
        width: w + 1,
        height: h + 1,
        viewBox: [0, 0, w + 1, h + 1].join(' ')
    },
    ['g', {transform: 'translate(.5, .5)'}].concat([
        ['rect', {
            x: 0, y: 0, width: w, height: h,
            fill: 'none', stroke: 'black'
        }],
        ['g', {'stroke-dasharray': '2,6'}].concat(range(32).map(i => ['line', {
            stroke: '#aaa',
            x1: 0, x2: w,
            y1: 32 * i, y2: 32 * i
        }])),
        ['g', {'stroke-dasharray': '2,6'}].concat(range(32).map(i => ['line', {
            stroke: '#aaa',
            x1: 32 * i, x2: 32 * i,
            y1: 0, y2: h
        }])),
        ['g', {}].concat(props.data.map((e, i) => ['rect', {
            fill: 'none', stroke: hsl(i),
            x: e.re.min + w / 2,
            width: e.re.max - e.re.min,
            y: e.im.min + h / 2,
            height: e.im.max - e.im.min
        }]))
    ])
    ];
};


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

const dbrange = 512;

const scaler = val => {
    const tmp = Math.log2(val);
    if (tmp === -Infinity) {
        return -dbrange;
    }
    return 16 * tmp;
};

const boxErr = arr => {
    const box = {
        re: {min: 0, max: 0},
        im: {min: 0, max: 0}
    };
    arr.map(e => {
        if (e.re > box.re.max) { box.re.max = e.re; }
        if (e.re < box.re.min) { box.re.min = e.re; }
        if (e.im > box.im.max) { box.im.max = e.im; }
        if (e.im < box.im.min) { box.im.min = e.im; }
    });
    // return box;
    return {
        re: {min: -dbrange - scaler(-box.re.min), max: dbrange + scaler(box.re.max)},
        im: {min: -dbrange - scaler(-box.im.min), max: dbrange + scaler(box.im.max)}
    };
};

const randomPhase = () => (Math.random() * (1 << 31)) >>> 0;

describe('Model', () => {
    it('lut', () => {
        let ret = [];
        [
            [1, 0],
            [2, 0],
            [3, 0],
            [4, 0],
            [5, 0],
            [6, 0],
            // [7, 0]
            // [8, 0],
            // [9, 0],
            // [10, 0],
            // [11, 0],
            // [12, 0],
            // [13, 0],
            // [14, 0]
            [6, 1],
            [6, 2],
            [6, 3],
            [6, 4]
            // [9, 0],
            // [10, 0],
            // [11, 0]
        ].map(props => {
            const addrSize = props[0];
            const nCordics = props[1];
            const model = genModel(addrSize, 16, nCordics);
            const errors = Array(1000).fill(0).map((e, i) => {
                const phase = randomPhase();
                // const phase = (i << (32 - 3 - 2) >>> 0);
                const res = model(phase);
                const ref = exp(phase);
                // return errMag(ref, res);
                return errVectorRot(ref, res);
            });
            ret.push(boxErr(errors));
            // done();
        });
        // console.log(ret);
        // console.log(boxChart({data: ret}));
        fs.outputFile('./box-chart.svg', onml.s(boxChart({data: ret})), () => {});
    });
});
