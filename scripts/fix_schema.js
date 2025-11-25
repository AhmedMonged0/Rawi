import 'dotenv/config';
import db from '../api/db.js';

const fixSchema = async () => {
    try {
        console.log('Starting schema fix...');

        // Force alter avatar_url to TEXT
        console.log('Altering users.avatar_url to TEXT...');
        await db.query('ALTER TABLE users ALTER COLUMN avatar_url TYPE TEXT');
        console.log('Success: users.avatar_url is now TEXT');

        // Force alter books columns just in case
        console.log('Altering books.image_url to TEXT...');
        await db.query('ALTER TABLE books ALTER COLUMN image_url TYPE TEXT');
        console.log('Success: books.image_url is now TEXT');

        console.log('Altering books.pdf_url to TEXT...');
        await db.query('ALTER TABLE books ALTER COLUMN pdf_url TYPE TEXT');
        console.log('Success: books.pdf_url is now TEXT');

        console.log('Schema fix completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Schema fix failed:', error);
        process.exit(1);
    }
};

fixSchema();
