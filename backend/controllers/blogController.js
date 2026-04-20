const Post = require('../models/Post');
const GlobalSeo = require('../models/GlobalSeo');
const withTimeout = require('../utils/withTimeout');

exports.getBlog = async (req, res) => {
    try {
        const cap = Number(process.env.BLOG_QUERY_TIMEOUT_MS || process.env.HOME_QUERY_TIMEOUT_MS || 800);
        const [posts, seo] = await Promise.all([
            withTimeout(Post.findAll({ where: { is_active: true } }), cap, []),
            withTimeout(GlobalSeo.findOne(), cap, null)
        ]);
        res.render('blog/index', {
            title: seo && seo.blogTitle ? seo.blogTitle : 'المدونة',
            posts,
            seo,
            pageSeo: {
                seoTitle: seo && seo.blogTitle,
                seoDescription: seo && seo.blogDescription
            }
        });
    } catch (error) {
        console.error(error);
        res.render('blog/index', { title: 'المدونة', posts: [], seo: null });
    }
};

exports.getPost = async (req, res) => {
    const id = req.params.id;
    try {
        const cap = Number(process.env.BLOG_QUERY_TIMEOUT_MS || process.env.HOME_QUERY_TIMEOUT_MS || 800);
        const post = await withTimeout(Post.findByPk(id), cap, null);
        if (!post) {
            return res.status(404).send('المقال غير موجود');
        }
        post.views += 1;
        try {
            await withTimeout(post.save(), cap, null);
        } catch (e) {}
        const seo = await withTimeout(GlobalSeo.findOne(), cap, null);
        res.render('blog/post', {
            title: post.title,
            post,
            seo,
            pageSeo: post
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('خطأ في الخادم');
    }
};
