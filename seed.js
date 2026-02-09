const sequelize = require('./config/database');
const User = require('./models/User');
const Project = require('./models/Project');
const Post = require('./models/Post');

async function seed() {
    try {
        await sequelize.sync({ force: true }); // Reset DB

        // Create Super Admin
        await User.create({
            username: 'admin',
            password: 'password123', // Will be hashed by hook
            role: 'super_admin'
        });

        // Create Dummy Projects
        await Project.bulkCreate([
            { 
                title: 'مشروع هوية بصرية', 
                description: 'تصميم هوية بصرية كاملة لشركة تقنية.', 
                content: 'تفاصيل المشروع...', 
                image: '/images/project1.jpg' 
            },
            { 
                title: 'موقع إلكتروني', 
                description: 'تطوير موقع تعريفي لشركة عقارية.', 
                content: 'تفاصيل المشروع...', 
                image: '/images/project2.jpg' 
            },
            { 
                title: 'حملة تسويقية', 
                description: 'إدارة حملة تسويقية ناجحة على منصات التواصل.', 
                content: 'تفاصيل المشروع...', 
                image: '/images/project3.jpg' 
            }
        ]);

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
