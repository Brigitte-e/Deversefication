const mongoose = require('mongoose');
const axios = require('axios');

const fs = require('fs');

const router = require('express-promise-router')();
const util = require('util');
const wait = util.promisify(setTimeout);

const Test = require('../models/Test');
const Currency_full = require('../models/Currency_full');
const Currency = require('../models/Currency');
const PercentageAvarage = require('../models/PercantageAVG');
const TotalAVG = require('../models/TotalAVG');
const Risk = require('../models/Risk');
const Matrix = require('../models/Matrix');

router.route('/asdasdadasdasdasdsadregenerate/collections')
    .get(async (req, res, next) => {
		let newFull = new Currency_full();
		
		await newFull.save();
        await getAllCurrencies();// -- remove collection with 0 rate length
        await splitAllCurrenciesToAnotherCollection(); // -- move currencies to another Collection
        await callCalculatePercentage(); // -- calculate percent(%) for all currencies
        await calculateSumOfPercentForAllCurrencies(); // -- calc SUM of %
        await calculateMatrix();
        res.json({ msg: "OK.. Regenerate Collections" })
    });

router.route('/generateMatrix')
    .get(async (req, res, next) => {
        let currenciesArray = req.query.keyvalue.split(',');
        let totalArrayParasm = req.query.value.split(',');
        console.log(currenciesArray);
        console.log(totalArrayParasm);
        let matrixArray = await createFullStaticMatrix(currenciesArray);
		let totalArray = await getTotalForEnteredCurrencies(totalArrayParasm);
		
		if(matrixArray.length === 0) {
			return res.json({
				msg: 'Currency is not defined'
			})
		}
		
		await matrixArray.sort(function(a, b) {
			if(a.subcurrency < b.subcurrency) return -1;
            if(a.subcurrency > b.subcurrency) return 1;
            return 0;
		});
		
        let totalLength = Math.sqrt(currenciesArray.length);
        console.log(totalLength, currenciesArray.length);
        let newArray = matrixArray.reduce((acc, curr, i) => {
            if(!(i % totalLength) ) {
                acc.push(matrixArray.slice(i, i + totalLength));
            }
            return acc;
        }, []);

        res.json({
            curr: newArray,
			total: totalArray
        });

    })

    router.route('/statistics')
        .get(async(req, res, next) => {

            let risk = await Risk.find({});
            let totalAvg = await TotalAVG.find({});

            res.json({
                risk: risk,
                totalavg: totalAvg
            })

        });

    router.route('/getCurrencieForToday') 
        .get(async (req, res, next) => {
            res.json(await getCurrencieForToday())
        })
module.exports = router;


async function getCurrencieForToday() {
    let date = new Date();
    let object = {};
    console.log(date)
    await axios.get('https://api.privatbank.ua/p24api/exchange_rates?json&date='+ (date.getDate() > 5 ? date.getDate()-3 : 1) + '.' + (date.getMonth()+1) + '.' + date.getFullYear())
        .then(function (response) {
            object = response.data;
        }) 
        .catch(function (response) {
            console.log(response);
        })

    return object;
}

async function getTotalForEnteredCurrencies(currencies) {
    let array = [];
    let totalArray = await TotalAVG.find({});
     currencies.forEach(function(currency, i) {
        if(i < currencies.length) {
            totalArray.forEach(function(matrix, j) {
                console.log(matrix.currency, currency);
                //console.log("@#" + j);
                if(matrix.currency === currency) {
                    array.push(matrix);    
                }
            })
        }
    })
    return array;

}

async function createFullStaticMatrix(currencies) {
    let array = [];
    let matrixByKey = await Matrix.find({});

    currencies.forEach(function(currency, i) {
        if(i < currencies.length) {
            matrixByKey.forEach(function(matrix, j) {
                //console.log("@#" + j);
                if(matrix.keycurrency === currency) {
                    array.push(matrix);    
                }
            })
        }
        
        //console.log("#" + i);
    })
    return array;
}

// -- Start 
async function createStaticMatrix(currency) {
    try {
        let keyMatrix = await Matrix.find({maincurrency: currency}); //keycurrency: new RegExp("^"+key, "i")
        // console.log(keyMatrix);   

        // http://mathhelpplanet.com/viewtopic.php?f=44&t=22390

        return keyMatrix.sort(function(a, b) {
            if(a.maincurrency < b.maincurrency) return -1;
            if(a.maincurrency > b.maincurrency) return 1;
            return 0;
        });
    } catch (err) {console.error(err);}
}

// - END

// Start calc matrix
async function calculateMatrix() {
    try{
        let currecnyArr1 = ['USD', 'EUR', 'RUB', 'CZK', 'GBP', 'PLZ', 'SEK', 'SKK', 'HUF', 'CAD', 'ILS', 'JPY'];
        let currecnyArr2 = ['USD', 'EUR', 'RUB', 'CZK', 'GBP', 'PLZ', 'SEK', 'SKK', 'HUF', 'CAD', 'ILS', 'JPY'];
        let totalLength = await PercentageAvarage.count({currency: 'USD'});
        await Matrix.remove({}); // Remove all documents before save
        return await Promise.all(currecnyArr1.map(async function (currency) {
            return await Promise.all(currecnyArr2.map(async function (currencyToCompare) {
                
                await calcResult(currency, currencyToCompare, totalLength);
            }));
        }));
    } catch(err){console.error(err);}
    
}

async function calcResult(currencyStable, currencyChange, totalLength) {
    let stableTotalAVG = await TotalAVG.findOne({currency: currencyStable});
    let changeTotalAVG = await TotalAVG.findOne({currency: currencyChange});
    
    //console.log(stableTotalAVG.currency + " " + changeTotalAVG.currency + " " + totalLength)

    let currencyFirst = await PercentageAvarage.find({currency: currencyStable });
    let currencyComp = await PercentageAvarage.find({currency: currencyChange });

    let array1 = [];
    //console.log(currencyFirst.length)
    return await Promise.all(currencyFirst.map(async function(value, index) {
        array1.push((value.percentValue - stableTotalAVG.summa) * (currencyComp[index].percentValue - changeTotalAVG.summa));

        if(currencyFirst.length - 1 === index) {
            // Do all code
            let summ1 = array1.reduce((a, b) => a+b, 0);
            let summResult = (1 / totalLength) * summ1;

            console.log(currencyStable + '-' + currencyChange + ' : ' + summResult);
            let newMatrix = new Matrix({
                keycurrency: currencyStable + '-' + currencyChange,
				maincurrency: currencyStable,
				subcurrency: currencyChange,
                result: summResult
            });

            await newMatrix.save();
        }
    }));
}

// Start -- Risk
async function calculateRisk() {
    let currenciesPercents = await TotalAVG.find({});

    return await Promise.all(currenciesPercents.map(async function(percent){
        calculateRiskByTotal(percent);
    }));
}

async function calculateRiskByTotal(percent) {
    let avaragePercentsForCurrency = await PercentageAvarage.find({currency: percent.currency});   
    let calculateArr = [];
    return await Promise.all(avaragePercentsForCurrency.map(async function(percentItem, index) {
        calculateArr.push(Math.pow((percentItem.percentValue - percent.summa), 2));
        
        if (index === avaragePercentsForCurrency.length - 1) {
            // var sum = [1, 2, 3].reduce((a, b) => a + b, 0);
            // Math.pow(4, 3);
            console.log(percent.currency)
            let summ = calculateArr.reduce((a, b) => a+b, 0);
            console.log('SUM', summ);
            let summDiv = summ / (avaragePercentsForCurrency.length-1);
            console.log('DIV', summDiv);
            let summSqrt = Math.sqrt(summDiv);
            console.log('SQRT', summSqrt);
            console.log(percent.currency, calculateArr.length, summSqrt);

            let newRisk = new Risk({
                currency: percent.currency,
                riskValue: summSqrt
            });

            await newRisk.save();
        }
    }));   
}

// -- End

// START -> Calculate SUM of all %
async function calculateSumOfPercentForAllCurrencies() {
    let currecnyArr = ['USD', 'EUR', 'RUB', 'CZK', 'GBP', 'PLZ', 'SEK', 'SKK', 'HUF', 'CAD', 'ILS', 'JPY'];
    await TotalAVG.remove({}); // Remove all documents before save
    return await Promise.all(currecnyArr.map(async function (currency) {
        await getSumOfCurrenciesByPercentageAvg(currency);
    }));
}

async function getSumOfCurrenciesByPercentageAvg(enteredCurrency) {
    var result = await PercentageAvarage.find({ currency: enteredCurrency });
    let sum = 0;
    console.log('Save resul for currency:', enteredCurrency);
    return await Promise.all(result.map(async function (value, index) {
        sum += value.percentValue;
        if (index === result.length - 1) {
            let newTotal = new TotalAVG({
                currency: value.currency,
                summa: (sum / result.length)
            })
            await newTotal.save();
        }
    }));
}
// End -> Calculate SUM of all %


// START -> Calculate % value for every CURRENCY
async function callCalculatePercentage() {
    await PercentageAvarage.remove({});
    let currencyArr = ['USD', 'EUR', 'RUB', 'CZK', 'GBP', 'PLZ', 'SEK', 'SKK', 'HUF', 'CAD', 'ILS', 'JPY'];
    return await Promise.all(currencyArr.map(async function(value) {
        console.log(value);
        await calculatePercentage(value);
    }));
}

async function calculatePercentage(value) {
    let currencies = await Currency.find({currency: value}).sort({ date: 1 });
    let startCurrency = 0;
    let previousResult;
    return await Promise.all(currencies.map(async function(currency, index) {
        let percentValue = 0;
        if(index === 0) {
            startCurrency = currency.currencyValue - 0.02;
            percentValue = (currency.currencyValue - startCurrency) / startCurrency;
            previousResult = currency.currencyValue;
        } else {
            percentValue = (currency.currencyValue - previousResult) / previousResult;
            previousResult = currency.currencyValue;
        }
        //console.log(currency, percentValue, previousResult);
        let newPercentageAvg = new PercentageAvarage({ 
            date: currency.date, 
            currency: currency.currency, 
            percentValue: percentValue * 100});
        await newPercentageAvg.save();
    }));
}
// END -> Calculate % value for every CURRENCY

// Convert date TO ISO format
async function convertDateToISO(oldDate) {
    // "01.01.2013"
    console.log('Date to pasre:', oldDate);
    let tempDate = oldDate.split('.');
    let newDate = tempDate[2] + '-' + tempDate[1] + '-' + tempDate[0];
    return new Date(newDate).toISOString();
}

// Split Currencies to Another Collection
async function splitAllCurrenciesToAnotherCollection(params) {
    await Currency.remove({});
    let currencies = await Currency_full.find({});
    
    return await Promise.all(currencies.map(async function (currency) {
        await calculateToSplit(currency.exchangeRate, currency.date);
    }));
}

async function calculateToSplit(currency, date) {
    //let currencyArr =  ['USD', 'EUR', 'RUB', 'CZK', 'GBP', 'PLZ', 'SEK', 'SKK', 'HUF', 'CAD', 'ILS', 'JPY'];
    let USD, EUR, RUB, CZK, GBP, PLZ, SEK, SKK, HUF, CAD, ILS, JPY;
    date = await convertDateToISO(date);
    return await Promise.all(currency.map(async function (value) {
        if (value.currency === 'USD') {
            console.log(value.currency, value.purchaseRateNB);
            USD = new Currency({ currency: value.currency, currencyValue: value.purchaseRateNB, date: date });
            await USD.save();
        } else if (value.currency === 'EUR') {
            console.log(value.currency, value.purchaseRateNB);
            EUR = new Currency({ currency: value.currency, currencyValue: value.purchaseRateNB, date: date });
            await EUR.save();
        } else if (value.currency === 'RUB') {
            console.log(value.currency, value.purchaseRateNB);
            RUB = new Currency({ currency: value.currency, currencyValue: value.purchaseRateNB, date: date });
            await RUB.save();
        } else if (value.currency === 'CZK') {
            console.log(value.currency, value.purchaseRateNB);
            CZK = new Currency({ currency: value.currency, currencyValue: value.purchaseRateNB, date: date });
            await CZK.save();
        } else if (value.currency === 'GBP') {
            console.log(value.currency, value.purchaseRateNB);
            GBP = new Currency({ currency: value.currency, currencyValue: value.purchaseRateNB, date: date });
            await GBP.save();
        } else if (value.currency === 'PLZ') {
            console.log(value.currency, value.purchaseRateNB);
            PLZ = new Currency({ currency: value.currency, currencyValue: value.purchaseRateNB, date: date });
            await PLZ.save();
        } else if (value.currency === 'SEK') {
            console.log(value.currency, value.purchaseRateNB);
            SEK = new Currency({ currency: value.currency, currencyValue: value.purchaseRateNB, date: date });
            await SEK.save();
        } else if (value.currency === 'SKK') {
            console.log(value.currency, value.purchaseRateNB);
            SKK = new Currency({ currency: value.currency, currencyValue: value.purchaseRateNB, date: date });
            await SKK.save();
        } else if (value.currency === 'HUF') {
            console.log(value.currency, value.purchaseRateNB);
            HUF = new Currency({ currency: value.currency, currencyValue: value.purchaseRateNB, date: date });
            await HUF.save();
        } else if (value.currency === 'CAD') {
            console.log(value.currency, value.purchaseRateNB);
            CAD = new Currency({ currency: value.currency, currencyValue: value.purchaseRateNB, date: date });
            await CAD.save();
        } else if (value.currency === 'ILS') {
            console.log(value.currency, value.purchaseRateNB);
            ILS = new Currency({ currency: value.currency, currencyValue: value.purchaseRateNB, date: date });
            await ILS.save();
        } else if (value.currency === 'JPY') {
            console.log(value.currency, value.purchaseRateNB);
            JPY = new Currency({ currency: value.currency, currencyValue: value.purchaseRateNB, date: date });
            await JPY.save();
        }
    }));
}

/*
Model.findById(yourid).exec(
        function(err, doc) {
            var newdoc = new Model(doc);
            newdoc ._id = mongoose.Types.ObjectId();
            newdoc .save(callback);
        }
    );
*/

// Regenerate ALL EMPTY currencies and reFILL previous result
async function getAllCurrencies() {
    let currencies = await Currency_full.find({});
    let previousResult;
    return await Promise.all(currencies.map(async function (currency) {
        if (currency.exchangeRate.length === 0) {
            await Currency_full.findByIdAndRemove({ _id: currency.id });
        } else {
            previousResult = currency;
        }
    }))
}

// INSERT TO DB - DONE (NEED few CHECK) -- -Parse Private Currencies
// await getCurrencyCorseByPeriod(2013, 2017);
// async function getCurrencyCorseByPeriod(startPeriod, endPeriod) {
//     //await Currency_full.remove({});
//     for (var i = startPeriod; i <= endPeriod; i++) {
//         await enterPoint(i);
//     }
// }

async function enterPoint(year) {
            var isLeap = ((year % 4) == 0 && ((year % 100) != 0 || (year % 400) == 0));
            const days = await [31, (isLeap ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            console.log(days);

            const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
            console.log(months);

            for (var i = 0; i < months.length; i++) {
                console.log('$' + i);
                await saveResultbyDays(days[i], months[i], i, year);
            }
            return true;
        }

async function saveResultbyDays(days, month, i, year) {
            var dateObj = await new Date();
            var currMonth = await dateObj.getUTCMonth() + 1; //months from 1-12
            var currDay = await dateObj.getUTCDate();
            var currYear = await dateObj.getUTCFullYear();

            for (var day = 1; day <= days; day++) {
                console.log('Day#' + day);
                if (currDay != day || currMonth != month || currYear != year) {
                    await wait(2500);
                    await backgroundUpdateProcess(year, month, day);
                } else {
                    console.log('FINISH CALCULATING #', day + ':' + month + ':' + year);
                    break;
                    return;
                }
            }
            await wait(60000);
        }

async function backgroundUpdateProcess(year, month, day) {
            await axios.get(generateNBUurl(day + '.' + month + '.' + year))
                .then(function (response) {
                    console.log('Fetch #' + year + "." + month + "." + day);
                    saveCurrency(response);
                })
                .catch(function (response) {
                    console.log(response);
                });
        }

function generateNBUurl(date) {
            return 'https://api.privatbank.ua/p24api/exchange_rates?json&date=' + date;
        }

async function saveCurrency(response) {
            const currency = new Currency_full(response.data);
            await currency.save();
        }

// async function insertCurrenciesToMongoFromJSON() {
//     try{ 
//         mongoose.connection.db.dropDatabase();
//         await Currency_full.create();
//         await Currency_full.insertMany(CurrensiesBackup);
//     } catch(err) {
//         console.log('Error:', err);
//     }
// }