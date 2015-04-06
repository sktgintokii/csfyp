var models = require('../models/models.js');
var express = require('express');
var app = express.Router();

// IN: code
// OUT: err
/*
app.get('/google', function (req, res){
	driveManager.addGoogleDrive(req.session.uid, req.query.code, function(err){
		res.send({err: err});
	}
});
*/

// IN: code
// OUT: err
/*
app.get('/google', function (req, res){
	models.addGoogleDrive('ABC', req.query.code, function(err){
		res.send({err: err});
	});
});
*/
app.use('/addDrive/google', function (req, res){
	models.addGoogleDrive(req.session.uid, req.query.code, function(err){
		if (err){
			res.render('drive-add-err', {
				title: 'error',
				layout: false,
				err: err
			});
		} else {
			res.render('drive-add-success', {
				title: 'success',
				layout: false
			});
		}
	});


});


module.exports = app;