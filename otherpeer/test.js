process.stdin.on('data',function(data){
	//TODO如果是短连接这里怎么forEach

	var message = data.toString().trim();
	var arr = message.split(/\s+/);
	for(var k=0;k <arr.length;k++){
		console.log(arr[k]);
	}
	switch (arr[0]){
		case 'POST':

			break;
		case 'GET':
			break;
		case 'PUT':
			break;
		case 'UPDATE':
			break;
		default:
			console.log("Ussage of this :")
			console.log("POST \"a file path\"")
			console.log("GET \"something you want\"")
	}
})