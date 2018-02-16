

# Homebridge MagicBlue LED Light Bulb Plug in for Mac

This plug-in enables you to control your MagicBlue LED light bulb, by running Homebridge on a Mac.

## Connecting and setting up

The light bulb uses Bluetooth low energy. This means that your Mac needs to have Bluetooth 4.0. You have to find the name(s) of your bulb(s). It's something among the line of 'LEDBLE-xxxxx'. You can find them by opening the MagicBlue App on your phone.

## Installation

Run the following command
```
npm install -g homebridge-magic-blue-bulb-mac
```

Chances are you are going to need sudo with that.

## Config.json file

```json
	{
	    "accessory" : "magic-blue-bulb",
	    "name" : "MagicBlue",
	    "tag" : "LEDBLE-1234567"
	}
```

| Key           | Description                                                                        |
|---------------|------------------------------------------------------------------------------------|
| accessory     | Required. Has to be "magic-blue-bulb"                                             |
| name          | Required. The name of this accessory. This will appear in your Homekit app         |
| tag           | Required. The name of the device you discovered earlier                             |


## Issues

This software comes with no warranty. It works for me and it might for you.

## Credit

I forked the [repository (homebridge-magic-blue-bulb)](https://github.com/lucavb/homebridge-magic-blue-bulb) from [Luca Becker](https://github.com/lucavb). A lot of the code is based directly from that repo, but rebuilding it to work on Mac took a lot of changes. Chances are it's going to work on a Raspberry Pi as well, but i'm not able to test that at the moment. Some of the codes for finding the correct services and characteristics came from the article by [Uri Shaked 'Reverse Engineering a Bluetooth Lightbulb'](https://medium.com/@urish/reverse-engineering-a-bluetooth-lightbulb-56580fcb7546)
