var express = require('express'),
	bodyParser = require('body-parser'),
	session = require('express-session'),
	cookieParser = require('cookie-parser'),
	expressValidator = require('express-validator');

module.exports = function (){
	var path = '/';
	var app = express.Router();
	var googleLogoutLink = "https://www.google.com/accounts/Logout?continue=";
	var googleAuthUrl = "https://accounts.google.com/o/oauth2/auth?access_type=offline&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive&response_type=code&client_id=280286530527-lh0iqa2kh1r9si7v7v84ldn181n4caca.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2FaddDrive%2Fgoogle"

	app.use(bodyParser.urlencoded({extended:true}));
	app.use(cookieParser());

	app.get('/', function (req, res){
		console.log(req.session);

		res.render('main-panel', {
			title: 'main',
			layout: 'main',
			googleAuthUrl: googleLogoutLink + encodeURIComponent(googleAuthUrl),
			uid: req.session.username
		});
	});

	return app;
};
