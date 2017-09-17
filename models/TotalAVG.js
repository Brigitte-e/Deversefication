const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const totalSumSchema = new Schema({
    currency: String,
    summa: Number
});

// Create a model
const TotalAVG = module.exports = mongoose.model('TotalAVG', totalSumSchema)