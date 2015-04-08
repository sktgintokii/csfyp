var express = require('express');
var dbox = require('dbox');
var dboxapp = dbox.app({'app_key': 'hd3yg65610nyn3z', 'app_secret': '3x03qjvc55bec7u'});
var fs = require('fs');

/*
var dbox = require("dbox");
var fs = require('fs');
var app  = dbox.app({"app_key": "hd3yg65610nyn3z", "app_secret": "3x03qjvc55bec7u"});
var access_token = require("./access_token.js");
var client = app.client(access_token);
var filePath = process.argv[2];	
client.get(filePath, function(status, reply){
	fs.writeFile(filePath, reply.toString(), function(err){
		if (err){
			console.log(err);
		}else{
			console.log("Saved the file " + filePath);
		}
	})
});
*/

/*
Template of attributes
{ fieldname: 'userPhoto',
     originalname: '11045879_979045172108200_327412626_o.jpg',
     name: '11045879_979045172108200_327412626_o1427047054618.jpg',
     encoding: '7bit',
     mimetype: 'image/jpeg',
     path: 'uploads/11045879_979045172108200_327412626_o1427047054618.jpg',
     extension: 'jpg',
     size: 314839,
     truncated: false,
     buffer: null } }
*/
exports.uploadFile = function (accessToken, attributes, callback){
	var client = dboxapp.client(accessToken);
	fs.readFile(attributes.path, function (err, data){
		if (err) callback(err, null);
		else{
			client.put(attributes.name, data, function(status, reply){
				if (status != 200) callback(reply, null);
				else{
					fs.unlink("./uploads/" + attributes.name, function(err){
						callback(err, reply);
					});
				}
			});
		}
	});
};

exports.deleteFile = function (accessToken, id, callback){
	var client = dboxapp.client(accessToken);
	client.rm(id, function(status, reply){
		if (status != 200) callback(reply);
		else callback(null);
	});
}

exports.getDownloadLink = function(accessToken, id, callback){
	var client = dboxapp.client(accessToken);
	client.shares(id, {short_url: false}, function(status, reply){
		console.log(reply);
		if (status != 200) callback(reply, null);
		else callback(null, reply);
	});
}

exports.getRequestToken = function(callback){
	dboxapp.requesttoken(function(status, reply){
		if (status != 200) callback(token, null);
		else callback(null, reply);
	});
}

// to get accessToken
exports.getAccessToken = function(requestToken, callback){
	dboxapp.accesstoken(requestToken, function(status, accessToken){
		if (status != 200) callback(accessToken, null);
		else callback(null, accessToken);
	});
}

// to get the available drive size and total drive size
// return quotaBytesUsed, quotaBytesTotal
exports.queryDriveSpace = function(accessToken, callback){
	var client = dboxapp.client(accessToken);
	client.account(function(status, reply){
		if (status != 200) callback(reply, null);
		else callback(null, reply);
	});
}