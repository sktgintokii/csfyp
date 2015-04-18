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

// IN: session.username
// OUT: err, ret
app.get('/initDir', function (req, res){
	models.initDir(req.session.username, function(err, ret){
		res.send({err: err, ret: ret});
	});
});

// IN: session.username
// OUT: err, dir
app.get('/getRoot', function (req, res){
	models.getRoot(req.session.username, function(err, root){
		if (err) res.status(400).json({err: err, dir: null}).end();
		else{
			models.listFiles(root.root, req.session.username, function(err, dir){
				if (err) res.status(400).json({err: err, dir: null}).end();
				else res.send({err: err, dir: dir});
			});
		}
	});
});

// IN: session.username
// OUT: err, _id
app.get('/getRootId', function(req, res){
	models.getRoot(req.session.username, function(err, root){
		if (err) res.status(400).json({'err': err, _id: null}).end();
		else res.send({_id: root.root, err: null});
	});
})

// IN: fileid
// OUT: err, dir
app.get('/lsDir', function(req, res){
	models.listFiles(req.query.fileid, req.session.username, function(err, file){
		res.send({err: err, dir: file});
	});
});

// IN: fileid
// OUT: err, ancestor
app.get('/getAncestor', function(req, res){
	models.getAncestor(req.query.fileid, req.session.username, function(err, ancestor){
		res.send({err: err, ancestor: ancestor});
	});
});

// IN: name, fileid
// OUT: err, dir
app.get('/createDir', function (req, res){
	models.createFolder(req.query.name, req.query.fileid, req.session.username, function(err, dir){
		res.send({err: err, dir: dir});
	});
});

// IN: session.username, fileid
// OUT: err, downloadLink
app.get('/getDownloadLink', function(req, res){
	models.downloadChunk(req.session.username, req.query.fileid, function(err, filePath){
		//res.send({err: err, downloadLink: downloadLink});
		res.download(filePath);
	});
});

// IN: files, body.fileid
// OUT: err, reply
app.post('/uploadFile', function(req, res){
	if(done==true){
		models.uploadFile(req.session.username, req.body.fileid, req.files, function(err, reply){
			res.send({err: err, reply: reply});
		});
	}
});

// IN: session.username
// OUT: err, capacity
app.get('/getCapacity', function(req, res){
	models.getCapacity(req.session.username, function(err, capacity){
		res.send({err: err, capacity: capacity});
	});
});

// IN: fileid, session.username
// OUT: err
app.get('/deleteFile', function (req, res){
	models.deleteFile(req.query.fileid, req.session.username, function(err){
		res.send({err: err});
	});
});

// IN: sfileid, dfileid
// OUT: err
app.get('/moveFile', function (req, res){
	models.moveFile(req.query.sfileid, req.query.dfileid, req.session.username, function(err){
		res.send({err: err});
	});
});

// IN: fileid, session.username, filename
// OUT: err, [file]
app.get('/searchFile', function(req, res){
	models.searchFile(req.query.fileid, req.session.username, req.query.filename, function(err, files){
		res.send({err: err, files: files});
	})
});

// For testing
app.get('/initDirTest', function (req, res){
	models.initDir(req.query.username, function(err, ret){
		res.send({err: err, ret: ret});
	});
});

module.exports = app;