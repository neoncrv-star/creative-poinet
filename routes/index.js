const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const portfolioController = require('../controllers/portfolioController');
const blogController = require('../controllers/blogController');

router.get('/', pageController.getHome);
router.get('/en', pageController.getHomeEn);

// Portfolio Routes
router.get('/portfolio', portfolioController.getPortfolio);
router.get('/portfolio/:id', portfolioController.getProject);

// Blog Routes
router.get('/blog', blogController.getBlog);
router.get('/blog/:id', blogController.getPost);

module.exports = router;
