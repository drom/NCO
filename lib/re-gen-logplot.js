'use strict';

const range = require('lodash.range');

const hsl = idx => 'hsl(' + (idx * 77) % 360 + ', 100%, 40%)';

module.exports = React => {
    const $ = React.createElement;
    return () => {
        return props => {
            const w = 1024;
            const h = 1024;
            return $('span', {},
                $('svg', {
                    xmlns: 'http://www.w3.org/2000/svg',
                    width: w + 1,
                    height: h + 1,
                    viewBox: [0, 0, w + 1, h + 1].join(' ')
                },
                $('g', {transform: 'translate(.5, .5)'},
                    $('rect', {
                        x: 0, y: 0, width: w, height: h,
                        fill: 'none', stroke: 'black'
                    }),
                    $('g', {'strokeDasharray': '2,6'},
                        range(31, 0).map(i => $('line', {
                            key: i,
                            stroke: '#aaa',
                            x1: 0, x2: w,
                            y1: 32 * i, y2: 32 * i
                        }))
                    ),
                    $('g', {'strokeDasharray': '2,6'},
                        range(32).map(i => $('line', {
                            key: i,
                            stroke: '#aaa',
                            x1: 32 * i, x2: 32 * i,
                            y1: 0, y2: h
                        }))
                    ),
                    $('text', {
                        x: w / 2,
                        y: 20,
                        textAnchor: 'middle'
                    }, 'Error vector magnitude EVM '),
                    $('path', {
                        fill: 'none',
                        stroke: '#000',
                        d: 'M' + props.data.map((val, idx) =>
                            (idx * 32 + 32) + ' ' + (-val * 16)
                        ).join('L')
                    }),
                    props.data.map((val, idx) =>
                        $('circle', {
                            cx: (idx * 32 + 32),
                            cy: (-val * 16),
                            r: 4,
                            fill: hsl(idx)
                        })
                    )
                ))
            );
        };
    };
};
