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
exports.getAccessToken = function(callback){
	dboxapp.requesttoken(function(status, request_token){
		if (status != 200) callback(status, request_token);
		else{
			console.log(request_token);
			dboxapp.accesstoken(request_token, function(status, access_token){
				callback(status, access_token);
			});
		}
	});
}