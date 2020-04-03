const router = require('express').Router();

router.get('/', (req, res) => {
  res.send('Server online');
});

module.exports = router;
