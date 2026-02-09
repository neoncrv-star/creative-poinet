const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Public Admin Routes (Login)
router.get('/login', adminController.getLogin);
router.post('/login', adminController.postLogin);
router.get('/logout', adminController.logout);

// Protected Routes
router.use(auth); // Apply auth middleware to all routes below

router.get('/', adminController.getDashboard);

// SEO Routes
router.get('/seo', adminController.getSeoSettings);
router.post('/seo', adminController.postSeoSettings);

// Portfolio Routes
router.get('/portfolio', adminController.managePortfolio);
router.get('/portfolio/add', adminController.getAddProject);
router.post('/portfolio/add', upload.single('image'), adminController.postAddProject);
router.get('/portfolio/edit/:id', adminController.getEditProject);
router.post('/portfolio/edit/:id', upload.single('image'), adminController.postEditProject);
router.get('/portfolio/delete/:id', adminController.deleteProject);

// Blog Routes
router.get('/blog', adminController.manageBlog);
router.get('/blog/add', adminController.getAddPost);
router.post('/blog/add', upload.single('image'), adminController.postAddPost);
router.get('/blog/edit/:id', adminController.getEditPost);
router.post('/blog/edit/:id', upload.single('image'), adminController.postEditPost);
router.get('/blog/delete/:id', adminController.deletePost);

module.exports = router;
