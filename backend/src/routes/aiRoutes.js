const express = require('express');
const aiController = require('../controllers/aiController');
const { authenticate } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const validate = require('../middleware/validateMiddleware');
const { aiWorkflowSchema, aiReviewSchema } = require('../validators/schemas');

const router = express.Router();

router.use(authenticate);

// Optional multipart file upload handler when files are attached directly, otherwise JSON passes straight through
function optionalMultipart(req, res, next) {
  if (req.is('multipart/form-data')) {
    return upload.array('files', 10)(req, res, next);
  }
  return next();
}

router.get('/health', aiController.getAiHealth);
router.post('/agent-workflow', optionalMultipart, validate(aiWorkflowSchema), aiController.runAgentWorkflow);
router.post('/analyze', optionalMultipart, validate(aiWorkflowSchema), aiController.runAgentWorkflow);
router.get('/analyses/case/:caseId', aiController.listAnalysesByCase);
router.get('/analysis/:id', aiController.getAnalysisById);
router.post('/analysis/:id/review', validate(aiReviewSchema), aiController.saveAdvocateReview);
router.post('/analysis/:id/certify', validate(aiReviewSchema), aiController.certifyAnalysis);

module.exports = router;
