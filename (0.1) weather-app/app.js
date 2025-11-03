'use strict';

const widget = document.getElementById('js-widget');
const searchInput = document.getElementById('js-search-input');
const searchBtn = document.getElementById('js-search-btn');
const searchError = document.getElementById('js-search-error');
const searchResult = document.getElementById('js-search-result');
const cleanBtn = document.getElementById('js-clean-btn');
const favoriteBtn = document.getElementById('js-favorite-btn');
const favoritesResult = document.getElementById('js-favorites-result');
let favoriteCities = [];

searchBtn.addEventListener('click', showCityWeather);
cleanBtn.addEventListener('click', cleanSearch);
favoriteBtn.addEventListener('click', addCityToFavoriets);

async function cleanSearch() {
    searchInput.value = '';
    searchError.textContent = '';
    searchResult.innerHTML = '';
    widget.className = 'container';
}

async function showCityWeather() {
    searchError.textContent = ''; 
    const cityActiveSearchName = searchInput.value.trim();
    
    if (!cityActiveSearchName) {
        searchError.textContent = 'Put your city name.';
        return;
    }

    const cityActiveSearchCoordinates = await receiveCityCoordinates(cityActiveSearchName);

    if (!cityActiveSearchCoordinates) {
        return;
    }

    const cityActiveSearchWeatherInfo = await receiveAllWeaterData(cityActiveSearchCoordinates);

    showWeatherInfo(cityActiveSearchWeatherInfo);
}

async function receiveCityCoordinates(cityName) {
    const encodedCityName = encodeURIComponent(cityName);
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodedCityName}&count=1&language=en`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            searchError.textContent = 'Sorry, error while fetching coordinates. Please try again later.';
            return;
        }

        const data = await response.json();
        
        if(!data.results || data.results.length == 0) {
            searchError.textContent = 'City not found. Please check correct city name.';
            return;
        }
        
        const { latitude, longitude, country, name } = data.results[0];

        return { latitude, longitude, country, name };

    } catch(error) {
        searchError.textContent = 'Sorry, server is not responding now. Please try again later.';
        console.error(error);
    }
}

async function receiveAllWeaterData({ latitude, longitude, country, name }) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            searchError.textContent = 'Sorry, error while fetching city weather. Please try again later.';
            return;
        }

        const data = await response.json();
        
        if(!data || data.length == 0) {
            searchError.textContent = 'Weather data not found. Please check correct city name.';
            return;
        }
        
        // Current Weather
        const currentWeather = data.current_weather;
        const currentWeatherUnits = data.current_weather_units;

        const weatherCodes = {
            0: 'Clear sky',
            1: 'Mainly clear',
            2: 'Partly cloudy',
            3: 'Overcast',
            45: 'Fog',
            48: 'Depositing rime fog',
            51: 'Light drizzle',
            53: 'Moderate drizzle',
            55: 'Dense drizzle',
            56: 'Light freezing drizzle',
            57: 'Dense freezing drizzle',
            61: 'Light rain showers',
            63: 'Moderate rain showers',
            65: 'Heavy rain showers',
            66: 'Light freezing rain showers',
            67: 'Heavy freezing rain showers',
            71: 'Light snow showers',
            73: 'Moderate snow showers',
            75: 'Heavy snow showers',
            77: 'Snow grains',
            80: 'Light rain showers',
            81: 'Moderate rain showers',
            82: 'Heavy rain showers',
            85: 'Light snow showers',
            86: 'Heavy snow showers',
            95: 'Thunderstorms',
            96: 'Thunderstorms with light hail',
            99: 'Thunderstorms with heavy hail'
        };

        const weatherDescription = weatherCodes[currentWeather.weathercode];

        const isRainy = [51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82].includes(currentWeather.weathercode);
        const isSnowy = [71, 73, 75, 77, 85, 86].includes(currentWeather.weathercode);
        const isSunny = [0].includes(currentWeather.weathercode);
        const isSunCloudy = [1, 2].includes(currentWeather.weathercode);
        const isCloudy = [3].includes(currentWeather.weathercode);
        const isThunder = [95, 96, 99].includes(currentWeather.weathercode);

        // Daily Forecast
        const dailyForecast = data.daily;
        const nextFiveDays = dailyForecast.time.slice(0, 5).map((date, i) => ({
            date, 
            min: dailyForecast.temperature_2m_min[i] + currentWeatherUnits.temperature,
            max: dailyForecast.temperature_2m_max[i] + currentWeatherUnits.temperature
        }));


        return {
            region: {
                cityName: name, 
                countryName: country
            },
            currentWeather: {
                temperature: currentWeather.temperature + currentWeatherUnits.temperature,
                windSpeed: currentWeather.windspeed + currentWeatherUnits.windspeed,
                description: weatherDescription,
                isRainy, isSnowy, isSunny, isSunCloudy, isCloudy, isThunder
            },
            dailyWeather: nextFiveDays
        }

    } catch {
        searchError.textContent = 'Sorry, server is not responding now. Please try again later.';
        console.error(error);
    }
}

async function showWeatherInfo(data) {
    searchResult.innerHTML = `
        <ul class="result-card">
            <li>City: <strong>${data.region.cityName} </strong></li>
            <li>Country: <strong>${data.region.countryName} </strong></li>
            <li>Temperature: <strong>${data.currentWeather.temperature} </strong></li>
            <li>Wind Spead: <strong>${data.currentWeather.windSpeed} </strong></li>
            <li>Description: <strong>${data.currentWeather.description} </strong></li>
        </ul>

        <ul class="result-card" id="js-next-five-days">
        </ul>
    `;

    const searchResultForecast = document.getElementById('js-next-five-days');

    data.dailyWeather.forEach(day => {
        const item = document.createElement('li');
        item.innerHTML = `<strong>${day.date}</strong> — min: ${day.min}, max: ${day.max}`;
        searchResultForecast.appendChild(item);
    });

    const weatherClass = await getWeatherClass(data.currentWeather);
    widget.className = `container ${weatherClass}`;
}

async function getWeatherClass(weather) {
    if (weather.isRainy) return 'is-rainy';
    if (weather.isSnowy) return 'is-snowy';
    if (weather.isSunny) return 'is-sunny';
    if (weather.isSunCloudy) return 'is-sun-cloudy';
    if (weather.isCloudy) return 'is-cloudy';
    if (weather.isThunder) return 'is-thunder';
    return '';
}

async function addCityToFavoriets() {
    const cityName = searchInput.value.trim();

    if (!cityName) {
        searchError.textContent = 'Please enter a city first.';
        return;
    }

    if (favoriteCities.includes(cityName)) {
        searchError.textContent = 'City is already in favorites.';
        return;
    }

    favoriteCities.push(cityName);
    localStorage.setItem('favoriteCities', JSON.stringify(favoriteCities));
    await renderFavorites();
}

async function renderFavorites() {
    if (favoritesResult.classList.contains('d-none') && favoriteCities.length > 0) favoritesResult.classList.remove('d-none');
    favoritesResult.innerHTML = '';

    favoriteCities.forEach(city => {
        const cityElement = document.createElement('li');
        cityElement.textContent = city;
        
        cityElement.addEventListener('click', () => {
            searchInput.value = city;
            showCityWeather();
        });

        favoritesResult.appendChild(cityElement);
    });
}

window.addEventListener('DOMContentLoaded', () => {
    const savedCities = JSON.parse(localStorage.getItem('favoriteCities')) || [];
    favoriteCities = savedCities;
    renderFavorites();
});
