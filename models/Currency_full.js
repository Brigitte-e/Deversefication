const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const currencyFullSchema = new Schema({
    date: "",
    bank: "",
    baseCurrency: "",
    baseCurrencyLit: "",
    exchangeRate: [
        {baseCurrency: String, currency: String, saleRateNB: Number, purchaseRateNB: Number}
    ]
});

// Create a model
const Currency_full = module.exports = mongoose.model('Currency_full', currencyFullSchema)