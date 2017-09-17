const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const testSchema = new Schema({
    message: String,
    
});

// Create a model
const Test = module.exports = mongoose.model('Test', testSchema)