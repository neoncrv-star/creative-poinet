const User = require('../models/User');
const Project = require('../models/Project');
const Post = require('../models/Post');
const GlobalSeo = require('../models/GlobalSeo');
const fs = require('fs');
const path = require('path');

// Helper to delete file
const deleteFile = (filePath) => {
    if (filePath) {
        const fullPath = path.join(__dirname, '../public', filePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    }
};

exports.getLogin = (req, res) => {
    res.render('admin/login', { title: 'تسجيل الدخول', error: null });
};

exports.postLogin = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.render('admin/login', { title: 'تسجيل الدخول', error: 'بيانات الدخول غير صحيحة' });
        }
        
        const isMatch = await user.validPassword(password);
        if (!isMatch) {
            return res.render('admin/login', { title: 'تسجيل الدخول', error: 'بيانات الدخول غير صحيحة' });
        }
        
        req.session.userId = user.id;
        req.session.userRole = user.role;
        res.redirect('/admin');
    } catch (error) {
        console.error(error);
        res.render('admin/login', { title: 'تسجيل الدخول', error: 'حدث خطأ ما' });
    }
};

exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/admin/login');
    });
};

exports.getDashboard = async (req, res) => {
    try {
        const projectCount = await Project.count();
        const postCount = await Post.count();
        // Calculate total views
        const projectViews = await Project.sum('views') || 0;
        const postViews = await Post.sum('views') || 0;
        const totalViews = projectViews + postViews;
        
        res.render('admin/dashboard', { 
            title: 'لوحة التحكم | الرئيسية',
            projectCount,
            postCount,
            visitorCount: totalViews // Using real view count now
        });
    } catch (error) {
        console.error(error);
        res.render('admin/dashboard', { 
            title: 'لوحة التحكم | الرئيسية',
            projectCount: 0,
            postCount: 0,
            visitorCount: 0
        });
    }
};

// --- SEO Settings ---
exports.getSeoSettings = async (req, res) => {
    try {
        let seo = await GlobalSeo.findOne();
        if (!seo) {
            seo = await GlobalSeo.create({});
        }
        res.render('admin/seo', { title: 'لوحة التحكم | إعدادات SEO', seo });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.postSeoSettings = async (req, res) => {
    try {
        let seo = await GlobalSeo.findOne();
        if (!seo) {
            seo = await GlobalSeo.create(req.body);
        } else {
            await seo.update(req.body);
        }
        res.redirect('/admin/seo');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// --- Portfolio Management ---
exports.managePortfolio = async (req, res) => {
    try {
        const projects = await Project.findAll();
        res.render('admin/portfolio-manage', { title: 'لوحة التحكم | إدارة الأعمال', projects });
    } catch (error) {
        console.error(error);
        res.render('admin/portfolio-manage', { title: 'لوحة التحكم | إدارة الأعمال', projects: [] });
    }
};

exports.getAddProject = (req, res) => {
    res.render('admin/portfolio-form', { title: 'إضافة مشروع جديد', project: null });
};

exports.postAddProject = async (req, res) => {
    try {
        const data = req.body;
        if (req.file) {
            data.image = '/uploads/' + req.file.filename;
        }
        await Project.create(data);
        res.redirect('/admin/portfolio');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.getEditProject = async (req, res) => {
    try {
        const project = await Project.findByPk(req.params.id);
        res.render('admin/portfolio-form', { title: 'تعديل المشروع', project });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.postEditProject = async (req, res) => {
    try {
        const project = await Project.findByPk(req.params.id);
        const data = req.body;
        if (req.file) {
            deleteFile(project.image); // Delete old image
            data.image = '/uploads/' + req.file.filename;
        }
        await project.update(data);
        res.redirect('/admin/portfolio');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findByPk(req.params.id);
        deleteFile(project.image);
        await project.destroy();
        res.redirect('/admin/portfolio');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// --- Blog Management ---
exports.manageBlog = async (req, res) => {
    try {
        const posts = await Post.findAll();
        res.render('admin/blog-manage', { title: 'لوحة التحكم | إدارة المدونة', posts });
    } catch (error) {
        console.error(error);
        res.render('admin/blog-manage', { title: 'لوحة التحكم | إدارة المدونة', posts: [] });
    }
};

exports.getAddPost = (req, res) => {
    res.render('admin/blog-form', { title: 'إضافة مقال جديد', post: null });
};

exports.postAddPost = async (req, res) => {
    try {
        const data = req.body;
        if (req.file) {
            data.image = '/uploads/' + req.file.filename;
        }
        await Post.create(data);
        res.redirect('/admin/blog');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.getEditPost = async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.id);
        res.render('admin/blog-form', { title: 'تعديل المقال', post });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.postEditPost = async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.id);
        const data = req.body;
        if (req.file) {
            deleteFile(post.image); // Delete old image
            data.image = '/uploads/' + req.file.filename;
        }
        await post.update(data);
        res.redirect('/admin/blog');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.deletePost = async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.id);
        deleteFile(post.image);
        await post.destroy();
        res.redirect('/admin/blog');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};
