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
                    $('line', {stroke: '#aaa', x1: 0, x2: w, y1: 32 * 16, y2: 32 * 16}),
                    $('g', {'strokeDasharray': '2,6'},
                        range(32).map(i => $('line', {
                            key: i,
                            stroke: '#aaa',
                            x1: 32 * i, x2: 32 * i,
                            y1: 0, y2: h
                        }))
                    ),
                    $('line', {stroke: '#aaa', x1: 32 * 16, x2: 32 * 16, y1: 0, y2: h}),
                    $('line', {stroke: '#aaa', x1: 0, x2: w, y1: 0, y2: 32 * 32}),
                    $('line', {stroke: '#aaa', x1: 0, x2: w, y1: 32 * 32, y2: 0}),
                    $('g', {transform: 'translate(512,512)'}, props.data.map((contours, i) =>
                        $('g', {key: i}, contours.map((contour, j) =>
                            $('path', {
                                key: j,
                                fill: 'none',
                                stroke: hsl(i),
                                d: 'M' + contour.map(e => e[0] + ' ' + e[1]).join('L') + 'Z'
                            })
                        ))
                    )),
                    $('g', {transform: 'translate(512,5)', textAnchor: 'middle'},
                        [0, -1, -2, -3, -4, -5, -6, -7, -8, -7, -6, -5, -4, -3, -2, -1, 0]
                            .map(i => 24 * i)
                            .map((e, i) => $('text', {key: i, y: 64 * i}, e))
                    ),
                    $('g', {transform: 'translate(0,517)', textAnchor: 'middle'},
                        [0, -1, -2, -3, -4, -5, -6, -7, -8, -7, -6, -5, -4, -3, -2, -1, 0]
                            .map(i => 24 * i)
                            .map((e, i) => $('text', {key: i, x: 64 * i}, e))
                    )
                ))
            );
        };
    };
};
