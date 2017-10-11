const mongoose = require('mongoose');
const { MONGOOSE_URI, MONGOOSE_URI_PROD } = require('./settings');

module.exports = (dbName) => {
	//console.log(MONGOOSE_URI);
	mongoose.Promise = Promise;
	var mongodbUri;
	if(process.env.LOCALE === 'production') {
		mongodbUri = MONGOOSE_URI_PROD + dbName;
	} else {
		mongodbUri = MONGOOSE_URI + dbName;
	}
	
	//var mongodbUri = MONGOOSE_URI_PROD + dbName;
	var options = {
	  useMongoClient: true,
	  socketTimeoutMS: 0,
	  keepAlive: true,
	  reconnectTries: 30
	};

	mongoose.connect(mongodbUri, options);

	mongoose.connection.on('connected', () => {
		//mongoose.connection.db.dropDatabase(); // delete for production
	    console.log('Connected to DB ' + mongodbUri);
	});

	mongoose.connection.on('error', (err) => {
	    console.log('DB error: ' + err);
	}); 

	//mongoose.set('debug', true);

}