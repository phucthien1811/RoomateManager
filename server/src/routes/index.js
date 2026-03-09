const express = require('express');
const router = express.Router();

// Example route
router.get('/hello', (req, res) => {
  res.json({ message: 'Hello from Roommate Manager API!' });
});

// TODO: Add more routes here
// router.use('/users', require('./users'));
// router.use('/rooms', require('./rooms'));

module.exports = router;
