const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const avarageResultSchema = new Schema({
    currency: String,
    currencyAvgValue: Number
});

// Create a model
const AvarageResult = module.exports = mongoose.model('AvarageResult', avarageResultSchema)