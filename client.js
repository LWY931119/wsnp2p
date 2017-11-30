require('lookup-multicast-dns/global')
var net = require('net')
var jsonStream = require('duplex-json-stream')

var username = process.argv[2] || 'guest'
var servername = 'server.local'
var state = 'logoff'
var socket = jsonStream(net.connect(10000, servername))

socket.write({state:state,username: username})

socket.on('data', function (data) {
  console.log(data.peers)
})