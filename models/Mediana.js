const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const medianaSchema = new Schema({
    currency: String,
    madianaValue: Number
});

// Create a model
const Mediana = module.exports = mongoose.model('Mediana', medianaSchema)