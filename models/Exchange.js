const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const exchangeSchema = new Schema({
    date: "",
    bank: "",
    baseCurrency: "",
    baseCurrencyLit: "",
    exchangeRate: [
        {baseCurrency: String, currency: String, saleRateNB: Number, purchaseRateNB: Number}
    ]
});

// Create a model
const Exchange = module.exports = mongoose.model('Exchange', exchangeSchema);