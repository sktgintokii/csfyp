var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var googleapis = require('./googleapis.js');
mongoose.connect('mongodb://localhost:27017/fyp');


User = mongoose.model('users', {name: String, pw: String});
var fsSchema = Schema({
	name: String,
	type: String,
	children: [{id: Schema.Types.ObjectId}]
});
File = mongoose.model('file', fsSchema);
FileSystem = mongoose.model('FileSystem', {name: String, root: Schema.Types.ObjectId});
Token = mongoose.model('Token', {name: String, Token: Schema.Types.Mixed});

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

exports.initDir = function(name, callback){
	var root = new File({name: "root", type: "dir", children: []});
	var entry = new FileSystem({name: name, root: root._id});
	FileSystem.findOne({name: name}, function(err, user){
		console.log(user);
		if (err) callback(err, null);
		else if (user != null) callback("duplicate uid", null);
		else{
			entry.save(function(err){
				if (err) callback(err, root);
				root.save(function(err){
					callback(err, root);
				})
			});
		}
	})
	
}

exports.getRoot = function(name, callback){
	FileSystem.findOne({name: name}, function(err, root){
		callback(err, root);
	});
}

exports.listFiles = function(id, callback){
	File.findById(id, function(err, file){
		if (err) callback(err, file);
		else{
			// add details to children
			var query = [];
			for (var i = 0; i < file.children.length; i++) query.push(file.children[i]._id);
			File.find({"_id": { $in: query}}, function(err, children){
				callback(err, children);
			});
		}
	});
}

exports.createFolder = function (dirName, id, callback){
	File.findById(id, function(err, file){
		var newFolder = new File({name: dirName, type: "dir", children: []});
		file.children.push(newFolder._id);
		File.findByIdAndUpdate(id, file, function(err){
			if (err) callback(err, null);
			newFolder.save(function(err){
				callback(err, newFolder);
			});
		});
	});
};

exports.uploadFile = function(name, files, callback){
	Token.findOne({name: name}, function(err, entry){
		console.log(entry);
		googleapis.uploadFile(entry.Token, files.attributes, function(err, reply){
			callback(err, reply);
		});
	});
}

/* The Testing function to dump the whole file structure */
function dumpStructure(id, prefix){
	File.findById(id, function(err, file){
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