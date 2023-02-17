verilate:
	verilator \
	-Wall \
	--cc \
	--Wno-UNUSED \
	--Wno-UNDRIVEN \
	--Wno-DECLFILENAME \
	--trace \
	--top-module nco \
  -Mdir nco \
	nco.v \
	--exe tb.cpp

compile:
	$(MAKE) -C nco/ -f Vnco.mk Vnco

run:
	nco/Vnco

clean:
	find . -name "*.a" -delete
	find . -name "*.o" -delete
	find . -name "*.d" -delete
	rm -rf nco
	rm *.vcd
