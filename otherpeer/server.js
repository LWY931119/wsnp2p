var net = require('net')
var jsonStream = require('duplex-json-stream')
var streamSet = require('stream-set')
var register = require('register-multicast-dns')

var hostname = 'server'
var clients = streamSet()
var peers = new Array()
var server = net.createServer(function (socket) {
  	console.log('new connection')
  	socket = jsonStream(socket)
  	socket.on('data', function (data) {
  		if(data.state == 'login'){
  			if(peers.length >= 2){
  			var tmp = [peers[peers.length - 1],peers[peers.length - 2]]
  			socket.write({peers:tmp})
  			socket.end()
  			}
  			else{
  				socket.write({peers:peers})
  				socket.end()
  			}
  			var index = peers.indexOf(data.username)
  			if(index === -1)peers.push(data.username)
  			console.log(peers);
  		}
  		else if(data.state == 'logoff'){
  			var index = peers.indexOf(data.username)
  			if(index > -1) peers.splice(index,1)
  			socket.end()
  			console.log(peers);
  		}
  		
      	
    })
})

register(hostname)
server.listen(10000)