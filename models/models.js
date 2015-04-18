var mongoose = require('mongoose');
var fs = require('fs');
var Schema = mongoose.Schema;
var googleapis = require('./googleapis.js');
var dropboxapis = require('./dropboxapis.js');
var exec = require('child_process').exec;
mongoose.connect('mongodb://localhost:27017/fyp');

User = mongoose.model('users', {name: String, pw: String});
var fsSchema = Schema({
	name: String,
	type: String,
	owner: String,
	// id in cloud drive(only for non-dir), cloud drive id(only for non-dir), chunk size in bytes
	dist: [{drive: Schema.Types.ObjectId, did: String, size: Number}],
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

exports.addDropboxDrive = function (uid, requestToken	, callback){
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
	var root = new File({name: "root", type: "dir", children: [], dist: [], parent: null, owner: uid});
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
			var newFolder = new File({name: dirName, type: "dir", children: [], parent: fileid, owner: uid, dist: []});
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

// get the bytes distribution list from the drive, return array
function getDistributionList(entries, filesize, callback){
	var remainNo = entries.length;
	var retError = null;
	var capacities = new Array(entries.length);
	var totalCapacity = 0;
	var dist = [];
	if (remainNo == 0){
		callback("No enough space", []);
		return;
	}
	for (var i = 0; i < entries.length; i++){
		getCapacity(i, entries[i], function(err, id, capacity){
			if (err) retError = err;
			else{
				capacities[id] = capacity.space - capacity.usedSpace;
				totalCapacity += capacity.space - capacity.usedSpace;
			}
			remainNo--;
			if (remainNo == 0){
				if (retError) callback(retError, []);
				else if (totalCapacity < filesize) callback("No enough space", []);
				else{
					for (var i = 0; i < entries.length; i++){
						if (filesize <= capacities[i]){
							dist.push(filesize);
							callback(null, dist);
							break;
						}else{
							dist.push(capacities[i]);
							filesize -= capacities[i];
						}
					}
				}
			}
		});
	}
}

exports.uploadFile = function(uid, fileid, files, callback){
	// Find the accesstoken out from Token database
	Token.find({uid: uid}, function(err, entries){
		if (err) callback(err, entry);
		else if (entries == []) callback("Access tokens not found", entries);
		else{
			getDistributionList(entries, files.upload.size, function(err, dist){
				if (err) callback(err, null);
				else{
					var remainNo = dist.length;
					var retError = null;
					var driveInfo = new Array(dist.length);
					var offset = 0;
					for (var i = 0; i < remainNo; i++){
						if (entries[i].platform == 'Google'){
							googleapis.uploadChunk(entries[i].Token, files.upload, offset, dist[i], i, function(err, id, reply){
								if (err) retError = err;
								else{
									driveInfo[id] = {};
									driveInfo[id].drive = entries[id]._id;
									driveInfo[id].did = reply.id;
									driveInfo[id].size = dist[id];
								}
								remainNo--;
								if (remainNo == 0){
									if (retError) callback(retError, null);
									else{
										// Find out the directory by fileid
										File.findById(fileid, function(err, dir){
											if (err) callback(err, dir);
											else if (dir == null) callback("ID not found", null);
											else if (dir.type != "dir") callback("Cannot upload file to a non-directory", null);
											else if (dir.owner != uid) callback("Invalid Credential", null);
											else{
												// create the new file and add perform add children
												var newFile = new File({name: files.upload.originalname, type: "file", dist: driveInfo, children: [], parent: fileid, owner: uid});
												dir.children.push(newFile._id);
												File.findByIdAndUpdate(fileid, dir, function(err){
													if (err) callback(err, null);
													newFile.save(function(err){
														fs.unlinkSync(files.upload.path);
														callback(err, newFile);
													});
												});
											}
										});
									}
								}
							});
						}else if (entries[i].platform == 'Dropbox'){
							dropboxapis.uploadChunk(entries[i].Token, files.upload, offset, dist[i], i, function(err, id, reply){
								if (err) retError = err;
								else{
									driveInfo[id] = {};
									driveInfo[id].drive = entries[id]._id;
									driveInfo[id].did = files.upload.originalname + '.' + id;
									driveInfo[id].size = dist[id];
								}
								remainNo--;
								if (remainNo == 0){
									if (retError) callback(retError, null);
									else{
										// Find out the directory by fileid
										File.findById(fileid, function(err, dir){
											if (err) callback(err, dir);
											else if (dir == null) callback("ID not found", null);
											else if (dir.type != "dir") callback("Cannot upload file to a non-directory", null);
											else if (dir.owner != uid) callback("Invalid Credential", null);
											else{
												// create the new file and add perform add children
												var newFile = new File({name: files.upload.originalname, type: "file", dist: driveInfo, children: [], parent: fileid, owner: uid});
												dir.children.push(newFile._id);
												File.findByIdAndUpdate(fileid, dir, function(err){
													if (err) callback(err, null);
													newFile.save(function(err){
														fs.unlinkSync(files.upload.path);
														callback(err, newFile);
													});
												});
											}
										});
									}
								}
							});
						}
						offset += dist[i];
					}
				}
			});
		}
	});
}

function getTokenById(id, order, callback){
	Token.findById(id, function(err, entry){
		callback(err, order, entry);
	});
}

function downloadFile(uid, fileid, prefix, callback){
	File.findById(fileid, function(err, file){
		if (err) callback(err, file);
		else if (file == null) callback("ID not found", null);
		else if (file.owner != uid) callback("Invalid Credential", null);
		else{
			if (file.type == 'file'){
				if (file.dist.length == 0) callback("No Storage found", null);
				else{
					var remainNo = file.dist.length;
					var retError = null;
					for (var i = 0; i < file.dist.length; i++){
						getTokenById(file.dist[i].drive, i, function(err, id, entry){
							if (err) retError = err;
							else if (entry == null) retError = "Access tokens not found";
							else{
								if (entry.platform == 'Google'){
									googleapis.downloadChunk(entry.Token, file.dist[id].did, prefix, function(err){
										if (err) retError = err;
										else{
											remainNo--;
											if (remainNo == 0){
												if (retError) callback(retError, null);
												else{
													// Reassembly the file
													var targetPath = process.cwd() + '/Downloads/' + prefix + file.name;
													fs.writeFileSync(targetPath, '', {flag: 'w'});
													for (var i = 0; i < file.dist.length; i++){
														var chunkPath = process.cwd() + '/Downloads/' + prefix + file.name + '.' + i;
														var buffer = fs.readFileSync(chunkPath);
														fs.writeFileSync(targetPath, buffer, {flag: 'a'});
														fs.unlinkSync(chunkPath);
													}
													callback(err, targetPath);
												}
											}
										}
									});
								}else if (entry.platform == 'Dropbox'){
									// DDMD
									dropboxapis.downloadChunk(entry.Token, file.dist[id].did, prefix, function(err){
										if (err) retError = err;
										else{
											remainNo--;
											if (remainNo == 0){
												if (retError) callback(retError, null);
												else{
													// Reassembly the file
													var targetPath = process.cwd() + '/Downloads/' + prefix + file.name;
													fs.writeFileSync(targetPath, '', {flag: 'w'});
													for (var i = 0; i < file.dist.length; i++){
														var chunkPath = process.cwd() + '/Downloads/' + prefix + file.name + '.' + i;
														var buffer = fs.readFileSync(chunkPath);
														fs.writeFileSync(targetPath, buffer, {flag: 'a'});
														fs.unlinkSync(chunkPath);
													}
													callback(err, targetPath);
												}
											}
										}
									});
								}
							}
						});
					}
				}
			}else if (file.type == 'dir'){
				var remainNo = file.children.length;
				var retError = null;
				var fileName = '';
				if (prefix == '') fileName = prefix + file.name + Date.now();
				else fileName = prefix + file.name;
				var fullfileName = process.cwd() + '/Downloads/' + fileName;
				fs.mkdirSync(fullfileName);
				for (var i = 0; i < file.children.length; i++){
					downloadFile(uid, file.children[i], fileName + '/', function(err, path){
						if (err) retError = err;
						remainNo--;
						if (remainNo == 0){
							callback(retError, fileName);
						}
					});
				}
			}
		}
	});
}

var escapeShell = function(cmd) {
  return cmd.replace(/(["\s'$`\\])/g,'\\$1');
};

exports.downloadFile = function(uid, fileid, callback){
	File.findById(fileid, function(err, file){
		if (err) callback(err, file);
		else if (file == null) callback("ID not found", null);
		else if (file.owner != uid) callback("Invalid Credential", null);
		else if (file.type == 'file'){
			downloadFile(uid, fileid, '', function(err, path){
				callback(err, path);
			});
		}else if (file.type == 'dir'){
			downloadFile(uid, fileid, '', function(err, path){
				exec("cd downloads; zip -r " + "\"" + path + "\"" + ".zip " + "\"" + path + "\"", function (error, stdout, stderr) {
					callback(err, "downloads/" + path + ".zip");
				});
			});
		}
	});
}

// function to get a disk capacity
function getCapacity(id, entry, callback){
	if (entry.platform == 'Google'){
		googleapis.queryDriveSpace(entry.Token, function(err, capacity){
			if (err) callback(err, null);
			else{
				var newCapacity = {platform: 'Google', email: capacity.user.emailAddress, space: capacity.quotaBytesTotal, usedSpace: capacity.quotaBytesUsed};
				callback(err, id, newCapacity);
			}
		});
	}else if (entry.platform == 'Dropbox'){
		dropboxapis.queryDriveSpace(entry.Token, function(err, capacity){
			if (err) callback(err, null);
			else{
				var newCapacity = {platform: 'Dropbox', email: capacity.email, space: capacity.quota_info.quota, usedSpace: capacity.quota_info.normal};
				callback(err, id, newCapacity);
			}
		})
	}
}

exports.getCapacity = function(uid, callback){
	Token.find({uid: uid}, function(err, entries){
		if (err) callback(err, entries);
		else if (entries == []) callback("Access tokens not found", entries);
		else{
			if (entries.length == 0){
				var retCapacity = {totalSpace: 0, totalUsedSpace: 0, drive: []};
				callback(null, retCapacity);
			}else{
				var remainNo = entries.length;
				var retError = null;
				var totalSpace = 0;
				var totalUsedSpace = 0;
				var capacities = new Array(entries.length);
				for (var i = 0; i < entries.length; i++){
					getCapacity(i, entries[i], function(err, id, capacity){
						if (!err){
							totalSpace += Number(capacity.space);
							totalUsedSpace += Number(capacity.usedSpace);
							capacities[id] = capacity;
						}else retError = err;
						remainNo--;
						if (remainNo == 0){
							if (retError) callback(retError, null);
							else{
								var retCapacity = {totalSpace: totalSpace, totalUsedSpace: totalUsedSpace, drive: capacities};
								callback(retError, retCapacity);
							}
						}
					})
				}
			}
		}
	});
}

// support recursive deletion
function deleteFile(fileid, uid, callback){
	File.findById(fileid, function(err, file){
		if (err) callback(err);
		else if (file == null) callback("ID not found");
		else if (file.owner != uid) callback("Invalid Credential");
		else{
			if (file.type == 'file'){
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
										// find out the token
										var remainNo = file.dist.length;
										var retError = null;
										for (var i = 0; i < file.dist.length; i++){
											getTokenById(file.dist[i].drive, i, function(err, id, token){
												if (err) retError = err;
												else if (token == null) retError = "Access tokens not found";
												else{
													if (token.platform == 'Google'){
														// delete in google drive
														googleapis.deleteFile(token.Token, file.dist[id].did, function(err){
															if (err) retError = err;
															remainNo--;
															if (remainNo == 0){
																callback(retError);
															}
														});
													}else if (token.platform == 'Dropbox'){
														// TODO: Dropbox delete
														dropboxapis.deleteFile(token.Token, file.dist[id].did, function(err){
															if (err) retError = err;
															remainNo--;
															if (remainNo == 0){
																callback(retError);
															}
														})
													}
												}
											});
										}
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
						// delete all children
						var remainNo = file.children.length;
						var retError = null;
						// empty directory
						if (remainNo == 0){
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
						}else{
							for (var i = 0; i < file.children.length; i++){
								deleteFile(file.children[i], uid, function(err){
									remainNo--;
									if (err) retError = err;
									if (remainNo == 0){
										if (retError) callback(retError);
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
									}
								});
							}
						}
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

exports.moveFile = function(sfileid, dfileid, uid, callback){
	File.findById(sfileid, function(err, sfile){
		if (err) callback(err);
		else if (sfile == null) callback("Source File ID not found");
		else if (sfile.owner != uid) callback("Invalid Credential");
		else{
			File.findById(dfileid, function(err, dfile){
				if (err) callback(err);
				else if (dfile == null) callback("Destination File ID not found");
				else if (dfile.owner != uid) callback("Invalid Credential");
				else if (dfile.type != 'dir') callback("Moving a file to a non-directory");
				else{
					// validate not root
					FileSystem.findOne({uid: uid}, function(err, user){
						if (err) callback(err);
						else if (user == null) callback("uid not found");
						else if (user.root == sfileid) callback("Cannot move root directory");
						else{
							// Validate if source file is not ancestor of destination file
							getAncestor(dfileid, uid, function(err, ancestor){
								if (err) callback(err);
								else{
									var valid = true;
									for (var i = 0; i < ancestor.length; i++){
										if (ancestor[i]._id == sfileid){
											valid = false;
											break;
										}
									}
									if (!valid) callback("Cannot move a directory to its descendant");
									else{
										// adding a child to destination dir
										dfile.children.push(sfileid);
										File.findByIdAndUpdate(dfileid, dfile, function(err){
											if (err) callback(err);
											else{
												// Find parent of source file, delete it's child
												File.findById(sfile.parent, function(err, parentDir){
													if (err) callback(err);
													else if (parentDir == null) callback("parent ID not found");
													else if (parentDir.owner != uid) callback("Invalid Credential");
													else{
														for (var i = 0; i < parentDir.children.length; i++){
															if (parentDir.children[i]._id == sfileid){
																parentDir.children.splice(i, 1);
																break;
															}
														}
														File.findByIdAndUpdate(sfile.parent, parentDir, function(err){
															// Update parent of source file
															if (err) callback(err);
															else{
																sfile.parent = dfileid;
																File.findByIdAndUpdate(sfileid, sfile, function(err){
																	callback(err);
																})
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
					});
				}
			});
		}
	});
}

// recursive function to search file
function searchFile(fileid, uid, filename, prefix, callback){
	File.findById(fileid, function(err, file){
		if (err) callback(err, []);
		else if (file == null) callback("File ID not found", []);
		else if (file.owner != uid) callback("Invalid Credential", []);
		else if (file.type == 'file'){
			if (file.name == filename){
				var ret = JSON.parse(JSON.stringify(file));
				ret.path = prefix + file.name;
				callback(null, [ret]);
			}else callback(null, []);
		}else{
			if (file.children.length == 0) callback(null, []);
			else{
				var remainNo = file.children.length;
				var retError = null;
				var retFiles = [];
				for (var i = 0; i < file.children.length; i++){
					searchFile(file.children[i], uid, filename, prefix + file.name + "/", function(err, files){
						if (err) retError = err;
						else retFiles = retFiles.concat(files);
						remainNo--;
						if (remainNo == 0){
							callback(retError, retFiles);
						}
					});
				}
			}
		}
	});
};

exports.searchFile = function(fileid, uid, filename, callback){
	searchFile(fileid, uid, filename, 'root/', function(err, files){
		callback(err, files);
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