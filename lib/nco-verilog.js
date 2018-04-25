'use strict';

const reqack = require('reqack');


module.exports = config => {

    const g = reqack.circuit();

    g()({width: 4, capacity: 1})();

    return reqack.verilog(g, {});

};
