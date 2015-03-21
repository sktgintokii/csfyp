var express = require('express');
var app = express();


app.use(express.static('public'));
app.use('/node_modules', express.static('node_modules'))




app.listen(process.env.PORT || 3000, function() {
	console.log('Running server at port ', (process.env.PORT || 3000));
})



