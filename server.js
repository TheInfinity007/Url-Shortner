'use strict';

require('dotenv').config();
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

// mongodb url
mongoose.connect(process.env.MONGODB_URI, { useUnifiedTopology: true, useNewUrlParser: true });
app.use(cors());

app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.urlencoded({extended: true}));

  
// first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

function getCountAndIncrease(req, res, callback){
	Counter.findOne({}, (err, foundCounter)=>{
		if(err) return console.error(err);
		if(foundCounter){
			foundCounter.count = foundCounter.count+1;
			foundCounter.save();	
			callback(foundCounter.count);
		} 
		else{
			const newCounter = new Counter();
			newCounter.save((err)=>{
				if(err) return console.error(err);
				newCounter.count = 1;
				console.log(newCounter);
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
		console.log("Invalid Protocol");
		return res.json({ error: "invalid URL" });
	}
	console.log("Valid Protocol");
	let domain = protocolMatch[1];
	let domainRegex = /^([a-z0-9_\-]+\.)+[a-zA-Z0-9_\-]+/i;
	let domainNameMatch = domain.match(domainRegex);
	if(!domainNameMatch){
		console.log("Invalid Domain Name");
		return res.json({ error: "invalid URL" });
	}

	dns.lookup(domainNameMatch[0], (err, address, family)=>{
		if(err){
			console.log(err);
			return res.json({ error: "invalid URL" });
		}
		UrlEntries.findOne({ url: url }, (err, urlEntry)=>{
			if(err){
				return console.log(err);
			}
			else if(urlEntry){
				console.log(urlEntry);
				return res.json({ "original_url": urlEntry.url, "short_url": urlEntry.index });
			}else{
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
});

app.get('/api/shorturl/:index', (req, res)=>{
	let int = parseInt(req.params.index);
	if(!int) return res.json({ error: "No short URL found for the given input" });
	UrlEntries.findOne({ index: req.params.index }, (err, foundEntry)=>{
		if(err) return console.error(err);
		console.log(foundEntry)
		if(!foundEntry) return res.json({ error: "invalid URL" });
		return res.redirect(foundEntry.url);
	});
})

app.get('/*', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});	

app.listen(port, function () {
  console.log('Node.js listening ...');
});