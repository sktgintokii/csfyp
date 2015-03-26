var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var googleapis = require('./googleapis.js');
mongoose.connect('mongodb://localhost:27017/fyp');


User = mongoose.model('users', {name: String, pw: String});
var fsSchema = Schema({
	name: String,
	type: String,
	did: String, // id in cloud drive(only for non-dir)
	owner: String,
	drive: Schema.Types.ObjectId, // cloud drive id(only for non-dir)
	children: [{id: Schema.Types.ObjectId}],
	parent: Schema.Types.ObjectId
});
File = mongoose.model('file', fsSchema);
FileSystem = mongoose.model('FileSystem', {name: String, root: Schema.Types.ObjectId});
Token = mongoose.model('Token', {name: String, platform: String, Token: Schema.Types.Mixed});

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

exports.initDir = function(uid, callback){
	var root = new File({name: "root", type: "dir", children: [], parent: null, owner: uid});
	var entry = new FileSystem({name: uid, root: root._id});
	FileSystem.findOne({name: uid}, function(err, user){
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

exports.getRoot = function(uid, callback){
	FileSystem.findOne({name: uid}, function(err, root){
		if (root == null) callback("uid not found", null);
		else callback(err, root);
	});
}

exports.listFiles = function(fileid, uid, callback){
	File.findById(fileid, function(err, file){
		if (err) callback(err, file);
		else if (file == null) callback("ID not found", null);
		else if (file.type != "dir") callback("Cannot list a non-directory", null);
		else if (file.owner != uid) callback("Invalid Credential", null);
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

// recursive function to return list
function getAncestor(fileid, uid, callback){
	File.findById(fileid, function(err, file){
		if (err) callback(err, null);
		else if (file == null) callback("Fail to get ancestor list(Pointer failure)", null);
		else if (file.owner != uid) callback("Invalid Credential", null);
		else{
			if (file.parent != null){
				getAncestor(file.parent, uid, function(err, ancestor){
					ancestor.push(file);
					callback(err, ancestor);
				});
			}
			else callback(err, [file]);
		}
	});
}

exports.getAncestor = function(fileid, uid, callback){
	getAncestor(fileid, function(err, ancestor){
		callback(err, uid, ancestor);
	});
}

exports.createFolder = function (dirName, fileid, uid, callback){
	File.findById(fileid, function(err, file){
		if (err) callback(err, file);
		else if (file == null) callback("ID not found", null);
		else if (file.type != "dir") callback("Cannot upload file to a non-directory", null);
		else if (file.owner != uid) callback("Invalid Credential", null);
		else{
			var newFolder = new File({name: dirName, type: "dir", children: [], parent: fileid, owner: uid});
			file.children.push(newFolder._id);
			File.findByIdAndUpdate(fileid, file, function(err){
				if (err) callback(err, null);
				newFolder.save(function(err){
					callback(err, newFolder);
				});
			});
		}
	});
};

exports.uploadFile = function(uid, fileid, files, callback){
	// Find the accesstoken out from Token database
	Token.findOne({name: uid}, function(err, entry){
		if (err) callback(err, entry);
		else if (entry == null) callback("Access tokens not found", entry);
		else{
			if (entry.platform == 'Google'){
				// upload file to Google Drive

				googleapis.uploadFile(entry.Token, files.upload, function(err, reply){
					if (err) callback(err, reply);
					else{
						// Find out the directory by fileid
						File.findById(fileid, function(err, dir){
							if (err) callback(err, dir);
							else if (dir == null) callback("ID not found", null);
							else if (dir.type != "dir") callback("Cannot upload file to a non-directory", null);
							else if (dir.owner != uid) callback("Invalid Credential", null);
							else{
								// create the new file and add perform add children
								var newFile = new File({name: files.upload.originalname, type: "file", did: reply.id, drive: entry._id, children: [], parent: fileid, owner: uid});
								dir.children.push(newFile._id);
								File.findByIdAndUpdate(fileid, dir, function(err){
									if (err) callback(err, null);
									newFile.save(function(err){
										callback(err, newFile);
									});
								});
							}
						});
					}
				});
			}else if (entry.platform == 'Dropbox'){
				// TODO: Handle Dropbox upload request
			}
		}
	});
}

exports.getDownloadLink = function(uid, fileid, callback){
	Token.findOne({name: uid}, function(err, entry){
		if (err) callback(err, entry);
		else if (entry == null) callback("Access tokens not found", entry);
		else{
			File.findById(fileid, function(err, file){
				if (err) callback(err, file);
				else if (file == null) callback("ID not found", null);
				else if (file.type == "dir") callback("Cannot download a directory", null);
				else if (file.did == undefined) callback("No Drive File ID found", null);
				else if (file.owner != uid) callback("Invalid Credential", null);
				else{
					googleapis.queryFile(entry.Token, file.did, function(err, reply){
						console.log(reply);
						callback(err, reply.webContentLink);
					});
				}
			});
		}
	});
}

/* The Testing function to dump the whole file structure */
function dumpStructure(id, prefix){
	File.findById(id, function(err, file){
		if (file != null){
			console.log(prefix + "Name: " + file.name + ", ID: " + id + ", Type: " + file.type);
			for (var i = 0; i < file.children.length; i++){
				dumpStructure(file.children[i]._id, prefix + "--");
			}
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