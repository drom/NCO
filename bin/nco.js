#!/usr/bin/env node
'use strict';

const process = require('process');

const { writeFile } = require('fs').promises;

const { program } = require('commander');

const ncoVerilog = require('../lib/nco-verilog.js');

const main = async () => {
  program
    .option('--dataWidth <number>', 'I/Q LUT data width [bit] : 2 * ', parseInt, 16)
    .option('--addrWidth <number>', 'LUT address width [bit]', parseInt, 4)
    .option('--betaWidth <number>', 'Beta angle width [bit]', parseInt, 16)
    .option('--nCordics <number>',  'number of CORDIC stages', parseInt, 9)
    .option('--corrector <number>', 'CORDIC step correction', parseInt, 0)
    .option('--scale <number>',     'scale correction', parseFloat, 0.999838)
    .option('--top <name>',         'Top level name', 'nco')
    .parse(process.argv);

  const config = program.opts();

  const verilogString = ncoVerilog(config);
  await writeFile(config.top + '.v', verilogString);
};

main();
