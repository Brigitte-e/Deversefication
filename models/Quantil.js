const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const quantilSchema = new Schema({
    currency: String,
    quantilValue: Number
});

// Create a model
const Quantil = module.exports = mongoose.model('Quantil', quantilSchema)