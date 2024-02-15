'use strict';

const range = require('lodash.range');
const d3Polygon = require('d3-polygon');
const genModel = require('./model.js');

const dbrange = 512;

const randomPhase = () => (Math.random() * (1 << 31)) | 0;

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

const evm = arr => Math.log2(
  arr.reduce((prev, cur) =>
    prev + (cur.re * cur.re) + (cur.im * cur.im), 0
  ) / arr.length
);

module.exports = config => {
  // create chain of designs
  const addrWidth = config.addrWidth;

  const designs = range(addrWidth).map(i => {
    const res = Object.assign({}, config);
    res.addrWidth = i;
    res.nCordics = 0;
    return res;
  })
    .concat(range(config.nCordics + 1).map(i => {
      const res = Object.assign({}, config);
      res.addrWidth = addrWidth;
      res.nCordics = i;
      return res;
    }));

  // console.log(designs);

  let contours = [];
  let evms = [];

  designs.map((design) => {
    const model = genModel(design);
    const errors = Array(10000).fill(0).map(() => { // 1000
      const phase = randomPhase();
      // const phase = (i << (32 - 3 - 2) >>> 0);
      const res = model(phase);
      const ref = exp(phase);
      // return errMag(ref, res);
      return errVectorRot(ref, res);
    });
    contours.push(hullErr(errors));
    evms.push(evm(errors));
  });

  return {
    contours: contours,
    evms: evms
  };
};
