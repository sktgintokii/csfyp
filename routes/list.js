var express = require('express');
var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;

var CLIENT_ID = '280286530527-lh0iqa2kh1r9si7v7v84ldn181n4caca.apps.googleusercontent.com';
var CLIENT_SECRET = 'KI_FH7VtcI-9XUi_kRrbpXgV';
var REDIRECT_URL = 'http://localhost:5000/redirect';
var oauth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);

var accessTokens = require('./accessTokens');

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

var DBurl = 'mongodb://localhost:27017/myproject';

var app = express.Router();

app.get('/', function (req, res){

	// Use connect method to connect to the Server
	MongoClient.connect(DBurl, function(err, db) {
		if (err){
			console.log(err);
			return res.status(500).json({'dbError': 'check server log'}).end();
		}
	  assert.equal(null, err);
	  console.log("Connected correctly to server");
	  var fileStructure = db.collection('fileStructure');
	  fileStructure.insert([
	    {a : 1}, {a : 2}, {a : 3}
	  ], function(err, result) {
	  	console.log(result);
	    console.log("Inserted 3 documents into the document collection");
	  });
	  fileStructure.find({}).toArray(function(err, docs) {
	    console.log("Found the following records");
	    console.dir(docs);
	  });
	  db.close();
	});

	
/*
	oauth2Client.setCredentials(accessTokens);
	var drive = google.drive({ version: 'v2', auth: oauth2Client });
	var ret;
	drive.files.list(function(err, resp, body){
		res.send(resp.items);
	});
*/
});

module.exports = app;