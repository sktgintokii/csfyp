var express = require('express'),
 	bodyParser = require('body-parser'),
 	expressValidator = require('express-validator'),
 	session = require('express-session'),
 	crypto = require('crypto'),
 	csurf = require('csurf'),
 	cookieParser = require('cookie-parser'),
 	models = require('../models/models.js');


var inputPattern = {
	username: /^[\w- ']{4,20}$/,
	password: /^[\w- ']{4,20}$/
};

function hmacPassword(password, salt){
	var hmac = crypto.createHmac('sha256', salt);
	hmac.update(password);

	return hmac.digest('base64');
}

module.exports = function (){
	var path = '/';
	var app = express.Router();
	var csrfProctection = csurf({cookie: true});

	app.use(bodyParser.urlencoded({extended:true}));
	app.use(expressValidator());
	app.use(session({
		name: 'auth',
		secret: crypto.randomBytes(16).toString('base64'),
		resave: false,
		saveUninitialized: false,
		cookie: {path: path, maxAge: 1000*60*60*24*3, httpOnly: true}
	}));
	app.use(cookieParser());

	// expected path = /login
	app.get('/login', csrfProctection, function (req, res){
		var sess = req.session;
		if (sess){
			if (sess.user)
				return res.redirect('/');
		}

		res.render('login-panel', {
			title: 'Dr. Hub - Login',
			layout: 'login',
			csrfToken: req.csrfToken()
		});
	});

	app.post('/api/logout', function (req, res){
		req.session.destroy();
		res.redirect('/login');
	});

	app.post('/api/login', function (req, res){
		//TODO:
		//1. input sanitization
		/*
		req.checkBody('username', 'Invalid Username')
			.matches(inputPattern.username);

		req.checkBody('password', "Invalid Password")
			.matches(inputPattern.password);

		if (req.validationErrors()){
			return res.status(400).json({
				'inputErrors': req.validationErrors()
			}).end();
		}
		*/

		//TODO
		//2. Query database for authentication
		/*
		pool.query('SELECT * FROM users WHERE username = ? LIMIT 1',
			[req.body.username],
			function(error, result){
				if (error){
					console.error(error);
					return res.status(500).json({'dbError': 'check server log'}).end();
				} else {
					if (result.rowCount == 0){
						return res.status(400).json({
							'LoginError': 'Invalid credentials'
						}).end();
					} 

					var submittedSaltedPW = hmacPassword(req.body.password, result.rows[0].salt);
					if (submittedSaltedPW != result.rows[0].saltedPassword){
						return res.status(400).json({
							'LoginError': 'Invalid credentials'
						}).end();							
					}

					req.session.regenerate(function(err){
						req.session.username = req.body.username;
						req.session.admin = result.rows[0].admin;
						//res.redirect('/admin');
						res.status(200).json({'loginOK': 1}).end();
					});
				}
			});
*/
		res.clearCookie("cutFileId");

		models.loginUser(req.body.username, req.body.password, function(err){
			if (err) return res.status(400).end();
			else{
				req.session.regenerate(function(err){
					req.session.username = req.body.username;
					req.session.user = 1;
					res.status(200).json({'loginOK': 1}).end();
				});
			}
		});

/*
		if (req.body.username === 'ABC' && req.body.password === '123'){
			
		} else {
			
		}
		*/
	});

	app.use('/', function (req, res, next){
		//TODO: if OK, then next route: admin
		//otherwise return to admin page
		var sess = req.session;
		if (sess){
			//console.log(sess);
			if (sess.user)
				return next();
		}

		if (req.xhr){
			return res.status(400).json({
				'loginError': 'Session Expired'
			}).end();
		} else {
			return res.redirect('/login');
		}
	});

	return app;
};