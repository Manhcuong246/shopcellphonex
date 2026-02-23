const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const { auth } = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = express.Router();

const uploadsDir = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const ext = (file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i) || [])[1] || 'jpg';
      cb(null, `${req.user.id}-${Date.now()}.${ext}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('Chỉ chấp nhận file ảnh'));
  },
});

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/me', auth, authController.getMe);
router.patch('/profile', auth, authController.updateProfile);
router.put('/password', auth, authController.changePassword);
router.post('/avatar', auth, upload.single('avatar'), authController.avatar);

module.exports = router;
