const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const storageService = require('../src/storage/storage.service');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, storageService.UPLOAD_PATH);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const fileFilter = (req, file, cb) => {
    try {
        const mime = (file.mimetype || '').toLowerCase();
        const ext = (path.extname(file.originalname || '') || '').toLowerCase();
        const allowedExts = new Set([
            '.png',
            '.jpg',
            '.jpeg',
            '.gif',
            '.svg',
            '.webp',
            '.avif',
            '.jfif',
            '.mp4',
            '.webm'
        ]);
        const isImageOrVideo = mime.startsWith('image/') || mime.startsWith('video/');
        const isAllowedExt = allowedExts.has(ext);
        if (!isImageOrVideo && !isAllowedExt) {
            return cb(null, false);
        }
        return cb(null, true);
    } catch {
        return cb(null, false);
    }
};
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: Number(process.env.UPLOAD_MAX_BYTES || 10 * 1024 * 1024)
    }
});

// Public Admin Routes (Login)
router.get('/login', adminController.getLogin);
router.post('/login', adminController.postLogin);
router.get('/logout', adminController.logout);

// Protected Routes
router.use(auth); // Apply auth middleware to all routes below

router.get('/', adminController.getDashboard);

// Account - Change Password
router.get('/account/password', adminController.getChangePassword);
router.post('/account/password', adminController.postChangePassword);

// Logs (protected)
router.get('/logs', adminController.getLogs);

router.get('/media', adminController.getMediaLibrary);
router.post('/media/delete', adminController.postMediaDelete);

router.get('/assets/audit', adminController.getAssetsAudit);
router.post('/assets/upload/:filename', upload.single('file'), adminController.postAssetsUpload);

// Health
router.get('/health', adminController.getSiteHealth);

// Uploads browser (JSON)
router.get('/uploads/list', adminController.listUploads);

// SEO Routes
router.get('/seo', adminController.getSeoSettings);
router.post('/seo', upload.fields([
    { name: 'favicon', maxCount: 1 },
    { name: 'ogImage', maxCount: 1 }
]), adminController.postSeoSettings);

// Design Routes
router.get('/design', adminController.getDesignSettings);
router.post('/design', upload.fields([
    { name: 'heroVideoFile', maxCount: 1 },
    { name: 'heroBackgroundImage', maxCount: 1 }
]), adminController.postDesignSettings);

// Portfolio Routes
router.get('/portfolio', adminController.managePortfolio);
router.get('/portfolio/add', adminController.getAddProject);
router.post('/portfolio/add', upload.single('image'), adminController.postAddProject);
router.get('/portfolio/edit/:id', adminController.getEditProject);
router.post('/portfolio/edit/:id', upload.single('image'), adminController.postEditProject);
router.get('/portfolio/delete/:id', adminController.deleteProject);

// Category Routes
router.get('/categories', adminController.manageCategories);
router.get('/categories/add', adminController.getAddCategory);
router.post('/categories/add', adminController.postAddCategory);
router.get('/categories/edit/:id', adminController.getEditCategory);
router.post('/categories/edit/:id', adminController.postEditCategory);
router.get('/categories/delete/:id', adminController.deleteCategory);

// Blog Routes
router.get('/blog', adminController.manageBlog);
router.get('/blog/add', adminController.getAddPost);
router.post('/blog/add', upload.single('image'), adminController.postAddPost);
router.get('/blog/edit/:id', adminController.getEditPost);
router.post('/blog/edit/:id', upload.single('image'), adminController.postEditPost);
router.get('/blog/delete/:id', adminController.deletePost);

router.get('/services', adminController.manageServices);
router.get('/services/add', adminController.getAddService);
router.post('/services/add', upload.single('image'), adminController.postAddService);
router.get('/services/edit/:id', adminController.getEditService);
router.post('/services/edit/:id', upload.single('image'), adminController.postEditService);
router.get('/services/delete/:id', adminController.deleteService);
router.get('/services/fix-images', adminController.fixServiceImages);

// Partner Routes
router.get('/partners', adminController.managePartners);
router.get('/partners/add', adminController.getAddPartner);
router.post('/partners/add', upload.single('logo'), adminController.postAddPartner);
router.get('/partners/edit/:id', adminController.getEditPartner);
router.post('/partners/edit/:id', upload.single('logo'), adminController.postEditPartner);
router.get('/partners/delete/:id', adminController.deletePartner);

// Contact Routes
router.get('/contacts', adminController.manageContacts);
router.get('/contacts/delete/:id', adminController.deleteContact);
router.post('/contacts/status/:id', adminController.updateContactStatus);

// Stats Routes
router.get('/stats', adminController.manageStats);
router.get('/stats/add', adminController.getAddStat);
router.post('/stats/add', adminController.postAddStat);
router.get('/stats/edit/:id', adminController.getEditStat);
router.post('/stats/edit/:id', adminController.postEditStat);
router.get('/stats/delete/:id', adminController.deleteStat);

module.exports = router;
