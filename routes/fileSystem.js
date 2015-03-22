var models = require('../models/models.js');

app.get('/init', function (req, res){
	models.init(req.query.name, function(err, ret){
		res.write({err: err, ret: ret});
	});
});

app.get('/getRoot', function (req, res){
	models.getRoot(req.query.name, function(err, rootId){
		if (err) res.write({err: err, file: null});
		else{
			models.listFiles(rootId, function(err, file){
				res.write({err: err, file: file});
			});
		}
	});
});

app.get('/lsDir', function(req, res){
	models.listFiles(req.query.id, function(err, file){
		res.write({err: err, file: file});
	});
});

app.get('/createDir', function (req, res){
	models.createFolder(req.query.id, function(err, file){
		res.write({err: err, file: file});
	});
});

module.exports = app;