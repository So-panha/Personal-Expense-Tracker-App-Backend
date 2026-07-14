const express = require('express');
const router = express.Router();
const budget = require('../controllers/budget.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/', budget.create);
router.get('/', budget.getAll);
router.get('/:id', budget.getById);
router.put('/:id', budget.update);
router.delete('/:id', budget.remove);

module.exports = router;
