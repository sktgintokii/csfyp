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
		console.log('fuck you jimmy');
		models.createUser(req.body.userid, req.body.email, req.body.pw, req.body.pw2, function(err){
			res.send({err: err});
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