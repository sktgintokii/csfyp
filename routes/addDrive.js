var models = require('../models/models.js');
var express = require('express');
var app = express.Router();
var dropboxapis = require('../models/dropboxapis.js');

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

app.use('/getReqToken/dropbox', function(req, res){
	dropboxapis.getRequestToken(function(err, token){
		if (!err){
			req.session.reqToken = token;
			res.redirect(token.authorize_url + '&oauth_callback=' + req.protocol + "://" + req.headers.host + '/addDrive/dropbox');
		}
		else res.send({err: err});
	});
});

// intermediate layer for getting sessions
app.use('/getToken/google', function (req, res){
	models.addGoogleDrive(req.session.username, req.query.code, function(err){
		if (err){
			res.redirect('/addDrive/error?err=' + encodeURIComponent(err));
		} else {
			res.redirect('/addDrive/success');
		}
	});
});

app.use('/getToken/dropbox', function(req, res){
	models.addDropboxDrive(req.session.username, req.session.reqToken, function(err){
		if (err){
			res.redirect('/addDrive/error?err=' + encodeURIComponent(err));
		} else{
			res.redirect('/addDrive/success');
		}
		delete req.session.reqToken;
	});
});

app.get('/dropbox', function(req, res){
	res.redirect('/addDrive/getToken/dropbox');
});

app.get('/google', function (req, res){
	var code = req.query.code;
	if (code){
		res.redirect('/addDrive/getToken/google?code=' + code);
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