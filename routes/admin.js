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
router.post('/seo', upload.fields([
    { name: 'favicon', maxCount: 1 },
    { name: 'ogImage', maxCount: 1 }
]), adminController.postSeoSettings);

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

// Service Routes
router.get('/services', adminController.manageServices);
router.get('/services/add', adminController.getAddService);
router.post('/services/add', upload.single('image'), adminController.postAddService);
router.get('/services/edit/:id', adminController.getEditService);
router.post('/services/edit/:id', upload.single('image'), adminController.postEditService);
router.get('/services/delete/:id', adminController.deleteService);

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

module.exports = router;
