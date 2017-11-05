const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const vybircaSchema = new Schema({
    currency: String,
    vybircaValue: Number
});

// Create a model
const Vybirca = module.exports = mongoose.model('Vybirca', vybircaSchema)