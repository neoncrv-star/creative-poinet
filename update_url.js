const GlobalSeo = require('./models/GlobalSeo');
const sequelize = require('./config/database');
require('dotenv').config();

async function updateUrl() {
    try {
        const seo = await GlobalSeo.findOne();
        if (seo) {
            seo.siteUrl = 'https://cpoint-sa.com';
            await seo.save();
            console.log('Site URL updated successfully to: ' + seo.siteUrl);
        } else {
            // Create if not exists
            await GlobalSeo.create({
                siteUrl: 'https://cpoint-sa.com',
                siteTitle: 'نقطة إبداعية'
            });
            console.log('GlobalSeo record created.');
        }
    } catch (error) {
        console.error('Error updating URL:', error);
    } finally {
        await sequelize.close();
    }
}

updateUrl();