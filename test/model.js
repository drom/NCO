'use strict';

const genModel = require('../lib/model');
const onml = require('onml');
const fs = require('fs-extra');
const range = require('lodash.range');
const d3Polygon = require('d3-polygon');
const concaveHull = require('d3-geom-concavehull/src/concaveHull');

// console.log(d3Contour.contours);

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

const hullChart = (props) => {
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
        ['g', {'stroke-dasharray': '2,6'}].concat(range(31, 0).map(i => ['line', {
            stroke: '#aaa',
            x1: 0, x2: w,
            y1: 32 * i, y2: 32 * i
        }])),
        ['line', {stroke: '#aaa', x1: 0, x2: w, y1: 32 * 16, y2: 32 * 16}],

        ['g', {'stroke-dasharray': '2,6'}].concat(range(32).map(i => ['line', {
            stroke: '#aaa',
            x1: 32 * i, x2: 32 * i,
            y1: 0, y2: h
        }])),
        ['line', {stroke: '#aaa', x1: 32 * 16, x2: 32 * 16, y1: 0, y2: h}],

        ['line', {stroke: '#aaa', x1: 0, x2: w, y1: 0, y2: 32 * 32}],
        ['line', {stroke: '#aaa', x1: 0, x2: w, y1: 32 * 32, y2: 0}],

        ['g', {transform: 'translate(512,512)'}].concat(props.data.map((contours, i) =>
            ['g', {}].concat(contours.map((contour) =>
                ['path', {fill: 'none', stroke: hsl(i), d: 'M' + contour.map(e => e[0] + ' ' + e[1]).join('L') + 'Z'}]
            ))
        ))
        // ['g', {}].concat(props.data.map((e, i) => ['rect', {
        //     fill: 'none', stroke: hsl(i),
        //     x: e.re.min + w / 2,
        //     width: e.re.max - e.re.min,
        //     y: e.im.min + h / 2,
        //     height: e.im.max - e.im.min
        // }]))
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
    re:  (res.re * ref.re + res.im * ref.im) - 1,
    im: -res.im * ref.re + res.re * ref.im
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

const scaler1 = val => (val > 0) ? (dbrange + scaler(val)) : (-dbrange - scaler(-val));

// const scaler1 = val => (1 << 13) * val;

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
    return {
        re: {min: -dbrange - scaler(-box.re.min), max: dbrange + scaler(box.re.max)},
        im: {min: -dbrange - scaler(-box.im.min), max: dbrange + scaler(box.im.max)}
    };
};

const hullErr = arr => {
    // const cont = concaveHull()(arr.map(e => [e.re, e.im]));

    // const cont = concaveHull().distance(100)(arr.map(e => [e.re, e.im]));
    // const cont1 = cont.map(contour => contour.map(e => [scaler1(e[0]), scaler1(e[1])]));

    const cont = d3Polygon.polygonHull(arr.map(e => [e.re, e.im]));
    const cont1 = [cont.map(e => [scaler1(e[0]), scaler1(e[1])])];

    // console.log(cont1);


    return cont1;
};

const randomPhase = () => (Math.random() * (1 << 31)) >>> 0;

describe('Model', () => {
    it('lut', () => {
        let ret = [];
        [
            [1,  0], //[1,  1], [1,  2], [1,  3], [1,  4], [1,  5]
            [2,  0], // [2,  1], [2,  2], [2,  3], // [2,  4], [2,  5]
            [3,  0], [3,  1], [3,  2], [3,  3], [3,  4], [3,  5]
            // [4,  0], //[4,  1], [4,  2], [4,  3], [4,  4], [4,  5]
            // [5,  0], //[5,  1], [5,  2], [5,  3], [5,  4], [5,  5]
            // [6,  0], //[6,  1], [6,  2], [6,  3], [6,  4], [6,  5]
            // [7,  0], //[7,  1], [7,  2], [7,  3], [7,  4], [7,  5]
            // [8,  0], //[8,  1], [8,  2], [8,  3], [8,  4], [8,  5]
            // [9,  0], [9,  1], [9,  2], [9,  3], [9,  4], [9,  5]
            // [10, 0], [10, 1], [10, 2], [10, 3], [10, 4], [10, 5]
            // [11, 0], [11, 1], [11, 2], [11, 3], [11, 4], [11, 5]
            // [12, 0], [12, 1], [12, 2], [12, 3], [12, 4], [12, 5]
            // [13, 0], [13, 1], [13, 2], [13, 3], [13, 4], [13, 5]
        ].map(props => {
            const addrSize = props[0];
            const nCordics = props[1];
            const model = genModel(addrSize, 30, nCordics);
            const errors = Array(200).fill(0).map((e, i) => {
                const phase = randomPhase();
                // const phase = (i << (32 - 3 - 2) >>> 0);
                const res = model(phase);
                const ref = exp(phase);
                // return errMag(ref, res);
                return errVectorRot(ref, res);
            });
            // ret.push(boxErr(errors));
            ret.push(hullErr(errors));
            // done();
        });
        // console.log(ret);
        // console.log(boxChart({data: ret}));
        // fs.outputFile('./box-chart.svg', onml.s(boxChart({data: ret})), () => {});
        fs.outputFile('./box-chart.svg', onml.s(hullChart({data: ret})), () => {});
    });
});
