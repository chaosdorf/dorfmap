wifi.setmode(wifi.STATION)
wifi.sta.config("...", "...")

lowerled = 0
upperled = 4
amsda = 1
amscl = 2

gpio.mode(lowerled, gpio.OUTPUT)
gpio.mode(upperled, gpio.OUTPUT)

gpio.write(upperled, 1)
gpio.write(lowerled, 1)

am2320.init(amsda, amscl)

srv=net.createServer(net.TCP)
srv:listen(80, function(conn)
	conn:on("receive", function(client,request)
		local buf = "HTTP/1.1 200 OK\nServer: NodeMCU on ESP8266-12E\n\n";
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

		am_rh, am_temp = am2320.read()
		buf = buf .. "am_rh=" .. am_rh .. "\n"
		buf = buf .. "am_t=" .. am_temp .. "\n"

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
	end)
	conn:on("sent", function(conn)
		conn:close()
		collectgarbage();
	end)
end)
