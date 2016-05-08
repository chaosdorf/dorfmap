wifi.setmode(wifi.STATION)
wifi.sta.config("foo","bar")

si2cscl = 2
si2csda = 1

gpio.mode(si2cscl, gpio.OUTPUT)
gpio.mode(si2csda, gpio.OUTPUT)

gpio.write(si2cscl, 0)
gpio.write(si2csda, 0)

bitarr = {}
bitidx = 1
bitlen = 0
cycle = 0

function write_init(len)
	bitlen = len
	bitidx = 1
	cycle = 1
	gpio.write(si2csda, 0)
	gpio.write(si2cscl, 0)
	tmr.start(1)
end

function write_bit()
	if (bitidx > bitlen) then
		gpio.write(si2csda, 0)
		tmr.stop(1)
		return
	end
	if (cycle == 1) then
		gpio.write(si2csda, bitarr[bitidx])
		gpio.write(si2cscl, 1)
		cycle = 0
	else
		if (bitidx == bitlen) then
			gpio.write(si2csda, 1)
			gpio.write(si2cscl, 0)
		else
			gpio.write(si2csda, 0)
			gpio.write(si2cscl, 0)
		end
		cycle = 1
		bitidx = bitidx + 1
	end
end

tmr.register(1, 1, tmr.ALARM_AUTO, write_bit)

srv=net.createServer(net.TCP)
srv:listen(80, function(conn)
	conn:on("receive", function(client,request)
		local buf = "HTTP/1.1 204 No Content\n\n";
		local _, _, method, path, vars = string.find(request, "([A-Z]+) (.+)?(.+) HTTP");
		if(method == nil)then
			_, _, method, path = string.find(request, "([A-Z]+) (.+) HTTP");
		end

		local _GET = {}
		if (vars ~= nil)then
			for k, v in string.gmatch(vars, "(%w+)=(%w+)&*") do
				_GET[k] = v
			end
		end

		if (_GET.si2ccmd) then
			blen = string.len(_GET.si2ccmd)
			for i=1,blen do
				bitarr[i] = string.byte(_GET.si2ccmd, i) - 48
			end
			write_init(blen)
		end

		client:send(buf);
		client:close();
		collectgarbage();
    end)
end)
