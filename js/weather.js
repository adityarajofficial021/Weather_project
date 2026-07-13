const API_KEY = "aab108fe8f290daf0565265f0b126d81";

// =========================
// Fetch Weather
// =========================

async function getWeather(city) {

    try {

        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
        );

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

    const response = await fetch(

`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`

    );

    const data = await response.json();

    displayForecast(data);

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
// Default Weather
// =========================

getWeather("Bengaluru");
getForecast("Bengaluru");

// =========================
// DARK/LIGHT MODE
// =========================

const themeToggle = document.getElementById("themeToggle");

// Load saved theme
if(localStorage.getItem("theme") === "light"){

    document.body.classList.add("light-mode");

    themeToggle.textContent = "☀️";

}

themeToggle.addEventListener("click", ()=>{

    document.body.classList.toggle("light-mode");

    if(document.body.classList.contains("light-mode")){

        themeToggle.textContent="☀️";

        localStorage.setItem("theme","light");

    }

    else{

        themeToggle.textContent="🌙";

        localStorage.setItem("theme","dark");

    }

});