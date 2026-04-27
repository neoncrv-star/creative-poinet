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
router.get('/portfolio/:slug', cachePage({ ttlMs: 60_000, staleMs: 600_000 }), portfolioController.getProject);
router.get('/en/portfolio/:slug', cachePage({ ttlMs: 60_000, staleMs: 600_000 }), portfolioController.getProject);

// Philosophy Page Route
router.get('/philosophy', cachePage({ ttlMs: 60_000, staleMs: 600_000 }), pageController.getPhilosophyPage);
router.get('/en/philosophy', cachePage({ ttlMs: 60_000, staleMs: 600_000 }), pageController.getPhilosophyPage);

// Services Routes
router.get('/services', cachePage({ ttlMs: 60_000, staleMs: 600_000 }), pageController.getServicesPage);
router.get('/en/services', cachePage({ ttlMs: 60_000, staleMs: 600_000 }), pageController.getServicesPage);
// Service detail (by slug)
router.get('/service/:slug', cachePage({ ttlMs: 60_000, staleMs: 600_000 }), pageController.getServiceDetail);
router.get('/en/service/:slug', cachePage({ ttlMs: 60_000, staleMs: 600_000 }), pageController.getServiceDetail);

// Blog Routes
router.get('/blog', cachePage({ ttlMs: 60_000, staleMs: 600_000 }), blogController.getBlog);
router.get('/blog/:slug', cachePage({ ttlMs: 60_000, staleMs: 600_000 }), blogController.getPost);

module.exports = router;
