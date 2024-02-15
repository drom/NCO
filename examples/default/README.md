# NCO example

### build

```bash
node ../../bin/nco.js --dataWidth 16 --addrWidth 4 --betaWidth 16 --nCordics 9 --corrector 0 --scale 0.999838 --top nco
```
### run simulation

```bash
iverilog -o sim nco.v tb.v && vvp sim
```

### see waveform online

https://vc.drom.io/?github=drom/NCO/master/examples/default/nco.vcd&github=drom/NCO/master/examples/default/nco.waveql
