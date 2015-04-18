var express = require('express');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var models = require('../models/models.js');

var inputPattern = {
	userid: /\w+/
};

module.exports = function (){
	var app = express.Router();
	app.use(bodyParser.urlencoded({extended:true}));
	app.use(expressValidator());


	app.post('/api/register', function (req, res){
		models.createUser(req.body.userid, req.body.email, req.body.pw, req.body.pw2, function(err){
			if (err) return res.status(400).json({err: err}).end();
			else return res.status(200).end();
		});
	});

	app.post('/api/changepw', function(req, res){
		models.changePassword(req.body.userid, req.body.oldpw, req.body.newpw1, req.body.newpw2, function(err){
			if (err) return res.status(400).json({err: err}).end();
			else return res.status(200).end();
		});
	});

	// Expected route: /account/register
	app.use('/register', function (req, res){
		res.render('register-panel', {
			title: 'Dr. Hub - Register',
			layout: 'register',
		});
	});


	return app;
}