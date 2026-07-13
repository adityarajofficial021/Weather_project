// api/weather.js - OpenWeather API Proxy

module.exports = async (req, res) => {
    // Add CORS headers for safety
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { city, lat, lon, mode } = req.query;

    if (!city && (!lat || !lon)) {
        return res.status(400).json({ error: 'Either city or lat/lon parameters are required' });
    }

    const apiKey = process.env.WEATHER_API_KEY || "aab108fe8f290daf0565265f0b126d81";
    const endpoint = mode === 'forecast' ? 'forecast' : 'weather';
    
    let url;
    if (lat && lon) {
        url = `https://api.openweathermap.org/data/2.5/${endpoint}?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    } else {
        url = `https://api.openweathermap.org/data/2.5/${endpoint}?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;
    }

    try {
        const apiResponse = await fetch(url);
        const data = await apiResponse.json();
        
        return res.status(apiResponse.status).json(data);
    } catch (error) {
        console.error('Weather API Proxy Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
