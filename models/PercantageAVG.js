const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const percantageAvarageSchema = new Schema({
    date: Date,
    currency: String,
    percentValue: Number
});

// Create a model
const PercentageAvarage = module.exports = mongoose.model('PercentageAvarage', percantageAvarageSchema)