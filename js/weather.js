
async function getWeather(city) {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=aab108fe8f290daf0565265f0b126d81`);

    const data = await response.json();

    console.log(data);
    console.log(data.name);

    document.getElementById("city").textContent =
    `City: ${data.name}`;

    const tempC = Math.round(data.main.temp);

    document.getElementById("temperature").textContent =
    `Temperature: ${tempC}°C`;

    document.getElementById("humidity").textContent =
    `Humidity: ${data.main.humidity}%`;

    const windSpeed = Math.round(data.wind.speed);

    document.getElementById("wind").textContent =
    `Wind Speed: ${windSpeed} km/h`;

    document.getElementById("condition").textContent =
    `Condition: ${data.weather[0].main}`;

}

console.log("Weather module loaded");

getWeather("Bengaluru");

document.getElementById("searchBtn").addEventListener("click", function () {
    const city = document.getElementById("cityInput").value;

    getWeather(city);
});


