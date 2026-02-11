const sequelize = require('./config/database');
const User = require('./models/User');
const Project = require('./models/Project');
const Category = require('./models/Category');
const Post = require('./models/Post');
const GlobalSeo = require('./models/GlobalSeo');

async function seed() {
    try {
        // NEVER use force: true in production as it wipes all data.
        // We use alter: true to update schema without losing data.
        await sequelize.sync({ alter: true }); 

        // Check if admin already exists to avoid duplicates
        const adminExists = await User.findOne({ where: { username: 'admin' } });
        if (!adminExists) {
            // Create Super Admin
            await User.create({
                username: 'admin',
                password: 'password123', // Will be hashed by hook
                role: 'super_admin'
            });
            console.log('Admin user created.');
        }

        // Create Default Categories
        const categories = await Category.bulkCreate([
            { name: 'فيديو', slug: 'video', display_order: 1 },
            { name: 'مواقع إلكترونية', slug: 'websites', display_order: 2 },
            { name: 'هويات بصرية', slug: 'identities', display_order: 3 },
            { name: 'أخرى', slug: 'other', display_order: 4 }
        ]);

        // Create Dummy Projects
        await Project.bulkCreate([
            { 
                title: 'مشروع هوية بصرية', 
                description: 'تصميم هوية بصرية كاملة لشركة تقنية.', 
                content: 'تفاصيل المشروع...', 
                image: '/images/project1.jpg',
                CategoryId: categories[2].id,
                category: categories[2].slug
            },
            { 
                title: 'موقع إلكتروني', 
                description: 'تطوير موقع تعريفي لشركة عقارية.', 
                content: 'تفاصيل المشروع...', 
                image: '/images/project2.jpg',
                CategoryId: categories[1].id,
                category: categories[1].slug
            },
            { 
                title: 'حملة تسويقية', 
                description: 'إدارة حملة تسويقية ناجحة على منصات التواصل.', 
                content: 'تفاصيل المشروع...', 
                image: '/images/project3.jpg',
                CategoryId: categories[3].id,
                category: categories[3].slug
            }
        ]);

        // Create Default SEO
        await GlobalSeo.create({
            siteTitle: 'نقطة إبداعية',
            siteUrl: 'https://creativepoint.com',
            titleSeparator: '|',
            defaultDescription: 'وكالة إبداعية متخصصة في الحلول الرقمية، التصميم، والبرمجة.',
            defaultKeywords: 'تصميم, برمجة, تسويق, هوية بصرية, تطوير مواقع',
            homeTitle: 'الرئيسية',
            homeDescription: 'مرحباً بكم في نقطة إبداعية - شريككم في النجاح الرقمي.'
        });

        // Create Dummy Posts
        await Post.bulkCreate([
            { 
                title: 'أهمية الهوية البصرية', 
                excerpt: 'لماذا تحتاج شركتك إلى هوية بصرية قوية؟', 
                content: 'محتوى المقال...', 
                date: '2026-02-01' 
            },
            { 
                title: 'اتجاهات التصميم في 2026', 
                excerpt: 'تعرف على أحدث صيحات التصميم لهذا العام.', 
                content: 'محتوى المقال...', 
                date: '2026-02-05' 
            },
            { 
                title: 'التسويق بالمحتوى', 
                excerpt: 'كيف تزيد من مبيعاتك من خلال المحتوى.', 
                content: 'محتوى المقال...', 
                date: '2026-02-08' 
            }
        ]);

        console.log('Database seeded!');
    } catch (error) {
        console.error('Seeding failed:', error);
    }
}

module.exports = seed;
