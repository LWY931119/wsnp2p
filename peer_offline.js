/*p2pchart with offline log
*peer can recive message send when it offline
*/
var topology = require('fully-connected-topology');
var jsonStream = require('duplex-json-stream')
var streamSet = require('stream-set')
var register = require('register-multicast-dns')
require('lookup-multicast-dns/global')
var hashport = require('hash-to-port')
var myname = process.argv[2]
var me = toAddress(myname)
var peersname = process.argv.slice(3);
//var peeraddress = toAddress(peersn);
var set = streamSet()
var myseq = 0;
var otherseqs = new Map()
var myid = Math.random()
register(myname+'.local');
var conn = topology(me,peersname.map(toAddress))
conn.on('connection',function(socket,peer){
	console.log('info > new connection from',peer);
	socket = jsonStream(socket);
	set.add(socket);
	socket.on('data',function(data){
		if(data.id != myid){
			if((otherseqs.has(data.id) && otherseqs.get(data.id) < data.seq)||!otherseqs.has(data.id)){
				otherseqs.set(data.id,data.seq)
				set.forEach(function (socket){
					socket.write({id:data.id,seq:data.seq,username:data.username,message:data.message})
				})
				console.log(data.username + ' > ' + data.message)
			}
		}
		
	})
	
})
process.stdin.on('data',function(data){
	set.forEach(function (socket){
		var message = data.toString().trim();
		socket.write({id:myid,seq:myseq,username:myname,message:message})
	})
	myseq++;
})
function toAddress(username){
	return username + '.local:'+hashport(username);
}