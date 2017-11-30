var topology = require('fully-connected-topology');
var jsonStream = require('duplex-json-stream')
var streamSet = require('stream-set')
var register = require('register-multicast-dns')
require('lookup-multicast-dns/global')
var net = require('net')
var hashport = require('hash-to-port')
var JSZip = require('jszip');
var ADMZip = require('adm-zip')
var fs = require("fs");
var test = 1
var myname = process.argv[2]
var me = toAddress(myname)
var peersname = new Array();
var connpeer = new Array();
var set = streamSet()
var myseq = 0;
var otherseqs = new Map()
var myid = Math.random()
register(myname+'.local');
//get other peers from server 
var username = process.argv[2] || 'guest'
var servername = 'server.local'
var state = 'login'
var socket = jsonStream(net.connect(10000, servername))
var conn;
socket.write({state:state,username: username})

socket.on('data', function (data) {
  console.log('data.peers: ',data.peers)
  peersname = data.peers;
  console.log('peersname: ',peersname)
})

socket.on('end',function(){
	console.log('server end')
	//connect to other peers
	//虽然目前节点自己链接自己没有问题但是这里是个隐患
	conn = topology(me,peersname.map(toAddress))
	console.log('peeraaddreaa: ',peersname.map(toAddress))
	conn.on('connection',function(socket,peer){
		console.log('info > new connection from',peer);
		connpeer.push(peer+"");
		test++;
		socket = jsonStream(socket);
		set.add(socket);
		socket.on('data',function(data){
			if(data.id != myid){
				if((otherseqs.has(data.id) && otherseqs.get(data.id) < data.seq)||!otherseqs.has(data.id)){
					switch (data.method){
						case 'POST':
							POSTreceive(data);
							break;
						case 'GET':
							GETreceive(data);
							break;
						default:
							console.log(data);
					}
					
				}
			}
		})		
	})
})
process.stdin.on('data',function(data){
	//TODO如果是短连接这里怎么forEach
	var message = data.toString().trim();
	var arr = message.split(/\s+/);
	// for(var k=0;k <arr.length;k++){
	// 	console.log(arr[k]);
	// }
	if(arr.length != 2) printUsage();
	if(arr.length == 2){
		switch (arr[0]){
			case 'POST':
				POSTsend(arr[1]);
				break;
			case 'GET':
				GETsend(arr[1]);
				break;
			case 'PUT':
				break;
			case 'UPDATE':
				break;
			default:
				printUsage();
		}
	}
})
/*	POST method
*	post a js file to all peers
*	after recived this,peer can exec that 
*/
function POSTsend(filePath){
	
    	saveZip(filePath);
		fs.readFile("2.zip",function(err,data){
		
		//var mess = data;
			console.log(data);
			set.forEach(function (socket){
				socket.write({id:myid,seq:myseq,method:"POST",username:myname,message:data})
			})
			myseq++;
		})
		
  
}

function POSTreceive(data){
	tarZip(data.message)
	otherseqs.set(data.id,data.seq)
	set.forEach(function (socket){
		socket.write({id:data.id,seq:data.seq,method:data.method,username:data.username,message:data.message});
	})
	console.log(data.username + ' > ' + data.message)
	//execshell(data.message);
}
/*
*	GET method
*	no idea
*/
function GETsend(message){
	console.log(myname,message);
	GETcheck(message);
	set.forEach(function (socket){
		socket.write({id:myid,seq:myseq,method:"GET",username:myname,message:message})
	})
	myseq++;
}

function GETcheck(name,message){
	if (message == hashport(myname)){
		console.log(test+"I'm here "+name);
		if(name != myname){
			console.log(connpeer);
			//connect name.local
			//send something is in my here
			var addr = toAddress(name);
			var aaa =connpeer.indexOf(addr);
			//console.log(addr,connpeer.indexOf(addr),aaa);
			if(aaa == -1 ){
				console.log('I want to connect to '+name);
				//conn.add(addr);
				var p1 = new Promise(function(resolve, reject){
					conn.add(addr)
					resolve();
				});
				p1.then(function(){
					console.log('ssss');
					var socket1 = conn.peer(addr);
					socket1.write({id:myid,seq:myseq,method:"ACK",username:myname,message:'I\'m here'})
				});
				
			}else{
				console.log('I want to talk to '+name);
				var socket1 = jsonStream(conn.peer(toAddress(name)));
				socket1.write({id:myid,seq:myseq,method:"ACK",username:myname,message:'I\'m here'});
			}
			
		}
	}
}

function GETreceive(data){
	GETcheck(data.username,data.message);
	otherseqs.set(data.id,data.seq)
	set.forEach(function (socket){
		socket.write({id:data.id,seq:data.seq,method:data.method,username:data.username,message:data.message});
	})
	console.log(data.username + ' find ' + data.message)
}
//TODO:如何在合适的时间通知server删除自己？

process.on('exit',function(){
	var socket = jsonStream(net.connect(10000, servername))
	state = 'logoff'
	socket.write({state:state,username: username})
	socket.on('end',function(){
		console.log('exit');
	})
	
})
function toAddress(username){
	return username + '.local:'+hashport(username);
}
//将收到的message作为js代码执行
//TODO:将收到的代码片段存在文件里然后执行这个文件
function execshell(message){
	var exec = require('child_process').exec;
	exec(message,function(err,stdout,stderr){
		if(err){
			console.log('get error: '+ err);
		}
		else {
			console.log(stdout);
		}
	});
}
function saveZip(filePath){
	var zip = new JSZip();
	fs.readFile(filePath, function(err, data) {
    	if (err) throw err;
    	zip.file(filePath, data);
    	zip.generateAsync({type:"nodebuffer"})
			.then(function (content) {
    		require("fs").writeFileSync("2.zip", content);
			});
	});
	
}
function tarZip(message){
	//console.log(data.message)
	let buffer = Buffer.from(message.data);
	console.log('Buffer: ', buffer);
	require("fs").writeFile("2.zip", buffer, function(err){
		if(err){
			console.log('get error: '+ err);
		}
		else {
			var zip = new ADMZip("./2.zip");
			var zipEntries = zip.getEntries(); // an array of ZipEntry records

			zipEntries.forEach(function(zipEntry) {
	    		console.log(zipEntry.entryName); // outputs zip entries information
				// if (zipEntry.entryName == "my_file.txt") {
		  		//    console.log(zipEntry.data.toString('utf8')); 
				// }
			});
			zip.extractAllTo("./", /*overwrite*/true);
		}
	});
	
}
function printUsage(){
	console.log("Usage of this :[options] [argument]")
	console.log("options:")
	console.log("POST \"a file path\"")
	console.log("GET \"something you want\"")
}