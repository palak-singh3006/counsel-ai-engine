const express = require('express');
const hearingController = require('../controllers/hearingController');
const { authenticate } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { createHearingSchema, updateHearingSchema } = require('../validators/schemas');

const router = express.Router();

router.use(authenticate);
router.get('/', hearingController.listHearings);
router.post('/', validate(createHearingSchema), hearingController.createHearing);
router.get('/:id', hearingController.getHearingById);
router.put('/:id', validate(updateHearingSchema), hearingController.updateHearing);
router.delete('/:id', hearingController.deleteHearing);

module.exports = router;
