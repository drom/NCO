'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const update = require('immutability-helper');
const resch = require('resch');
const reGenChart = require('../lib/re-gen-chart');
const reGenLogPlot = require('../lib/re-gen-logplot');
const reGenVerilog = require('../lib/re-gen-verilog');
const testbench = require('../lib/testbench');

const $ = React.createElement;
const desc = Object.assign({}, resch);
const genForm = resch.__form(React)(desc);
const Chart = reGenChart(React)({});
const LogPlot = reGenLogPlot(React)({});
const Verilog = reGenVerilog(React)({});

class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {data: props.data};
        this.updateState = this.updateState.bind(this);

        this.Form = genForm({
            schema: {
                type: 'object',
                properties: {
                    dataWidth: {type: 'integer', minimum: 4, maximum: 30, title: 'I/Q LUT data width [bit] : 2 * '},
                    addrWidth: {type: 'integer', minimum: 0, maximum: 18, title: 'LUT address width [bit] : '},
                    betaWidth: {type: 'integer', minimum: 0, maximum: 32, title: 'Beta angle width [bit] : '},
                    nCordics:  {type: 'integer', minimum: 0, maximum: 12, title: 'number of CORDIC stages : '},
                    corrector: {type: 'integer', minimum: -2, maximum: 2,  title: 'CORDIC step correction : '},
                    scale:     {type: 'number',  minimum: 0, maximum: 2,  title: 'scale correction : '},
                    top:       {type: 'string',                           title: 'top level name : '}
                }
            },
            path: [],
            updateState: this.updateState
        });
    }

    updateState (spec) {
        this.setState(function (state) {
            return update(state, spec);
        });
    }

    render () {
        const config = this.state.data;
        const res = testbench(config);
        return (
            $('span', {},
                $(this.Form, {data: config}),
                $(Verilog, config),
                $(LogPlot, {data: res.evms}),
                $(Chart, {data: res.contours})
            )
        );
    }
}

ReactDOM.render(
    $(App, {data: {
        dataWidth: 16,
        addrWidth: 4,
        betaWidth: 16,
        nCordics: 9,
        corrector: 0,
        scale: 0.999838,
        top: 'nco'
    }}),
    document.getElementById('root')
);

/* eslint-env browser */
