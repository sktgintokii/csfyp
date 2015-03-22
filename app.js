var express = require('express'),
	exphbs  = require('express-handlebars');


var authAPIRouter = require('./routes/auth.api.js'),
	frontEndRouter = require('./routes/frontend.js');
	fileSystemRouter = require('./routes/fileSystem.js');


var app = express();
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use(express.static('public'));
app.use('/node_modules', express.static('node_modules'))


app.use('/', authAPIRouter());
app.use('/fs', fileSystemRouter);
app.use('/', frontEndRouter());


app.listen(process.env.PORT || 3000, function() {
	console.log('Running server at port ', (process.env.PORT || 3000));
})