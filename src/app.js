'use strict';

const lib = require('../lib/');
const range = require('lodash.range');
const React = require('react');
const ReactDOM = require('react-dom');
const withParentSize = require('@vx/responsive').withParentSize;

const table = lib.genTable(64, 2);

const data = range(100)
    .map(() => 1000 * Math.random())
    .map(phi => {
        const dut = table(phi);
        const err = {
            re: Math.cos(phi) - dut.re,
            im: Math.sin(phi) - dut.im
        };
        return {
            re:  err.re * Math.cos(phi) + err.im * Math.sin(phi),
            im: -err.re * Math.sin(phi) + err.im * Math.cos(phi)
        };
    })
    .map(datum => ({
        re: 500 * datum.re,
        im: 500 * datum.im
    }))
    ;

    // .map(() => ({
    //     re: 100 * (Math.random() + Math.random() + Math.random() - 1.5),
    //     im: 100 * (Math.random() + Math.random() + Math.random() - 1.5)
    // }));

const ranges = lib.getRanges(data);

console.log(ranges);

const $ = React.createElement;

const Scatter = lib.genScatter($);

// grid -> Grid
// axis -> Axis


// const margin = { bottom: 40, top: 40, left: 40, right: 40 };

const Demo1 = (config) => {
    const size = Math.ceil(Math.min(config.parentWidth, config.parentHeight));
    // const r = (size - margin.left - margin.right) / 2;

    return (
        $('svg', {width: size, height: size},
            $('defs', {},
                $('style', {}, `
.dot { stroke: none; fill: hsl(120, 0%, 50%, 20%); stroke-linecap: round; }
`
                )
            ),
            $('rect', {
                x: 0, y: 0,
                width: size, height: size,
                fill: '#fffad9',
                rx: 8
            }),
            $('g', {transform: `translate(${ size / 2 },${ size / 2 })`},
                $(Scatter, {data: data})
            )
        )
    );
};

const Demo = withParentSize(Demo1);

ReactDOM.render($(Demo, {}), document.getElementById('root'));
