const Post = require('../models/Post');
const GlobalSeo = require('../models/GlobalSeo');

exports.getBlog = async (req, res) => {
    try {
        const posts = await Post.findAll();
        const seo = await GlobalSeo.findOne();
        
        res.render('blog/index', { 
            title: 'المدونة', 
            posts, 
            seo,
            pageSeo: { title: 'المدونة' }
        });
    } catch (error) {
        console.error(error);
        res.render('blog/index', { title: 'المدونة', posts: [], seo: null });
    }
};

exports.getPost = async (req, res) => {
    const id = req.params.id;
    try {
        const post = await Post.findByPk(id);
        if (!post) {
            return res.status(404).send('المقال غير موجود');
        }

        // Increment views
        post.views += 1;
        await post.save();

        const seo = await GlobalSeo.findOne();

        res.render('blog/post', { 
            title: post.title, 
            post, 
            seo,
            pageSeo: post // Post model has seoTitle, seoDescription, etc.
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('خطأ في الخادم');
    }
};
