import fetch from 'node-fetch';

async function testAdmin() {
    try {
        const loginRes = await fetch('http://localhost:3000/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });
        const loginData = await loginRes.json();
        console.log('Login:', loginData);

        if (!loginData.token) return;

        const usersRes = await fetch('http://localhost:3000/api/admin/users', {
            headers: { 'Authorization': `Bearer ${loginData.token}` }
        });

        if (usersRes.ok) {
            const usersData = await usersRes.json();
            console.log('Users:', usersData.length);
        } else {
            console.log('Users Error:', usersRes.status, await usersRes.text());
        }
    } catch (e) {
        console.error(e);
    }
}

testAdmin();
