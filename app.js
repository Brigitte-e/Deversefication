const express = require('express'),
    morgan = require('morgan'),
    bodyParser = require('body-parser'),
    compression = require('compression'),
    cors = require('cors');

const app = express();

const { PORT } = require('./config/settings');

require('./config/db')('diplom_deversefication');

app.use(morgan('dev'));
app.use(cors());
app.use(compression());

const apiRoutes = require('./routes/api');

app.use('/api', apiRoutes);

const port = PORT || 3000;

app.listen(port, (req, res) => {
    console.info('Server listening on PORT:', port);
});