'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const update = require('immutability-helper');
const resch = require('resch');
const reGenChart = require('../lib/re-gen-chart');
const testbench = require('../lib/testbench');

const $ = React.createElement;
const desc = Object.assign({}, resch);
const genForm = resch.__form(React)(desc);
const Chart = reGenChart(React)({});

class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {data: props.data};
        this.updateState = this.updateState.bind(this);

        this.Form = genForm({
            schema: {
                type: 'object',
                properties: {
                    dataWidth: {type: 'number', minimum: 4, maximum: 31, title: 'LUT data width: '},
                    addrWidth: {type: 'number', minimum: 1, maximum: 12, title: 'LUT address width: '},
                    nCordics:  {type: 'number', minimum: 0, maximum: 12, title: 'number of CORDIC stages: '}
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
        return (
            $('span', {},
                $(Chart, {data: testbench(config)}),
                $(this.Form, {data: config})
            )
        );
    }
}

ReactDOM.render(
    $(App, {data: {
        dataWidth: 12,
        addrWidth: 2,
        nCordics: 0
    }}),
    document.getElementById('root')
);

/* eslint-env browser */
