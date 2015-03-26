var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var googleapis = require('./googleapis.js');
mongoose.connect('mongodb://localhost:27017/fyp');

Token = mongoose.model('Token', {uid: String, platform: String, owner: String, Token: Schema.Types.Mixed});

exports.addGoogleDrive = function (uid, code, callback){
	googleapis.getAccessToken(code, function(err, token){
		if (err) callback(err);
		else if (token.refresh_token == undefined) callback("Refresh token not found");
		else{
			googleapis.getAccessToken(code, function(tokenInfo){
				Token.findOne({owner: tokenInfo.issued_to}, function(err, entry){
					if (err) callback(err);
					else if (entry != null) callback("Duplicate Google Account");
					else{
						var accessToken = new Token({uid: uid, platform: "Google", owner: tokenInfo.issued_to, Token: token});
						accessToken.save(function(err){
							callback(err);
						})
					}
				})
			});
		}
	});
};