'use strict';

const reqack = require('reqack');


module.exports = config => {

    const dataWidth = config.dataWidth;

    const g = reqack.circuit();

    g()({width: dataWidth, capacity: 1})();

    return '// ' + JSON.stringify(config) + '\n' + reqack.verilog(g, {});

};
