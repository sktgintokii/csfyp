var express = require('express');
var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;

var CLIENT_ID = '280286530527-lh0iqa2kh1r9si7v7v84ldn181n4caca.apps.googleusercontent.com';
var CLIENT_SECRET = 'KI_FH7VtcI-9XUi_kRrbpXgV';
var REDIRECT_URL = 'http://localhost:5000/redirect';
var oauth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);

exports.listFile = function (accessToken, callback){
	oauth2Client.setCredentials(accessToken);
	//oauth2Client.refreshAccessToken(function(err, tokens) {
		var drive = google.drive({ version: 'v2', auth: oauth2Client });
		drive.files.list({auth: oauth2Client}, function(err, resp, body){
			callback(err, resp, body);
		});
	//});

};