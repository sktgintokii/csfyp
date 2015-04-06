var express = require('express');

module.exports = function (){
	var app = express.Router();

	// Expected route: /account/register
	app.use('/register', function (req, res){
		res.render('register-panel', {
			title: 'Register',
			layout: false,
		});
	});

	return app;
}