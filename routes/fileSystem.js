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
	models.initDir(req.query.username, function(err, ret){
		res.send({err: err, ret: ret});
	});
});

// IN: session.username
// OUT: err, dir
app.get('/getRoot', function (req, res){
	models.getRoot(req.session.username, function(err, root){
		if (err) res.status(400).json({err: err, dir: null}).end();
		else{
			models.listFiles(root.root, function(err, dir){
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
	models.getDownloadLink(req.session.username, req.query.fileid, function(err, downloadLink){
		console.log({err: err, downloadLink: downloadLink});
		res.send({err: err, downloadLink: downloadLink});
	});
});

// IN: files, body.fileid
// OUT: err, reply
app.post('/uploadFile', function(req, res){
	if(done==true){
		console.log(req);
		models.uploadFile(req.session.username, req.body.fileid, req.files, function(err, reply){
			console.log(reply);
			res.send({err: err, reply: reply});
		});
	}
});

module.exports = app;