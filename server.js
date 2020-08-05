'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dns = require('dns');
var cors = require('cors');
const Counter = require('./models/counter');
const UrlEntries = require('./models/urlEntries');


var app = express();

var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.DB_URI);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.urlencoded({extended: true}));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.post('/api/shorturl/new', (req, res)=>{
	let url = req.body.url;
	const protocolRegex = /^https?:\/\/(.*)/i;
	console.log(url);
	var w3 = dns.lookup("www.google.com", (err, address, family)=>{
		if(err) console.log("The error is ", err);
		else console.log(address, family);
	})
	res.json({
		original_url: req.body.url,
		short_url: 5
	});
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});