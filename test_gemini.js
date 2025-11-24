
const apiKey = "AIzaSyDpYC5NeanWxbs2fUKA-oKkS_kfbMl5rBI";
const models = [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro',
    'gemini-flash-latest',
    'gemini-pro-latest'
];

async function testModels() {
    for (const model of models) {
        console.log(`Testing model: ${model}...`);
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: "Hello" }]
                    }]
                })
            });

            console.log(`Status for ${model}: ${response.status}`);
            if (!response.ok) {
                const text = await response.text();
                console.log(`Error body: ${text}`);
            } else {
                const data = await response.json();
                console.log(`Success! Response:`, JSON.stringify(data).substring(0, 100) + "...");
            }
        } catch (error) {
            console.error(`Error testing ${model}:`, error);
        }
    }
}

testModels();
