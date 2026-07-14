const express = require('express');
const router = express.Router();
const category = require('../controllers/category.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/', category.create);
router.get('/', category.getAll);
router.get('/:id', category.getById);
router.put('/:id', category.update);
router.delete('/:id', category.remove);

module.exports = router;
