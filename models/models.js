var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var googleapis = require('./googleapis.js');
var dropboxapis = require('./dropboxapis.js');
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
FileSystem = mongoose.model('FileSystem', {uid: String, root: Schema.Types.ObjectId});
Token = mongoose.model('Token', {uid: String, platform: String, owner: String, Token: Schema.Types.Mixed});

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

exports.addGoogleDrive = function (uid, code, callback){
	googleapis.getAccessToken(code, function(err, token){
		if (err) callback(err);
		else{
			googleapis.queryDriveSpace(token, function(err, reply){
				if (err) callbackk(err);
				else{
					Token.findOne({owner: reply.user.emailAddress}, function(err, entry){
						if (err) callback(err);
						else if (entry != null) callback("Duplicate Google Account");
						else if (token.refresh_token == undefined) callback("Refresh token not found", null);
						else{
							var accessToken = new Token({uid: uid, platform: "Google", owner: reply.user.emailAddress, Token: token});
							accessToken.save(function(err){
								callback(err);
							})
						}
					});
				}
			});
		}
	});
};

exports.addDropboxDrive = function (uid, requestToken, callback){
	dropboxapis.getAccessToken(requestToken, function(err, token){
		if (err) callback(err);
		else{
			dropboxapis.queryDriveSpace(token, function(err, reply){
				if (err) callback(err);
				else{
					Token.findOne({owner: reply.email, platform: 'Dropbox'}, function(err, entry){
						if (err) callback(err);
						else if (entry != null) callback("Duplicate Dropbox Account");
						else{
							var accessToken = new Token({uid: uid, platform: 'Dropbox', owner: reply.email, Token: token});
							accessToken.save(function(err){
								callback(err);
							});
						}
					});
				}
			});
			
		}
	});
};

exports.initDir = function(uid, callback){
	var root = new File({name: "root", type: "dir", children: [], parent: null, owner: uid});
	var entry = new FileSystem({uid: uid, root: root._id});
	FileSystem.findOne({uid: uid}, function(err, user){
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
	FileSystem.findOne({uid: uid}, function(err, root){
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
	getAncestor(fileid, uid, function(err, ancestor){
		callback(err, ancestor);
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

// recursive function to select available drive
function selectAvailableDrive(entries, filesize, callback){
	if (entries.length == 0){
		callback(null, null);
	}else{
		var entry = entries[0];
		if (entry.platform == 'Google'){
			googleapis.queryDriveSpace(entry.Token, function(err, reply){
				if (err) callback(err, null);
				else{
					if (reply.quotaBytesTotal - reply.quotaBytesUsed >= filesize) callback(err, entry);
					else{
						entries.shift();
						selectAvailableDrive(entries, filesize, function(err, reply){
							callback(err, reply);
						});
					}
				}
			});
		}else if (entry.platform == 'Dropbox'){
			dropboxapis.queryDriveSpace(entry.Token, function(err, reply){
				if (err) callback(err, null);
				else{
					if (reply.quota_info.quota - reply.quota_info.normal >= filesize) callback(err, entry);
					else{
						entries.shift();
						selectAvailableDrive(entries, filesize, function(err, reply){
							callback(err, reply);
						});
					}
				}
			});
		}
	}
}

exports.uploadFile = function(uid, fileid, files, callback){
	// Find the accesstoken out from Token database
	Token.find({uid: uid}, function(err, entries){
		if (err) callback(err, entry);
		else if (entries == []) callback("Access tokens not found", entries);
		else{
			selectAvailableDrive(entries, files.upload.size, function(err, entry){
				if (err) callback(err, null);
				else if (entry == null) callback("No enough space", null);
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
						dropboxapis.uploadFile(entry.Token, files.upload, function(err, reply){
							console.log(reply);
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
										var newFile = new File({name: files.upload.originalname, type: "file", did: reply.path, drive: entry._id, children: [], parent: fileid, owner: uid});
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
					}
				}
			});
			
		}
	});
}

exports.getDownloadLink = function(uid, fileid, callback){
	File.findById(fileid, function(err, file){
		if (err) callback(err, file);
		else if (file == null) callback("ID not found", null);
		else if (file.type == "dir") callback("Cannot download a directory", null);
		else if (file.did == undefined) callback("No Drive File ID found", null);
		else if (file.owner != uid) callback("Invalid Credential", null);
		else{
			Token.findById(file.drive, function(err, entry){
				if (err) callback(err, entry);
				else if (entry == null) callback("Access tokens not found", entry);
				else{
					if (entry.platform == 'Google'){
						googleapis.queryFile(entry.Token, file.did, function(err, reply){
							callback(err, reply.webContentLink);
						});
					}else if (entry.platform == 'Dropbox'){
						dropboxapis.getDownloadLink(entry.Token, file.did, function(err, reply){
							console.log(reply);
							// Force Download
							callback(err, reply.url.replace('dl=0', 'dl=1'));
						})
					}
				}
			});
		}
	});
}

// recursive function to get capacity
function getCapacity(entries, callback){
	if (entries.length == 0){
		callback(null, []);
	}else{
		var entry = entries[0];
		if (entry.platform == 'Google'){
			googleapis.queryDriveSpace(entry.Token, function(err, capacity){
				if (err) callback(err, []);
				else{
					entries.shift();
					getCapacity(entries, function(err, capacities){
						var newCapacity = {platform: 'Google', email: capacity.user.emailAddress, space: capacity.quotaBytesTotal, usedSpace: capacity.quotaBytesUsed};
						capacities.unshift(newCapacity);
						callback(err, capacities);
					});
				}
			});
		}else if (entry.platform == 'Dropbox'){
			// TODO: Handle Dropbox upload request
			dropboxapis.queryDriveSpace(entry.Token, function(err, capacity){
				if (err) callback(err, []);
				else{
					entries.shift();
					getCapacity(entries, function(err, capacities){
						var newCapacity = {platform: 'Dropbox', email: capacity.email, space: capacity.quota_info.quota, usedSpace: capacity.quota_info.normal};
						capacities.unshift(newCapacity);
						callback(err, capacities);
					});
				}
			})
		}
	}
}

exports.getCapacity = function(uid, callback){
	Token.find({uid: uid}, function(err, entries){
		if (err) callback(err, entries);
		else if (entries == []) callback("Access tokens not found", entries);
		else{
			getCapacity(entries, function(err, capacities){
				var capacity = null;
				if (!err){
					var totalSpace = 0;
					var totalUsedSpace = 0;
					for (var i = 0; i < capacities.length; i++){
						totalSpace += parseInt(capacities[i].space);
						totalUsedSpace += parseInt(capacities[i].usedSpace);
					}
					capacity = {totalSpace: totalSpace, totalUsedSpace: totalUsedSpace, drive: capacities};
				}
				callback(err, capacity);
			});
		}
	});
}

function deleteList(children, uid, callback){
	if (children.length == 0){
		callback(null);
	}else{
		var fileid = children[0];
		deleteFile(fileid, uid, function(err){
			if (err) callback(err);
			else{
				children.shift();
				deleteList(children, uid, function(err){
					callback(err);
				});
			}
		});
	}
}

// support recursive deletion
function deleteFile(fileid, uid, callback){
	File.findById(fileid, function(err, file){
		if (err) callback(err);
		else if (file == null) callback("ID not found");
		else if (file.owner != uid) callback("Invalid Credential");
		else{
			if (file.type == 'file'){
				// find out the token
				Token.findById(file.drive, function(err, token){
					if (err) callback(err, token);
					else if (token == null) callback("Access tokens not found", token);
					else{
						// update parent's children list
						File.findById(file.parent, function(err, parentDir){
							if (err) callback(err);
							else if (parentDir == null) callback("ID not found");
							else if (parentDir.owner != uid) callback("Invalid Credential");
							else{
								for (var i = 0; i < parentDir.children.length; i++){
									if (parentDir.children[i]._id == fileid){
										parentDir.children.splice(i, 1);
										break;
									}
								}
								File.findByIdAndUpdate(file.parent, parentDir, function(err){
									if (err) callback(err);
									else{
										// remove the file in FS
										File.remove({_id: fileid}, function(err){
											if (err) callback(err);
											else{
												if (token.platform == 'Google'){
													// delete in google drive
													googleapis.deleteFile(token.Token, file.did, function(err){
														callback(err);
													});
												}else if (token.platform == 'Dropbox'){
													// TODO: Dropbox delete
													dropboxapis.deleteFile(token.Token, file.did, function(err){
														callback(err);
													})
												}
											}
										});
									}
								});
							}
						});
					}
				});
			}
			// perform recursive delete
			else if (file.type == 'dir'){
				// validate not root
				FileSystem.findOne({uid: uid}, function(err, user){
					if (err) callback(err);
					else if (user == null) callback("uid not found");
					else if (user.root == fileid) callback("Cannot delete root directory");
					else{
						deleteList(file.children, uid, function(err){
							if (err) callback(err);
							else{
								File.findById(file.parent, function(err, parentDir){
									if (err) callback(err);
									else if (parentDir == null) callback("ID not found");
									else if (parentDir.owner != uid) callback("Invalid Credential");
									else{
										for (var i = 0; i < parentDir.children.length; i++){
											if (parentDir.children[i]._id == fileid){
												parentDir.children.splice(i, 1);
												break;
											}
										}
										File.findByIdAndUpdate(file.parent, parentDir, function(err){
											if (err) callback(err);
											else{
												// remove the file in FS
												File.remove({_id: fileid}, function(err){
													callback(err);
												});
											}
										});
									}
								});
							}
						});
					}
				});
			}
		}
	});
}

exports.deleteFile = function(fileid, uid, callback){
	deleteFile(fileid, uid, function(err){
		callback(err);
	});
};

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
	FileSystem.find({uid: name}, function(err, fs){
		if (err){
			console.log(err);
			callback(err, fs);
		}
		var rootId = fs[0].root;
		console.log("ROOTID = " + rootId);
		dumpStructure(rootId, "");
	});
}