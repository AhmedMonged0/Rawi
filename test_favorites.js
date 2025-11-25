import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';

async function test() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@rawi.com', password: 'admin123' })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(loginData.message);
        const token = loginData.token;
        const userId = loginData.user.id;
        console.log('Logged in. Token obtained.');

        // 1.5 Get Books to find a valid ID
        console.log('Fetching books...');
        const booksRes = await fetch(`${BASE_URL}/books`);
        const books = await booksRes.json();
        if (books.length === 0) throw new Error('No books found in database!');
        const bookId = books[0].id;
        console.log(`Found ${books.length} books. Using Book ID: ${bookId}`);

        // 2. Add to Favorites
        console.log(`Adding book ${bookId} to favorites...`);
        const addRes = await fetch(`${BASE_URL}/favorites`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ bookId })
        });
        const addData = await addRes.json();
        console.log('Add response:', addData);

        // 3. Get Favorites
        console.log('Fetching favorites...');
        const getRes = await fetch(`${BASE_URL}/users/${userId}/favorites`);
        const favorites = await getRes.json();
        console.log('Favorites count:', favorites.length);
        const isBookInFavorites = favorites.some(b => b.id === bookId);
        console.log(`Is Book ${bookId} in favorites?`, isBookInFavorites);

        if (!isBookInFavorites) throw new Error(`Book ${bookId} not found in favorites!`);

        // 4. Remove from Favorites
        console.log(`Removing book ${bookId} from favorites...`);
        const delRes = await fetch(`${BASE_URL}/favorites/${bookId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const delData = await delRes.json();
        console.log('Delete response:', delData);

        // 5. Get Favorites again
        console.log('Fetching favorites again...');
        const getRes2 = await fetch(`${BASE_URL}/users/${userId}/favorites`);
        const favorites2 = await getRes2.json();
        console.log('Favorites count:', favorites2.length);
        const isBookStillInFavorites = favorites2.some(b => b.id === bookId);
        console.log(`Is Book ${bookId} still in favorites?`, isBookStillInFavorites);

        if (isBookStillInFavorites) throw new Error(`Book ${bookId} still in favorites after delete!`);

        console.log('TEST PASSED!');

    } catch (error) {
        console.error('TEST FAILED:', error);
    }
}

test();
