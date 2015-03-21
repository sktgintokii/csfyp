var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/fyp');

User = mongoose.model('uesrs', {name: String, pw: String});
exports.createUser = function (name, pw, callback){
	var user = new User({name: name, pw: pw});
	user.save(function(err){
		callback(err);
	});
};

exports.findUser = function (name, callback){
	User.find({}, function(err, user){
		callback(err, user);
	});
}