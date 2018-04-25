'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const update = require('immutability-helper');
const resch = require('resch');
const reGenChart = require('../lib/re-gen-chart');
const reGenLogPlot = require('../lib/re-gen-logplot');
const testbench = require('../lib/testbench');

const $ = React.createElement;
const desc = Object.assign({}, resch);
const genForm = resch.__form(React)(desc);
const Chart = reGenChart(React)({});
const LogPlot = reGenLogPlot(React)({});

class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {data: props.data};
        this.updateState = this.updateState.bind(this);

        this.Form = genForm({
            schema: {
                type: 'object',
                properties: {
                    dataWidth: {type: 'number', minimum: 4, maximum: 31, title: 'I/Q LUT data width [bit] : 2 * '},
                    addrWidth: {type: 'number', minimum: 1, maximum: 18, title: 'LUT address width [bit] : '},
                    nCordics:  {type: 'number', minimum: 0, maximum: 12, title: 'number of CORDIC stages: '},
                    corrector: {type: 'number', minimum: 1, maximum: 4,  title: 'CORDIC step correction: '}
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
                $(Chart, {data: res.contours}),
                $(LogPlot, {data: res.evms})
            )
        );
    }
}

ReactDOM.render(
    $(App, {data: {
        dataWidth: 16,
        addrWidth: 4,
        nCordics: 0,
        corrector: 2
    }}),
    document.getElementById('root')
);

/* eslint-env browser */
