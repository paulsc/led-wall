var SerialPort = require('serialport').SerialPort
var winston = require('winston')

var SERIAL_PORT = '/dev/tty.usbserial-A901LRZP'

var serialPort = new SerialPort(SERIAL_PORT, { baudrate: 9600 })

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({ 
            level: 'debug',
            timestamp: true, 
            colorize: true 
        }),
    ]
})


serialPort.on('open', function () {
  logger.info('serial port is open');

  serialPort.on('data', function(data) {
    logger.info('serial data received: ' + data);
  });

  setTimeout(function() {
      serialPort.write("D", function(err, results) {
        console.log('err ' + err);
        console.log('results ' + results);
      });
  }, 3000);

});
