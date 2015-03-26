var express = require('express');
var google = require('googleapis');
var fs = require('fs');
var OAuth2 = google.auth.OAuth2;

var CLIENT_ID = '280286530527-lh0iqa2kh1r9si7v7v84ldn181n4caca.apps.googleusercontent.com';
var CLIENT_SECRET = 'KI_FH7VtcI-9XUi_kRrbpXgV';
var REDIRECT_URL = 'http://localhost:5000/redirect';
var oauth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);

// to get accessToken by code
exports.getAccessToken = function(code, callback){
	oauth2Client.getToken(code, function(err, token){
		callback(err, token);
	})
}

// to get information of an acccessToken
// this function is used to check if a user used two duplicate accounts
exports.getTokenInfo = function(accessToken, callback){
	oauth2Client.setCredentials(accessToken);
	callback(oauth2Client.tokenInfo);
}

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
	oauth2Client.setCredentials(accessToken);
	oauth2Client.refreshAccessToken(function(err, tokens) {

		var drive = google.drive({ version: 'v2', auth: oauth2Client });

		fs.readFile(attributes.path, function (err, data){
			if (err) callback(err, null);
			else{
				var req = drive.files.insert({
					resource: {
				    	title: attributes.name,
				    	mimeType: 'text/plain',
				    	shared: true
				  	},
				  	media: {
				    	mimeType: 'text/plain',
				    	body: data
				  	}
				}, function(err, reply){
					if (err) callback(err, reply);
					else{
						fs.unlink("./uploads/" + attributes.name, function(err){
							if (err) callback(err, null);
							else{
								drive.permissions.insert({
									fileId: reply.id,
									resource: {
										role: "reader",
										type: "anyone",
										withLink: true
									}
								}, function(err, resp){
										
								});
							}
						});
					}
				});
			}
		});
	});
};

// to get data of the file in google drive(e.g. download link, size, ...)
// id provided by Google Drive
exports.queryFile = function(accessToken, id, callback){
	oauth2Client.setCredentials(accessToken);
	oauth2Client.refreshAccessToken(function(err, tokens) {
		var drive = google.drive({ version: 'v2', auth: oauth2Client });

		drive.files.get({fileId: id}, function(err, reply){
			callback(err, reply);
		});
	});
}