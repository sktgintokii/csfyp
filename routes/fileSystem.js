var models = require('../models/models.js');
var express = require('express');
var app = express.Router();

app.get('/init', function (req, res){
	models.init(req.query.uid, function(err, ret){
		res.write({err: err, ret: ret});
	});
});

app.get('/getRoot', function (req, res){
	models.getRoot(req.query.uid, function(err, rootId){
		if (err) res.write({err: err, file: null});
		else{
			models.listFiles(rootId, function(err, file){
				res.write({err: err, file: file});
			});
		}
	});
});

app.get('/lsDir', function(req, res){
	models.listFiles(req.query.fileId, function(err, file){
		res.write({err: err, file: file});
	});
});

app.get('/createDir', function (req, res){
	models.createFolder(req.query.name, req.query.fileId, function(err, file){
		res.write({err: err, file: file});
	});
});

module.exports = app;