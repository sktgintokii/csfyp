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
app.get('/google', function (req, res){
	models.addGoogleDrive(req.query.uid, req.query.code, function(err){
		res.send({err: err});
	});
});

module.exports = app;