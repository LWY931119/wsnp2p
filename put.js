var levelup = require('levelup')
var leveldown = require('leveldown')
var db = levelup(leveldown('./mydb'))
db.put('name','levelup',function(err){
	if(err) return console.log('Ooops!',err)
})