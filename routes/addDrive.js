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
	models.addGoogleDrive(req.session.username, req.query.code, function(err){
		res.send({err: err});
	});
});
*/

// intermediate layer for getting session
app.use('/addDrive/getToken', function (req, res){
	models.addGoogleDrive(req.session.uid, req.query.code, function(err){
		if (err){
			res.redirect('/addDrive/error?err=' + JSON.stringify(err));
		} else {
			res.redirect('/addDrive/success');
		}
	});
})

app.get('/addDrive/google', function (req, res){
	var code = req.query.code;
	if (code){
		res.redirect('/addDrive/getToken?code=' + code);
	} else {
		res.redirect('/addDrive/error?err=' + JSON.stringify(err));
	}
});

app.get('/addDrive/success', function (req, res){
	res.render('drive-add-success', {
		title: 'success',
		layout: false
	});
})

app.get('/addDrive/error', function (req, res){
	res.render('drive-add-err', {
		title: 'error',
		layout: false,
		err: err
	});
})


module.exports = app;