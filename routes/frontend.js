var express = require('express');

module.exports = function (){
	var app = express.Router();

	app.get('/', function (req, res){
		res.render('main-panel', {
			title: 'main',
			layout: 'main'
		});
	});

	return app;
};