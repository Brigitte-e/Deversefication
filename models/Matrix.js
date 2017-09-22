const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const matrixSchema = new Schema({
    keycurrency: String,
    result: Number
});

// Create a model
const Matrix = module.exports = mongoose.model('Matrix', matrixSchema)