const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.route'));

// TODO: Add more routes here
// router.use('/rooms', require('./room.route'));

module.exports = router;
