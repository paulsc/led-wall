var os = require('os')

var getIPList = function() {
    var interfaces = os.networkInterfaces()
    var result = []
    for (var dev in interfaces) {
        interfaces[dev].forEach(function(details) {
            if (details.family == 'IPv4') result.push(details.address)
        })
    }
    return result
}
exports.getIPList = getIPList

var startOverlap = function(str1, str2) {
    var i
    for (i = 0; i < str1.length; i++) {
        i = parseInt(i)
        if (str1[i] != str2[i]) return i
    }
    return i
}
exports.startOverlap = startOverlap

var findClosestIP = function(ip) {
    var ipList = getIPList()
    var bestMatch = ipList[0]
    var overlap = 0
    for (idx in ipList) {
        currentOverlap = startOverlap(ip, ipList[idx])
        if (currentOverlap > overlap) {
            bestMatch = ipList[idx]
            overlap = currentOverlap
        }
    }
    return bestMatch
}
exports.findClosestIP = findClosestIP

var expiringArray = function() {
    var arr = [];
    var EXPIRY_TIME = 1000;

    var add = function(index, value) {
        arr[index] = { timestamp: new Date().getTime(), value: value }
    }

    var sum = function(index, value) {
        var total = 0
        var now = new Date().getTime()
        arr.forEach(function(el, index) {
            if (!el) return
            if (now - el.timestamp > EXPIRY_TIME) {
                arr[index] = null
                return
            } 
            total += el.value
        })
        return total
    }

    return { add: add, sum: sum, data: arr }
}
exports.expiringArray = expiringArray


