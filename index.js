const noble = require('noble')
const rgbConversion = require("./rgbConversion")

let Service
let Characteristic
let HomebridgeAPI

module.exports = function(homebridge) {
  Service = homebridge.hap.Service
  Characteristic = homebridge.hap.Characteristic
  HomebridgeAPI = homebridge

  homebridge.registerAccessory(
    "homebridge-magic-blue-bulb",
    "magic-blue-bulb",
    MagicBlueBulb)
}

function MagicBlueBulb(log, config) {
  this.log = log
  this.name = config.name
  this.ledsStatus = {
    "on" : true,
    "values" : rgbConversion.rgbToHsl(255, 255, 255)
  }
  this.tag = config.tag ? config.tag : null
  this.handle = config.handle || 0x000c // v9 is 0x000b

  if (this.tag) {
    this.findBulb(this.tag)
  }

  // info service
  this.informationService = new Service.AccessoryInformation()

  this.informationService
    .setCharacteristic(Characteristic.Manufacturer, config.manufacturer || "Light")
    .setCharacteristic(Characteristic.Model, config.model || "Magic Blue")
    .setCharacteristic(Characteristic.SerialNumber, config.serial || "5D4989E80E44")


  this.service = new Service.Lightbulb(this.name)

  this.service.getCharacteristic(Characteristic.On)
    .on('get', this.getState.bind(this))
  this.service.getCharacteristic(Characteristic.On)
    .on('set', this.setState.bind(this))

  this.service.getCharacteristic(Characteristic.Hue)
    .on('get', this.getHue.bind(this))
  this.service.getCharacteristic(Characteristic.Hue)
    .on('set', this.setHue.bind(this))

  this.service.getCharacteristic(Characteristic.Saturation)
    .on('get', this.getSat.bind(this))
  this.service.getCharacteristic(Characteristic.Saturation)
    .on('set', this.setSat.bind(this))

  this.service.getCharacteristic(Characteristic.Brightness)
    .on('get', this.getBright.bind(this))
  this.service.getCharacteristic(Characteristic.Brightness)
    .on('set', this.setBright.bind(this))
}

MagicBlueBulb.prototype.findBulb = function(tag, callback) {
  noble.on('stateChange', state => {
    if (state === 'poweredOn') {
      noble.startScanning()
    } else {
      noble.stopScanning()
    }
  })

  noble.on('discover', peripheral => {
    const name = peripheral.advertisement.localName

    if (name == tag) {
      this.log('found bulb: ' + name)

      this.discoverServices(peripheral)
    }
  })
}

MagicBlueBulb.prototype.discoverServices = function(peripheral, callback) {
  const serviceTag = 'ffe5'
  const characteristicTag = 'ffe9'

  this.log('discoverServices called')

  this.connect(peripheral, connected => {
    if (!connected) {
      this.log('discoverServices could not connect')

      return
    }

    this.log('discoverServices did connect')

    peripheral.discoverAllServicesAndCharacteristics((error, services, characteristics) => {
      this.log('discoverServices got: ')

      const foundServices = services.filter((service) => {
        return service.uuid == serviceTag
      })

      const foundCharacteristics = characteristics.filter((characteristic) => {
        return characteristic.uuid == characteristicTag
      })

      if (foundServices.length !== 1) {
        this.log('Did not found a services')

        return
      }

      this.btService = foundServices[0]

      if (foundCharacteristics.length !== 1) {
        this.log('Did not found a characteristic')

        return
      }

      this.btCharacteristic = foundCharacteristics[0]
      this.btPeripheral = peripheral

      if (typeof callback === 'function') {
        callback()
      }
    })
  })
}

MagicBlueBulb.prototype.writeColor = function(callback) {
  const rgb = rgbConversion.hslToRgb(this.ledsStatus.values[0], this.ledsStatus.values[1], this.ledsStatus.values[2])
  const data = new Buffer([0x56, rgb.r, rgb.g, rgb.b, 0x00, 0xf0, 0xaa, 0x3b, 0x07, 0x00, 0x01])

  this.log('write color called')

  this.write(data, res => {
    this.log('write color done')
  })

  callback()
}

MagicBlueBulb.prototype.connect = function(peripheral, callback){
  if (peripheral && peripheral.state == "connected") {
    callback(true)
  } else if (peripheral && peripheral.state == "disconnected") {
    this.log("lost connection to bulb. attempting reconnect ...")

    peripheral.connect(error => {
      if (!error) {
        this.log("reconnect was successful")

        callback(true)
      } else {
        this.log("reconnect was unsuccessful")

        callback(false)
      }
    })
  }
}

MagicBlueBulb.prototype.setState = function(status, callback) {
  let code = 0x24

  if (status) {
    code = 0x23
  }

  this.log('setState called')
  this.write(new Buffer([0xcc, code, 0x33]), error => {
    if (error) {
      this.log('BLE: Write handle Error: ' + error)
    } else {
      this.log('successful written')
      this.ledsStatus.on = status
    }

    callback()
  })
}

MagicBlueBulb.prototype.write = function(data, callback) {
  this.log('write called')
  this.log(data)

  this.connect(this.btPeripheral, connected => {
    if (!this.btPeripheral || !this.btService || !this.btCharacteristic || !connected) {
      this.log('no peripheral, service or characteristic')

      callback(new Error())

      return
    }

    this.btCharacteristic.write(data, true, error => {
      if (error) {
        callback(error)

        this.log('BLE: Write Error: ' + error)
      } else {
        callback()

        this.log('successful written')
      }
    })
  })
}

MagicBlueBulb.prototype.getState = function(callback) {
  this.log('getState called')

  callback(null, this.ledsStatus.on)
}

MagicBlueBulb.prototype.getHue = function(callback) {
  callback(null, this.ledsStatus.values[0])
}

MagicBlueBulb.prototype.setHue = function(level, callback) {
  this.ledsStatus.values[0] = level

  if (this.ledsStatus.on) {
    this.writeColor(() => {
      callback()
    })
  } else {
    callback()
  }
}

MagicBlueBulb.prototype.getSat = function(callback) {
  callback(null, this.ledsStatus.values[1])
}

MagicBlueBulb.prototype.setSat = function(level, callback) {
  this.ledsStatus.values[1] = level

  if (this.ledsStatus.on) {
    this.writeColor(() => {
      callback()
    })
  } else {
    callback()
  }
}

MagicBlueBulb.prototype.getBright = function(callback) {
  callback(null, this.ledsStatus.values[2])
}

MagicBlueBulb.prototype.setBright = function(level, callback) {
  this.ledsStatus.values[2] = level

  if (this.ledsStatus.on) {
    this.writeColor(() => {
      callback()
    })
  } else {
    callback()
  }
}

MagicBlueBulb.prototype.getServices = function() {
  return [this.informationService, this.service]
}
