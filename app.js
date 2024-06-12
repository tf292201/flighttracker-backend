const express = require('express');
const app = express();
const cors = require('cors');
const { NotFoundError } = require('./helpers/expressError');

// Define route to fetch aircraft within bounding box
const aircraftRoutes = require('./routes/aircraft');
const userRoutes = require('./routes/user');
const mapRoutes = require('./routes/map');
const authMiddleware = require('./middleware/auth');


app.use(cors());
app.use(express.json());
app.use(authMiddleware.authenticateJWT);

app.use('/aircraft', aircraftRoutes);
app.use('/user', userRoutes);
app.use('/map', mapRoutes);

// 404 handler
app.use(function (req, res, next) {
    return next(new NotFoundError());
});

// generic error handler
app.use(function (err, req, res, next) {
    if (process.env.NODE_ENV !== "test") console.error(err.stack);
    const status = err.status || 500;
    const message = err.message;
  
    return res.status(status).json({
        error: { message, status },
    });
});

module.exports = app;
