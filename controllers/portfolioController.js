const Project = require('../models/Project');
const GlobalSeo = require('../models/GlobalSeo');

exports.getPortfolio = async (req, res) => {
    try {
        const projects = await Project.findAll();
        const seo = await GlobalSeo.findOne();
        
        res.render('portfolio/index', { 
            title: 'معرض الأعمال', 
            projects, 
            seo,
            pageSeo: { title: 'معرض الأعمال' } // Fallback for simple pages
        });
    } catch (error) {
        console.error(error);
        res.render('portfolio/index', { title: 'معرض الأعمال', projects: [], seo: null });
    }
};

exports.getProject = async (req, res) => {
    const id = req.params.id;
    try {
        const project = await Project.findByPk(id);
        if (!project) {
            return res.status(404).send('المشروع غير موجود');
        }
        
        // Increment views
        project.views += 1;
        await project.save();

        const seo = await GlobalSeo.findOne();

        res.render('portfolio/detail', { 
            title: project.title, 
            project, 
            seo,
            pageSeo: project // Project model has seoTitle, seoDescription, etc.
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('خطأ في الخادم');
    }
};
