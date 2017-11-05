const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const dispersiaSchema = new Schema({
    currency: String,
    dispersiaValue: Number
});

// Create a model
const Dispersia = module.exports = mongoose.model('Dispersia', dispersiaSchema)