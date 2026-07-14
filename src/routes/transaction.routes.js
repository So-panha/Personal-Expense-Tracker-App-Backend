const express = require('express');
const router = express.Router();
const transaction = require('../controllers/transaction.controller');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticate);

router.post('/', upload.single('file'), transaction.create);
router.get('/', transaction.getAll);
router.get('/:id', transaction.getById);
router.put('/:id', upload.single('file'), transaction.update);
router.delete('/:id', transaction.remove);

module.exports = router;
