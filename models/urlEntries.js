const mongoose = require('mongoose');

const UrlEntriesSchema = new mongoose.Schema({
	url: { type: String, required: true },
	index: { type: Number, required: true }
});

module.exports = mongoose.model("UrlEntries", UrlEntriesSchema);