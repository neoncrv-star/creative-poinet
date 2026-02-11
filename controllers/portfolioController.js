const Project = require('../models/Project');
const Category = require('../models/Category');
const GlobalSeo = require('../models/GlobalSeo');

exports.getPortfolioPage = async (req, res) => {
    try {
        const projects = await Project.findAll({ 
            where: { is_active: true }, 
            include: [{ model: Category }],
            order: [['display_order', 'ASC']] 
        });
        const categories = await Category.findAll({ order: [['display_order', 'ASC']] });
        const seo = await GlobalSeo.findOne();
        
        // Determine language from URL
        const isEn = req.originalUrl.includes('/en/portfolio');
        const view = isEn ? 'portfolio/index_en' : 'portfolio/index_ar';
        
        res.render(view, { 
            title: isEn ? 'Our Work' : (seo && seo.portfolioTitle ? seo.portfolioTitle : 'أعمالنا'), 
            projects, 
            categories,
            seo,
            pageSeo: { 
                seoTitle: isEn ? 'Our Work' : seo?.portfolioTitle,
                seoDescription: seo?.portfolioDescription
            }
        });
    } catch (error) {
        console.error('Portfolio Error:', error);
        res.status(500).send('Internal Server Error');
    }
};

exports.getProject = async (req, res) => {
    const id = req.params.id;
    try {
        const project = await Project.findByPk(id, {
            include: [{ model: Category }]
        });
        if (!project) {
            return res.status(404).send('المشروع غير موجود');
        }
        
        // Increment views
        project.views += 1;
        await project.save();

        const seo = await GlobalSeo.findOne();
        const isEn = req.originalUrl.includes('/en/portfolio');

        res.render('portfolio/detail', { 
            title: project.title, 
            project, 
            seo,
            isEn,
            pageSeo: project // Project model has seoTitle, seoDescription, etc.
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('خطأ في الخادم');
    }
};
