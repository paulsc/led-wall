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

var serialPort = new SerialPort(SERIAL_PORT, { baudrate: 115200 })

var running = false

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

function scaleCoord(y) {
    var lower_bound = 300
    var upper_bound = 900
    if (y < lower_bound) return 6
    if (y >= upper_bound) return 1
    var range = upper_bound - lower_bound
    return (5 - Math.floor((y - lower_bound) / range * 5)) + 1
}

var connections = []

var server = ws.createServer(function(conn) {

    if (!running) {
        logger.info("first connection starting game in 3s")
        setTimeout(function() { startPhysics() }, 3000)
        running = true
    }
        
    var connectionId = takeFirstEmptySlot(connections, conn)

    logger.info("new connection, assigned id: " + connectionId)
    conn.on("text", function (str) {
        var scaled = scaleCoord(parseInt(str))
        logger.debug("connection #" + connectionId + " received: " + str + " scaled: " + scaled)
        var prefix = "A"
        if (connectionId == 1) { 
            pad_b = yToMap(scaled)
            prefix = "B"
        } 
        else if (connectionId == 0) {
            pad_a = yToMap(scaled)
            prefix = "A"
        }

        serialPort.write(prefix + scaled, function(err, results) {
            if (err) logger.error('err ' + err)
            //logger.info('results ' + results)
        })
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
    logger.info('serial port is open')

    serialPort.on('data', function(data) {
        logger.info('serial data received: ' + data)
    })

})

// game stuff

var ball_coords = [ 2, 1 ]
var ball_vector = [ 1, 1 ]

var pad_a = 4
var pad_b = 6

var FIELD_SIZE = 10 // adding 2 for invisible walls
var BLOCK_EMPTY = 0
var BLOCK_WALL = 1
var BLOCK_PIT_A = 2 // if ball hits this, A looses
var BLOCK_PIT_B = 3 // if ball hits this, B looses

var map = new Array(FIELD_SIZE)

function makeRow(block_type) {
    var result = new Array(FIELD_SIZE)
    return _.map(result, function() { return block_type })
}

function initializeMap() {
    map = _.map(map, function(value, key) {
        return makeRow(BLOCK_EMPTY)
    })
    map[0] = makeRow(BLOCK_WALL)
    map[9] = makeRow(BLOCK_WALL)

    _.map(map, function(value, key) { value[0] = BLOCK_PIT_A })
    _.map(map, function(value, key) { value[9] = BLOCK_PIT_B })
}
initializeMap()

function putPadsOnMap() {
    map[pad_a - 1][1] = BLOCK_WALL
    map[pad_a][1] = BLOCK_WALL
    map[pad_a + 1][1] = BLOCK_WALL

    map[pad_b - 1][8] = BLOCK_WALL
    map[pad_b][8] = BLOCK_WALL
    map[pad_b + 1][8] = BLOCK_WALL
}
putPadsOnMap()
drawDebugMap()
 
function startPhysics() {
    var instructions = "X" + coordsToLED(ball_coords).join('')
    serialPort.write(instructions, function(err, results) {
        if (err) logger.error('err ' + err)
    })

    setInterval(function() { renderScene() }, 1000)
}

function drawDebugMap() {
    _.each(map, function(row, x) {
        _.each(row, function(value, y) {
            if (y == ball_coords[0] && x == ball_coords[1]) process.stdout.write("OO")
            else if (value == BLOCK_EMPTY) process.stdout.write("  ")
            else if (value == BLOCK_WALL) process.stdout.write("XX")
            else if (value == BLOCK_PIT_A) process.stdout.write("AA")
            else if (value == BLOCK_PIT_B) process.stdout.write("BB")
        })
        console.log("")
    })
}

function yToMap(y) {
    return (7 - y) + 1
}

function coordsToLED(coords) {
    var result = []
    result[0] = 7 - (coords[1] - 1)
    result[1] = coords[0] - 1
    return result
}

function getBlock(coords) { return map[coords[1]][coords[0]] }
function isWall(block) { return block == BLOCK_WALL }
//function isWall(block) { return block != BLOCK_EMPTY }

function renderScene() {

    ball_coords[0] += ball_vector[0]
    ball_coords[1] += ball_vector[1]

    var target_block_type = getBlock(ball_coords)
    logger.debug('ball hitting: ' + target_block_type)

    if (isWall(target_block_type)) {
        var option1 = ball_coords.slice(0)
        option1[0] -= ball_vector[0]
        var block1 = getBlock(option1)
        logger.debug('option1: ' + block1)
        var option2 = ball_coords.slice(0)
        option2[1] -= ball_vector[1]
        var block2 = getBlock(option2)
        logger.debug('option2: ' + block2)

        if (!isWall(block1)) {
            ball_coords = option1
            ball_vector[0] *= -1
        }
        else if (!isWall(block2)) {
            ball_coords = option2
            ball_vector[1] *= -1
        }
        else { // straight into corner
            ball_coords[0] -= ball_vector[0]            
            ball_coords[1] -= ball_vector[1]            
            ball_vector[0] *= -1
            ball_vector[1] *= -1
        }
    }
    else if (target_block_type == BLOCK_PIT_B) {
        logger.info("!!!! LEFT WINS !!!!")
        process.exit()
    }
    else if (target_block_type == BLOCK_PIT_A) {
        logger.info("!!!! RIGHT WINS !!!!")
        process.exit()
    }

    var instructions = "X" + coordsToLED(ball_coords).join('')
    serialPort.write(instructions, function(err, results) {
        if (err) logger.error('err ' + err)
    })

    logger.debug('ball moved to: ' + ball_coords[0] + ' ' + ball_coords[1])
    drawDebugMap()
}

