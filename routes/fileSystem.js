var models = require('../models/models.js');
var express = require('express');
var app = express.Router();
var multer  = require('multer');
var done = false;

/*Configure the multer.*/
app.use(multer({ dest: './uploads/',
rename: function (fieldname, filename) {
	return filename+Date.now();
},
onFileUploadStart: function (file) {
  	//console.log(file.originalname + ' is starting ...')
},
onFileUploadComplete: function (file) {
  	//console.log(file.fieldname + ' uploaded to  ' + file.path)
  	done = true;
}
}));

// IN: uid
// OUT: err, ret
app.get('/initDir', function (req, res){
	models.initDir(req.query.uid, function(err, ret){
		res.send({err: err, ret: ret});
	});
});

// IN: uid
// OUT: err, dir
app.get('/getRoot', function (req, res){
	console.log("Query = " + req.query.uid);
	models.getRoot(req.query.uid, function(err, root){
		if (err) res.status(400).json({err: err, dir: null}).end();
		else{
			models.listFiles(root.root, function(err, dir){
				if (err) res.status(400).json({err: err, dir: null}).end();
				else res.send({err: err, dir: dir});
			});
		}
	});
});

// IN: uid
// OUT: err, _id
app.get('/getRootId', function(req, res){
	models.getRoot(req.query.uid, function(err, root){
		if (err) res.status(400).json({'err': err, _id: null}).end();
		else res.send({_id: root.root, err: null});
	});
})

// IN: fileid
// OUT: err, dir
app.get('/lsDir', function(req, res){
	models.listFiles(req.query.fileid, function(err, file){
		res.send({err: err, dir: file});
	});
});

// IN: name, fileid
// OUT: err, dir
app.get('/createDir', function (req, res){
	models.createFolder(req.query.name, req.query.fileid, function(err, dir){
		res.send({err: err, dir: dir});
	});
});

// IN: files, body.fileid
// OUT: err, reply
app.post('/uploadFile', function(req, res){
	if(done==true){
		models.uploadFile(req.body.uid, req.body.fileid, req.files, function(err, reply){
			console.log(err);
			console.log(reply);
		});
	}
});

module.exports = app;