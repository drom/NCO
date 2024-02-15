'use strict';

const ncoVerilog = require('./nco-verilog.js');

function fakeClick(obj) {
  let ev = document.createEvent('MouseEvents');
  ev.initMouseEvent(
    'click',
    true,
    false,
    window,
    0,
    0,
    0,
    0,
    0,
    false,
    false,
    false,
    false,
    0,
    null
  );
  obj.dispatchEvent(ev);
}

function setupDownload (name, data) {
  let urlObject = window.URL || window.webkitURL || window;
  let exportBlob = new Blob([data]);
  let saveLink = document.createElementNS(
    'http://www.w3.org/1999/xhtml',
    'a'
  );
  saveLink.href = urlObject.createObjectURL(exportBlob);
  saveLink.download = name;

  return function (e) {
    fakeClick(saveLink);
    e.preventDefault();
  };
}

module.exports = React => {
  const $ = React.createElement;
  return () => {
    return config => {
      const butLabel = 'Get Verilog';
      return $('div', {},
        $('button', {
          onClick: setupDownload(config.top +'.v', ncoVerilog(config))
        }, butLabel)
      );
    };
  };
};

/* eslint-env browser */
