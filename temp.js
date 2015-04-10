function a(id, callback){
	callback(123);
}

id = 1;
a(999, function (content, id){
	console.log(content, id)
});