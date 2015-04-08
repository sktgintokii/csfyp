var express = require('express');
var dbox = require('dbox');
var dboxapp = dbox.app({'app_key': 'hd3yg65610nyn3z', 'app_secret': '3x03qjvc55bec7u'});

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

exports.getRequestToken = function(callback){
	dboxapp.requesttoken(function(status, token){
		callback(status, token);
	});
}

// to get accessToken
exports.getAccessToken = function(requestToken, callback){
	dboxapp.accesstoken(requestToken, function(status, accessToken){
		console.log(status);
		console.log(accessToken);
		callback(status, accessToken);
	});
}

// to get the available drive size and total drive size
// return quotaBytesUsed, quotaBytesTotal
exports.queryDriveSpace = function(accessToken, callback){
	var client = dboxapp.client(accessToken);
	client.account(function(status, reply){
		callback(status, reply);
	});
}