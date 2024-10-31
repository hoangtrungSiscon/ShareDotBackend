const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const authMiddleware = require('./middleware/authMiddleware');

const mainSubjectRoute = require('./routes/mainsubjects');
const categoriesRoute = require('./routes/categories');
const chaptersRoute = require('./routes/chapters');
const documentRoute = require('./routes/documents');
const storageRoute = require('./routes/storage');
const documentinteractionsRoute = require('./routes/documentinteraction');
const auth = require('./routes/auth')

app.use(bodyParser.json());

// app.use((req, res, next) => {
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
//     if (req.method === 'OPTIONS') {
//         res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
//         return res.status(200).json({});
//     }
//     if (req.method === 'OPTIONS') {
//         res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
//         return res.status(200).json({});
//     }
//     next();
// })

app.use(cors());

app.use('/api/auth', auth);
app.use('/api/mainsubjects', mainSubjectRoute);
app.use('/api/categories', categoriesRoute);
app.use('/api/chapters', chaptersRoute);
app.use('/api/documents', documentRoute);
app.use('/api/storage', storageRoute);
app.use('/api/documentinteractions', documentinteractionsRoute);

app.use('/', (req, res, next) => {
    const error = new Error('Not found');
    error.status = 404;
    next(error);
});

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    });
});

module.exports = app;