var express = require('express');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');

var inputPattern = {
	userid: /\w+/
};

module.exports = function (){
	var app = express.Router();
	app.use(bodyParser.urlencoded({extended:true}));
	app.use(expressValidator());


	app.post('/api/register', function (req, res){
		req.checkBody('userid', 'Invalid user Id')
			.matches(inputPattern.userid);


		// quit processing if encountered an input validation error
		var errors = req.validationErrors();
		if (errors) {
			return res.status(400).json({'inputError': errors}).end();
		}

		
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