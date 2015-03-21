var express = require('express');
var app = express();
var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var googleDrive = require('google-drive');

var CLIENT_ID = '164054556606-2j76m04jjjcqatp8jqgbb86agskefv82.apps.googleusercontent.com';
var CLIENT_SECRET = 'BpxXK7hicRbKfOMS9j9I1R07';
var REDIRECT_URL = 'http://localhost:3000/oauthcallback';

var oauth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
var code;

app.use(express.static('public'));
app.use('/node_modules', express.static('node_modules'))

// generate a url that asks permissions for Google+ and Google Calendar scopes
var scopes = [
  'https://www.googleapis.com/auth/drive'
];

var url = oauth2Client.generateAuthUrl({
  access_type: 'offline', // 'online' (default) or 'offline' (gets refresh_token)
  scope: scopes // If you only need one scope you can pass it as string
});


app.use('/oauthcallback', function(req, res){
	oauth2Client.getToken(req.query.code, function(err, tokens){
		if (!err){
			oauth2Client.setCredentials(tokens);
			res.send(tokens).end();
		}

		else{
			res.status(500).send({error:err});
		}
	});
})



app.use('/upload', function(req, res){
	var drive = google.drive({ version: 'v2', auth: oauth2Client });

	drive.files.insert({
	  resource: {
	    title: 'Test',
	    mimeType: 'text/plain'
	  },
	  media: {
	    mimeType: 'text/plain',
	    body: 'Hello World'
	  }
	}, function(err){
		if (err) 
			console.log(err);
	});


	drive.files.list(function(err, resp, body){
		var list = resp.items.map(function(item){
			return item.title;
		})
		res.send(list);
	});
});

//app.use('/', function(req, res){
	//res.redirect(url);
//});




app.listen(process.env.PORT || 3000, function() {
	console.log('Running server at port ', (process.env.PORT || 3000));
})



