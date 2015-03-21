var mongoose = require('mongoose');
var Schema = mongoose.Schema;
mongoose.connect('mongodb://localhost:27017/fyp');

User = mongoose.model('users', {name: String, pw: String});
FileSystem = mongoose.model('fs', {name: String, root: Schema.Types.Mixed});

exports.createUser = function (name, pw, callback){
	var user = new User({name: name, pw: pw});
	user.save(function(err){
		callback(err);
	});
};

exports.findUser = function (name, callback){
	User.find({name: name}, function(err, user){
		callback(err, user);
	});
};

exports.deleteUser = function (name, callback){
	User.remove({name: name}, function(err){
		callback(err);
	});
};

exports.init = function(name, callback){
	var entry = new FileSystem({name: name, root: {type: "dir", children:[]}});
	entry.save(function(err){
		callback(err);
	});
}

exports.createFolder = function (name, path, callback){
	FileSystem.find({name: name}, function(err, fs){
		var cur = fs[0].root;
		var stack = [cur];
		for (var i = 0; i < path.length; i++){
			if (cur.children[path[i]] === undefined){ // if there is no directory, create one
				cur.children[path[i]] = {type: "dir", children: []};
			}
			cur = cur.children[path[i]];
			stack.push(cur);
		}
		for (var i = path.length - 1; i >= 0; i--){
			stack[i].children[path[i]] = stack[i + 1];
			console.log(stack[i]);
		}
		var entry = new FileSystem({name: name, root: stack[0]});
		console.log(entry);
	});
};

exports.dumpStructure = function (name, callback){
	FileSystem.find({name: name}, function(err, fs){
		callback(err, fs);
	});
}