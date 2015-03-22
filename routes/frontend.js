var express = require('express'),
	bodyParser = require('body-parser'),
	session = require('express-session'),
	cookieParser = require('cookie-parser'),
	expressValidator = require('express-validator');

module.exports = function (){
	var path = '/';
	var app = express.Router();

	app.use(bodyParser.urlencoded({extended:true}));
	app.use(cookieParser());

	app.get('/', function (req, res){
		console.log(req.session);
		res.render('main-panel', {
			title: 'main',
			layout: 'main',
			uid: req.session.username
		});
	});

	return app;
};