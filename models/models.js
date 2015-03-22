var mongoose = require('mongoose');
var Schema = mongoose.Schema;
mongoose.connect('mongodb://localhost:27017/fyp');


User = mongoose.model('users', {name: String, pw: String});
var fsSchema = Schema({
	name: String,
	type: String,
	children: [{id: Schema.Types.ObjectId}]
});
File = mongoose.model('file', fsSchema);
FileSystem = mongoose.model('FileSystem', {name: String, root: Schema.Types.ObjectId});

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
	var root = new File({name: "root", type: "dir", children: []});
	var entry = new FileSystem({name: name, root: root._id});
	entry.save(function(err){
		if (err) callback(err, null);
		root.save(function(err){
			callback(err, null);
		})
	});
}

exports.getRoot = function(name, callback){
	FileSystem.findOne({name: name}, function(err, root){
		callback(err, root);
	});
}

exports.createFolder = function (dirName, id, callback){
	File.find({_id: id}, function(err, file){
		var newFolder = new File({name: dirName, type: "dir", children: []});
		
		file[0].children.push(newFolder._id);
		File.findByIdAndUpdate(id, file[0], function(err){
			if (err) callback(err, null);
			newFolder.save(function(err){
				callback(err, newFolder);
			});
		});
	});
};

exports.listFiles = function(id, callback){
	File.findById(id, function(err, file){
		callback(err, file);
	});
}

/*
	The Testing function to dump the whole file structure
*/

function dumpStructure(id, prefix){
	File.findById(id, function(err, file){
		//console.log("File: ");
		//console.log(file);
		console.log(prefix + "Name: " + file.name + ", ID: " + id + ", Type: " + file.type);
		for (var i = 0; i < file.children.length; i++){
			dumpStructure(file.children[i]._id, prefix + "--");
		}
	});
	
}

exports.dumpStructure = function (name, callback){
	FileSystem.find({name: name}, function(err, fs){
		if (err){
			console.log(err);
			callback(err, fs);
		}
		var rootId = fs[0].root;
		console.log("ROOTID = " + rootId);
		dumpStructure(rootId, "");
	});
}