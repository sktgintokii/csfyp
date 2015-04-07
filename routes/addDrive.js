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
app.use('/getToken', function (req, res){
	models.addGoogleDrive(req.session.username, req.query.code, function(err){
		if (err){
			res.redirect('/addDrive/error?err=' + JSON.stringify(err));
		} else {
			res.redirect('/addDrive/success');
		}
	});
})

app.get('/google', function (req, res){
	var code = req.query.code;
	if (code){
		res.redirect('/addDrive/getToken?code=' + code);
	} else {
		res.redirect('/addDrive/error?err=' + JSON.stringify(err));
	}
});

app.get('/success', function (req, res){
	res.render('drive-add-success', {
		title: 'success',
		layout: false
	});
})

app.get('/error', function (req, res){
	res.render('drive-add-err', {
		title: 'error',
		layout: false,
		err: req.query.err
	});
})


module.exports = app;