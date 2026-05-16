const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const authenticate = require('../middleware/auth');
const { upload, uploadMultiple, remove } = require('../controllers/fileController');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const router = Router();

router.use(authenticate);

router.post('/task/:taskId', uploadMiddleware.single('file'), upload);
router.post('/task/:taskId/multiple', uploadMiddleware.array('files', 10), uploadMultiple);
router.delete('/:fileId', remove);

module.exports = router;
