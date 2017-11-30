var levelup = require('levelup')
var leveldown = require('leveldown')
var db = levelup(leveldown('./mydb'))
db.get('name',function(err,value){
	if(err)return console.log('Ooops!',err)
	console.log('name=' + value)
})