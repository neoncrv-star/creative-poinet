const Project = require('../models/Project');
const Category = require('../models/Category');
const GlobalSeo = require('../models/GlobalSeo');
const withTimeout = require('../utils/withTimeout');

exports.getPortfolioPage = async (req, res) => {
    try {
        const cap = Number(process.env.PORTFOLIO_QUERY_TIMEOUT_MS || process.env.HOME_QUERY_TIMEOUT_MS || 800);
        const [projects, categories, seo] = await Promise.all([
            withTimeout(Project.findAll({
                where: { is_active: true },
                include: [{ model: Category }],
                order: [['display_order', 'ASC']]
            }), cap, []),
            withTimeout(Category.findAll({ order: [['display_order', 'ASC']] }), cap, []),
            withTimeout(GlobalSeo.findOne(), cap, null)
        ]);
        const isEn = req.originalUrl.includes('/en/portfolio');
        const view = isEn ? 'portfolio/index_en' : 'portfolio/index_ar';
        res.render(view, {
            title: isEn ? 'Our Work' : (seo && seo.portfolioTitle ? seo.portfolioTitle : 'أعمالنا'),
            projects,
            categories,
            seo,
            pageSeo: {
                seoTitle: isEn ? 'Our Work' : (seo && seo.portfolioTitle),
                seoDescription: seo && seo.portfolioDescription
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
        const cap = Number(process.env.PORTFOLIO_QUERY_TIMEOUT_MS || process.env.HOME_QUERY_TIMEOUT_MS || 800);
        const project = await withTimeout(Project.findByPk(id, {
            include: [{ model: Category }]
        }), cap, null);
        if (!project) {
            return res.status(404).send('المشروع غير موجود');
        }
        project.views += 1;
        try {
            await withTimeout(project.save(), cap, null);
        } catch (e) {}
        const seo = await withTimeout(GlobalSeo.findOne(), cap, null);
        const isEn = req.originalUrl.includes('/en/portfolio');
        res.render('portfolio/detail', {
            title: project.title,
            project,
            seo,
            isEn,
            pageSeo: project
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('خطأ في الخادم');
    }
};
