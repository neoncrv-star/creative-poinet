const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const { cachePage } = require('../utils/pageCache');
const portfolioController = require('../controllers/portfolioController');
const blogController = require('../controllers/blogController');

router.get('/', cachePage({ ttlMs: 60_000, staleMs: 600_000 }), pageController.getHome);
router.get('/en', cachePage({ ttlMs: 60_000, staleMs: 600_000 }), pageController.getHomeEn);
router.post('/contact', pageController.postContact);

// Portfolio Routes
router.get('/portfolio', cachePage({ ttlMs: 60_000, staleMs: 600_000 }), portfolioController.getPortfolioPage);
router.get('/en/portfolio', cachePage({ ttlMs: 60_000, staleMs: 600_000 }), portfolioController.getPortfolioPage);
router.get('/portfolio/:id', portfolioController.getProject);
router.get('/en/portfolio/:id', portfolioController.getProject);

// Blog Routes
router.get('/blog', blogController.getBlog);
router.get('/blog/:id', blogController.getPost);

module.exports = router;
