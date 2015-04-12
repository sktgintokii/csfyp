var express = require('express');
var google = require('googleapis');
var fs = require('fs');
var https = require('https');
var url = require('url');
var OAuth2 = google.auth.OAuth2;

var CLIENT_ID = '280286530527-lh0iqa2kh1r9si7v7v84ldn181n4caca.apps.googleusercontent.com';
var CLIENT_SECRET = 'KI_FH7VtcI-9XUi_kRrbpXgV';
var REDIRECT_URL = 'http://localhost:3000/addDrive/google';
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

function readChunk(path, offset, size, callback){
	var data = new Buffer(size);

	fs.open(path, 'r', function(err, fd){
		if (err) callback(err, null);
		else{
			var bytesRead = 0;
			while (bytesRead < size) {
	            bytesRead += fs.readSync(fd, data, 0, size, offset);
	        }
	        fs.closeSync(fd);
			callback(null, data);
		}
	});
}

exports.uploadChunk = function (accessToken, attributes, offset, size, order, callback){
	oauth2Client.setCredentials(accessToken);
	oauth2Client.refreshAccessToken(function(err, tokens) {
		if (err) callback(err, order, null);
		else{
			var drive = google.drive({ version: 'v2', auth: oauth2Client });
			readChunk(attributes.path, offset, size, function(err, data){
				if (err) callback(err, order, null);
				else{
					var req = drive.files.insert({
						resource: {
					    	title: attributes.originalname + '.' + order,
					    	mimeType: 'text/plain',
					    	shared: true,
					  	},
					  	media: {
					    	mimeType: 'application/binary',
					    	body: data
					  	}
					}, function(err, reply){
						callback(err, order, reply);
					});
				}
			});
		}
	});
};

// id - file id in google drive
exports.downloadChunk = function (accessToken, id, callback){
	oauth2Client.setCredentials(accessToken);
	oauth2Client.refreshAccessToken(function(err, tokens) {
		if (err) callback(err);
		else{
			var drive = google.drive({ version: 'v2', auth: oauth2Client });
			drive.files.get({fileId: id}, function(err, reply){
				if (err) callback(err, null);
				else{

					var urlObj = url.parse(reply.downloadUrl);

					var options = {
						hostname: urlObj.host,
						path: reply.downloadUrl,
						port: 443,
						method: 'GET',
						headers: {'Authorization': 'Bearer ' + tokens.access_token}
					};
					var req = https.get(options, function(res) {
						res.on('data', function(data) {
							fs.writeFileSync('./downloads/' + reply.title, data, {flag: 'a'});
						});
						res.on('end', function(){
							callback(err, reply);
						});
					}).on('error', function(err) {
					 	callback(err, null);
					});
				}
			});
		}
	});
};

exports.deleteFile = function (accessToken, id, callback){
	oauth2Client.setCredentials(accessToken);
	oauth2Client.refreshAccessToken(function(err, tokens) {
		var drive = google.drive({ version: 'v2', auth: oauth2Client });

		drive.files.delete({fileId: id}, function(err){
			callback(err);
		});
	});
}

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

// to get the available drive size and total drive size
// return quotaBytesUsed, quotaBytesTotal
exports.queryDriveSpace = function(accessToken, callback){
	oauth2Client.setCredentials(accessToken);
	oauth2Client.refreshAccessToken(function(err, tokens) {
		var drive = google.drive({ version: 'v2', auth: oauth2Client });
		drive.about.get({fields:'quotaBytesUsed, quotaBytesTotal, user/emailAddress'}, function(err, reply){
			callback(err, reply);
		});
	});
}