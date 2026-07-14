const express = require('express');
const router = express.Router();
const goal = require('../controllers/goal.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/', goal.create);
router.get('/', goal.getAll);
router.put('/:id', goal.update);
router.put('/:id/progress', goal.addProgress);
router.delete('/:id', goal.remove);

module.exports = router;
