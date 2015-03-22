var models = require('../models/models.js');
var express = require('express');
var app = express.Router();

app.get('/init', function (req, res){
	models.init(req.query.uid, function(err, ret){
		res.send({err: err, ret: ret});
	});
});

app.get('/getRoot', function (req, res){
	console.log("Query = " + req.query.uid);
	models.getRoot(req.query.uid, function(err, root){
		if (err) res.status(400).json({'err': err}).end();
		else{
			models.listFiles(root.root, function(err, file){
				if (err) res.status(400).json({'err': err}).end();
				else res.json(file).end();
			});
		}
	});
});

app.get('/lsDir', function(req, res){
	models.listFiles(req.query.fileId, function(err, file){
		res.send({err: err, file: file});
	});
});

app.get('/createDir', function (req, res){
	models.createFolder(req.query.name, req.query.fileId, function(err, file){
		res.send({err: err, file: file});
	});
});

module.exports = app;