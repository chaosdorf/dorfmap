wifi.setmode(wifi.STATION)
wifi.sta.config(..., ...)

lowerled = 0
upperled = 4
i2csda = 5
i2cscl = 6

gpio.mode(lowerled, gpio.OUTPUT)
gpio.mode(upperled, gpio.OUTPUT)

gpio.write(upperled, 1)
gpio.write(lowerled, 1)

i2c.setup(0, i2csda, i2cscl, i2c.SLOW)

function read_reg(dev, reg)
	i2c.start(0)
	i2c.address(0, dev, i2c.TRANSMITTER)
	i2c.write(0, reg)
	i2c.stop(0)
	i2c.start(0)
	i2c.address(0, dev, i2c.RECEIVER)
	ret = i2c.read(0, 2)
	i2c.stop(0)
	return ret
end

srv=net.createServer(net.TCP)
srv:listen(80, function(conn)
	conn:on("receive", function(client,request)
		local buf = "HTTP/1.1 200 OK\n\n";
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

		temp = read_reg(0x4f, 0)
		brightness = adc.read(0)
		buf = buf .. "temph=" .. string.byte(ret, 1) .. "\n"
		buf = buf .. "templ=" .. string.byte(ret, 2) .. "\n"
		buf = buf .. "brightness=" .. brightness .. "\n"

		if (_GET.lled == "on") then
			gpio.write(lowerled, 0);
		elseif (_GET.lled == "off") then
			gpio.write(lowerled, 1);
		end

		if (_GET.uled == "on") then
			gpio.write(upperled, 0);
		elseif (_GET.uled == "off") then
			gpio.write(upperled, 1);
		end

		client:send(buf);
		client:close();
		collectgarbage();
    end)
end)
