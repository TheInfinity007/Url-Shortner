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

function getCountAndIncrease(req, res, callback){
	Counter.findOne({}, (err, foundCounter)=>{
		if(err) return console.error(err);
		if(foundCounter){
			console.log("Old Counter found", foundCounter);
			foundCounter.count = foundCounter.count+1;
			foundCounter.save();	
			callback(foundCounter.count);
		} 
		else{
			console.log("creating new Counter");
			const newCounter = new Counter();
			newCounter.save((err)=>{
				if(err) return console.error(err);
				newCounter.count = 1;
				console.llog(newCounter);
				callback(newCounter.count);
			})
		}
	})
}

app.post('/api/shorturl/new', (req, res)=>{
	let url = req.body.url;
	if(url.match(/\/$/i))	url = url.slice(0, -1);
	console.log(url);	
	const protocolRegex = /^https?:\/\/(.*)/i;
	const protocolMatch = url.match(protocolRegex);

	if(!protocolMatch){
		return console.log("Invalid Protocol");
	}
	console.log("Valid Protocol");
	let domain = protocolMatch[1];
	let domainRegex = /^([a-z0-9_\-]+\.)+[a-zA-Z0-9_\-]+/i;
	let domainNameMatch = domain.match(domainRegex);
	if(!domainNameMatch){
		return console.log("Invalid Domain Name");
	}

	dns.lookup(domainNameMatch[0], (err, address, family)=>{
		if(err){
			console.log(err);
			return console.log("Invalid Url");
		}
		console.log(address, family);
		console.log("HEII");
		UrlEntries.find({}, (err, urlEntry)=>{
			console.log("YUP")
			if(err){
				return console.log(err);
			}else if(urlEntry){
				console.log("Found Old Entry")
				res.json({ "original_url": urlEntry.name, "short_url": urlEntry.index });
			}else{
				console.log("Does Not found Old Entry");
				getCountAndIncrease(req, res, (count)=>{
					console.log("Creating New Url Entry");
					const newUrlEntry = UrlEntries({
						"url": url,
						"index": count
					});
					newUrlEntry.save((err)=>{
						if(err) return console.error(err);
						console.log(newUrlEntry);
						res.json({ "original_url": url, "short_url": count  });
					})
				})
			}
		})
	})
	res.json({
		original_url: req.body.url,
		short_url: 5
	});
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});