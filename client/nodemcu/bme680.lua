station_cfg = {}
station_cfg.ssid = "..."
station_cfg.pwd = "..."

wifi.setmode(wifi.STATION)
wifi.sta.config(station_cfg)
wifi.sta.connect()

lowerled = 0
upperled = 4
i2csda = 5
i2cscl = 6

gpio.mode(lowerled, gpio.OUTPUT)
gpio.mode(upperled, gpio.OUTPUT)

gpio.write(upperled, 1)
gpio.write(lowerled, 1)

i2c.setup(0, i2csda, i2cscl, i2c.SLOW)

bme680.setup()

temperature_str = ""
pressure_str = ""
pressure_sealevel_str = ""
humidity_str = ""
iaq_str = ""
dewpoint_str = ""

srv=net.createServer(net.TCP)
srv:listen(80, function(conn)
	conn:on("receive", function(client,request)
		local buf = "HTTP/1.1 200 OK\nServer: NodeMCU on ESP8266-12E\n\n"
		local _, _, method, path, vars = string.find(request, "([A-Z]+) (.+)?(.+) HTTP")
		if(method == nil)then
			_, _, method, path = string.find(request, "([A-Z]+) (.+) HTTP")
		end

		local _GET = {}
		if (vars ~= nil)then
			for k, v in string.gmatch(vars, "(%w+)=(%w+)&*") do
				_GET[k] = v
			end
		end

		brightness = adc.read(0)
		buf = buf .. "temperature=" .. temperature_str .. "\n"
		buf = buf .. "pressure=" .. pressure_str .. "\n"
		buf = buf .. "pressure_sealevel=" .. pressure_sealevel_str .. "\n"
		buf = buf .. "humidity=" .. humidity_str .. "\n"
		buf = buf .. "iaq=" .. iaq_str .. "\n"
		buf = buf .. "dewpoint=" .. dewpoint_str .. "\n"
		buf = buf .. "brightness=" .. brightness .. "\n"

		if (_GET.lled == "on") then
			gpio.write(lowerled, 0)
		elseif (_GET.lled == "off") then
			gpio.write(lowerled, 1)
		end

		if (_GET.uled == "on") then
			gpio.write(upperled, 0)
		elseif (_GET.uled == "off") then
			gpio.write(upperled, 1)
		end

		client:send(buf)
	end)
	conn:on("sent", function(conn)
		conn:close()
		collectgarbage()
	end)
end)

function read_bme680()
	bme680.startreadout(150, function ()
		T, P, H, G, QNH = bme680.read(38)
		if T then
			local Tsgn = (T < 0 and -1 or 1); T = Tsgn*T
			temperature_str = string.format("%s%d.%02d", Tsgn<0 and "-" or "", T/100, T%100)
			pressure_str = string.format("%d.%03d", P/100, P%100)
			pressure_sealevel_str = string.format("%d.%03d", QNH/100, QNH%100)
			humidity_str = string.format("%d.%03d", H/1000, H%1000)
			iaq_str = string.format("%d", G)
			D = bme680.dewpoint(H, T)
			local Dsgn = (D < 0 and -1 or 1); D = Dsgn*D
			dewpoint_str = string.format("%s%d.%02d", Dsgn<0 and "-" or "", D/100, D%100)
		end
	end)
end

poller = tmr.create()
poller:register(1000, tmr.ALARM_AUTO, read_bme680)
poller:start()
