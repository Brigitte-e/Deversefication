const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const currencySchema = new Schema({
    date: String,
    currency: String,
    currencyValue: Number
});

// Create a model
const Currency = module.exports = mongoose.model('Currency', currencySchema)