'use strict';

const genTable = require('./table.js');
const model = require('./model.js');

function getRanges (data) {
    return data.reduce((res, datum) => ({
        re: {
            min: Math.min(res.re.min, datum.re),
            max: Math.max(res.re.max, datum.re)
        },
        im: {
            min: Math.min(res.im.min, datum.im),
            max: Math.max(res.im.max, datum.im)
        }
    }), {
        re: {min: 0, max: 0},
        im: {min: 0, max: 0}
    });
}

function genScatter ($) {
    return function Scatter (props) {
        return $('g', {className: 'dot'},
            props.data.map((datum, index) =>
                $('circle', {key: index, cx: datum.re, cy: datum.im, r: 8}))
        );
    };
}

module.exports = {
    genScatter: genScatter,
    getRanges: getRanges,
    genTable: genTable,
    model: model
};
