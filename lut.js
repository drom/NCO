#!/usr/bin/env node
'use strict';

const range = length => Array.apply(null, Array(length)).map((e, i) => i);

// calculate complex exponent look-up table

const points = 16;

// pi/4 part of data
const step = Math.PI / 4 / points;

// initial gain need to be adjusted depend on number CORDIC steps
const gain = 1 << 14;

const digits = 5;

const val2hex = val =>
    ('000000000' + Math.round(gain * val).toString(16)).slice(-digits);

const res = range(points)
    .map(i => step * i)
    .map(phi => ({
        re: (phi === 0) ? Math.sin(Math.PI / 4) : Math.sin(phi),
        im: Math.cos(phi)
    }))
    .map(cplx =>
        val2hex(cplx.im) + val2hex(cplx.re) + ' // ' + cplx.re + ' + j ' + cplx.im
    )
    .join('\n');

console.log(res);
