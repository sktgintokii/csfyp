var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var express = require('express');
var app = express();

var CLIENT_ID = '280286530527-lh0iqa2kh1r9si7v7v84ldn181n4caca.apps.googleusercontent.com';
var CLIENT_SECRET = 'KI_FH7VtcI-9XUi_kRrbpXgV';
var REDIRECT_URL = 'http://localhost:3000/addDrive/google';

var oauth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);

// generate a url that asks permissions for Google+ and Google Calendar scopes
var scopes = [
  'https://www.googleapis.com/auth/drive'
];

var url = oauth2Client.generateAuthUrl({
  access_type: 'offline', // 'online' (default) or 'offline' (gets refresh_token)
  scope: scopes // If you only need one scope you can pass it as string
});

console.log('Auth URL:');
console.log(url);

app.use('/', function (req, res){
	var code = req.query.code;
	console.log(code);
});

app.listen(5000, function(){
	console.log('running');
});

module.exports = app;