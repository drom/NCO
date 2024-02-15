'use strict';

function genTable (steps, bits) {
  const quantum = steps / (2 * Math.PI);
  const scale = 1 << bits;
  return function (phi) {
    const qphi = Math.round(quantum * phi) / quantum;
    return {
      re: Math.round(scale * Math.cos(qphi)) / scale,
      im: Math.round(scale * Math.sin(qphi)) / scale
    };
  };
}

module.exports = genTable;
