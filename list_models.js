
const apiKey = "AIzaSyB_Rsb4xsxIjOgKYvRHwdkhYrLU0rB0HVE";

async function listModels() {
    console.log(`Listing models...`);
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);

        if (!response.ok) {
            const text = await response.text();
            console.log(`Error body: ${text}`);
        } else {
            const data = await response.json();
            const genModels = data.models.filter(m => m.supportedGenerationMethods.includes('generateContent'));
            console.log(`Generative Models:`, JSON.stringify(genModels.map(m => m.name), null, 2));
        }
    } catch (error) {
        console.error(`Error listing models:`, error);
    }
}

listModels();
