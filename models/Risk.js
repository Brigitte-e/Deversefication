const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const riskSchema = new Schema({
    currency: String,
    riskValue: Number
});

// Create a model
const Risk = module.exports = mongoose.model('risk', riskSchema)