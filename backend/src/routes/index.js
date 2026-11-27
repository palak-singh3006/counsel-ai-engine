const express = require('express');
const authRoutes = require('./authRoutes');
const clientRoutes = require('./clientRoutes');
const caseRoutes = require('./caseRoutes');
const hearingRoutes = require('./hearingRoutes');
const documentRoutes = require('./documentRoutes');
const paymentRoutes = require('./paymentRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const aiRoutes = require('./aiRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/clients', clientRoutes);
router.use('/cases', caseRoutes);
router.use('/hearings', hearingRoutes);
router.use('/documents', documentRoutes);
router.use('/payments', paymentRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/ai', aiRoutes);

module.exports = router;
