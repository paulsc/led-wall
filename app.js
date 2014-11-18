var util = require('util')
var _ = require('underscore')
var ws = require('nodejs-websocket')
var SerialPort = require('serialport').SerialPort
var winston = require('winston')
var express = require('express')
var lib = require('./lib')

var SERIAL_PORT = '/dev/tty.usbserial-A901LRZP'
var HTTP_PORT = 8000
var WEBSOCKET_PORT = 9999

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

// express stuff

var app = express()
app.use(express.static('static'))
app.get('/', function(req, res) {
    logger.info('got index request from: ' + req.ip)
    var url = util.format('ws://%s:%s/', lib.findClosestIP(req.ip), WEBSOCKET_PORT)
    res.render('index.ejs', { websocket_url: url})
})
app.listen(HTTP_PORT)
logger.info ('web server started on port: ' + HTTP_PORT)


// websocket stuff

function takeFirstEmptySlot(array, itemToAdd) {
    var itemId = -1
    array.forEach(function(item, index) {
        if (item == null) itemId = index
    })

    if (itemId >= 0) {
        array[itemId] = itemToAdd
    }
    else {
        itemId = array.length
        array.push(itemToAdd)
    }
    return itemId
}

var connections = []

var server = ws.createServer(function(conn) {

    var connectionId = takeFirstEmptySlot(connections, conn)

    logger.info("new connection, assigned id: " + connectionId)
    conn.on("text", function (str) {
        logger.debug("connection #" + connectionId + " received: " + str)
    })
    conn.on("close", function(code, reason) {
        logger.info('connection #' + connectionId +' closed')
        connections[connectionId] = null
    })
    conn.on("error", function(error) {
        logger.info('connection #' + connectionId + ' error: ' + error.code)
    })
}).listen(WEBSOCKET_PORT)

logger.info('websocket server started on port: ' + WEBSOCKET_PORT)

logger.info('open one of these on your phone:')
_.each(lib.getIPList(), function(ip) {
    if (ip == '127.0.0.1') return
    logger.info('http://' + ip + ':' + HTTP_PORT)
})


// serial port stuff

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
