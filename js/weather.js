const API_KEY = "aab108fe8f290daf0565265f0b126d81";

// =========================
// Fetch Weather
// =========================

async function getWeather(city) {
    try {
        const url = window.location.protocol.startsWith('http') 
            ? `/api/weather?city=${encodeURIComponent(city)}&mode=weather`
            : `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("City not found");
        }

        const data = await response.json();
        updateWeather(data);
    }
    catch (error) {
        alert("City not found!");
        console.error(error);
    }
}

async function getForecast(city){
    const url = window.location.protocol.startsWith('http') 
        ? `/api/weather?city=${encodeURIComponent(city)}&mode=forecast`
        : `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();
    displayForecast(data);
}

async function getWeatherByCoords(lat, lon) {
    try {
        const url = window.location.protocol.startsWith('http')
            ? `/api/weather?lat=${lat}&lon=${lon}&mode=weather`
            : `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Location not found");
        }

        const data = await response.json();
        updateWeather(data);
    }
    catch (error) {
        alert("Unable to fetch weather for your location.");
        console.error(error);
    }
}

async function getForecastByCoords(lat, lon) {
    try {
        const url = window.location.protocol.startsWith('http')
            ? `/api/weather?lat=${lat}&lon=${lon}&mode=forecast`
            : `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();
        displayForecast(data);
    } catch (error) {
        console.error(error);
    }
}

function displayForecast(data){

    const forecastContainer =
    document.getElementById("forecastContainer");

    forecastContainer.innerHTML="";

    const dailyForecast=[];

    data.list.forEach(item=>{

        if(item.dt_txt.includes("12:00:00")){

            dailyForecast.push(item);

        }

    });

    dailyForecast.slice(0,5).forEach(day=>{

        const date=new Date(day.dt_txt);

        const dayName=date.toLocaleDateString("en-US",{

            weekday:"short"

        });

        forecastContainer.innerHTML+=`

        <div class="forecast-card">

            <h3>${dayName}</h3>

            <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png">

            <p>${Math.round(day.main.temp)}°C</p>

            <p>${day.weather[0].main}</p>

        </div>

        `;

    });

}

// =========================
// Update UI
// =========================

function updateWeather(data) {

    const temp = Math.round(data.main.temp);
    const feelsLike = Math.round(data.main.feels_like);
    const humidity = data.main.humidity;
    const pressure = data.main.pressure;
    const wind = Math.round(data.wind.speed);

    document.getElementById("city").textContent =
        data.name + ", " + data.sys.country;

    document.getElementById("temperature").textContent =
        temp + "°C";

    document.getElementById("condition").textContent =
        data.weather[0].description;

    document.getElementById("humidity").textContent =
        humidity + "%";

    document.getElementById("wind").textContent =
        wind + " km/h";

    document.getElementById("pressure").textContent =
        pressure + " hPa";

    document.getElementById("feelsLike").textContent =
        feelsLike + "°C";

    const icon = data.weather[0].icon;

    document.getElementById("weatherIcon").src =
        `https://openweathermap.org/img/wn/${icon}@4x.png`;

    updateDateTime(data.timezone);

}

// =========================
// Date & Time
// =========================

function updateDateTime(timezoneOffset) {

    const utc = new Date().getTime() + (new Date().getTimezoneOffset() * 60000);

    const cityTime = new Date(utc + (timezoneOffset * 1000));

    const options = {

        weekday: "long",

        day: "numeric",

        month: "long",

        year: "numeric",

        hour: "2-digit",

        minute: "2-digit",

        hour12: true

    };

    document.getElementById("date").textContent =
        cityTime.toLocaleString("en-US", options);

}

// =========================
// Search Button
// =========================

document.getElementById("searchBtn").addEventListener("click", () => {

    const city =
        document.getElementById("cityInput").value.trim();

    if (city !== "") {

        getWeather(city);
        getForecast(city);

    }

});

// =========================
// Enter Key
// =========================

document.getElementById("cityInput").addEventListener("keydown", (event) => {

    if (event.key === "Enter") {

        document.getElementById("searchBtn").click();

    }

});

// =========================
// Geolocation Detection
// =========================

const locationBtn = document.getElementById("locationBtn");

if (locationBtn) {
    locationBtn.addEventListener("click", () => {
        if (navigator.geolocation) {
            const icon = locationBtn.querySelector("i");
            const originalClass = icon.className;
            
            // Set spinner loading state
            icon.className = "fa-solid fa-spinner fa-spin";
            locationBtn.disabled = true;

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    await getWeatherByCoords(latitude, longitude);
                    await getForecastByCoords(latitude, longitude);
                    icon.className = originalClass;
                    locationBtn.disabled = false;
                },
                (error) => {
                    alert("Location access denied or unavailable.");
                    icon.className = originalClass;
                    locationBtn.disabled = false;
                    console.error(error);
                },
                { timeout: 8000 }
            );
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    });
}

// =========================
// Default Weather / Init
// =========================

function initWeather() {
    // 1. Immediately load default weather so the page is populated
    getWeather("Bengaluru");
    getForecast("Bengaluru");

    // 2. Request geolocation in background to overwrite if permission is granted
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                getWeatherByCoords(latitude, longitude);
                getForecastByCoords(latitude, longitude);
            },
            (error) => {
                console.log("Geolocation access denied or unavailable: ", error.message);
            }
        );
    }
}

// Run initialization
initWeather();

// Note: Dark/Light Mode is now managed by the shared js/theme.js script.