import 'dotenv/config';
import app from './api/index.js';

const PORT = 3000;

console.log('Current working directory:', process.cwd());
console.log('DATABASE_URL from process.env:', process.env.DATABASE_URL ? 'Set' : 'Not Set');

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
