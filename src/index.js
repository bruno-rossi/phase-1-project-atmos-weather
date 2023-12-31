// Add localization functionality:
let locale;

const translations = {
    "en": {
        "atmos-weather": "Atmos Weather",
        "search-bar-placeholder": "Search for a location...",
        "temp-unit-fahrenheit": "Fahrenheit",
        "temp-unit-celsius": "Celsius",
        "condition-light-snow": "Light snow",
        "condition-moderate-snow": "Moderate snow",
        "condition-heavy-snow": "Heavy snow",
        "condition-light-rain": "Light rain",
        "condition-moderate-rain": "Moderate rain",
        "condition-heavy-rain": "Heavy rain",
        "condition-clear": "Clear weather",
        "condition-cloudy": "Cloudy",
        "condition-overcast": "Overcast",
        "failed-to-load": "Failed to load",
        "footer": "Sources: Weather data: Open-Meteo.com | Local time data: WorldTimeAPI.org | Location data: Google Geolocation API"
    },
    "pt-BR": {
        "atmos-weather": "Atmos Weather",
        "search-bar-placeholder": "Pesquisar local...",
        "temp-unit-fahrenheit": "Fahrenheit",
        "temp-unit-celsius": "Celsius",
        "condition-light-snow": "Pouca neve",
        "condition-moderate-snow": "Neve moderada",
        "condition-heavy-snow": "Neve forte",
        "condition-light-rain": "Garoa",
        "condition-moderate-rain": "Chuva leve",
        "condition-heavy-rain": "Chuva forte",
        "condition-clear": "Tempo limpo",
        "condition-cloudy": "Nublado",
        "condition-overcast": "Tempo fechado",
        "failed-to-load": "Falha ao carregar dados",
        "footer": "Fontes: Dados climáticos: Open-Meteo.com | Hora local: WorldTimeAPI.org | Dados de geolocalização: Google Geolocation API"
    }
}

// Initialize temperature unit in case it isn't defined:
let temperatureUnit;

// User settings
fetch("http://localhost:3000/user_settings")
.then(response => response.json())
.then(userSettings => {
    console.log(temperatureUnit);

    console.log(locale);
    
    temperatureUnit = userSettings.temperature_unit;
    document.querySelector("#select-temp-unit").value = temperatureUnit

    locale = userSettings.user_locale;
    console.log(locale);

    document.querySelector("#locale-switcher").value = userSettings.user_locale;

    console.log(locale);    
    console.log(temperatureUnit);

    document.querySelectorAll("[data-i18n-key]").forEach(translateString);

    function translateString(string) {
        
        const key = string.getAttribute("data-i18n-key");
        const translation = translations[locale][key];
        string.textContent = translation;

        document.querySelector("#location-bar").placeholder = translations[locale]["search-bar-placeholder"];
}

    // Fetch locations from local db and createLocationCard forEach:
    fetch("http://localhost:3000/locations")
    .then(response => response.json())
    .then(locations => {

        locations.forEach(location => {
            createLocationCard(location);
        })
    })

    document.querySelector("#locale-switcher").addEventListener("change", () => {
        locale = document.querySelector("#locale-switcher").value;

        fetch("http://localhost:3000/user_settings/", {
            method: "PATCH",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({user_locale: locale})
        })
        .then(response => response.json())
        .then(() => {
            
            fetch("http://localhost:3000/locations")
            .then(response => response.json())
            .then(locations => {
            
            document.querySelectorAll("[data-i18n-key]").forEach(translateString);

            locations.forEach(location => {
                document.querySelector("table").remove();
                displayLocationWeather(location);
            })
            })
        })
    })

    document.querySelector("#select-temp-unit").addEventListener("change", () => {
    
        temperatureUnit = document.querySelector("#select-temp-unit").value;
        console.log(temperatureUnit);
        fetch("http://localhost:3000/user_settings/", {
            method: "PATCH",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({temperature_unit: temperatureUnit})
        })
        .then(response => response.json())
        .then(() => {
            
            fetch("http://localhost:3000/locations")
            .then(response => response.json())
            .then(locations => {
    
            locations.forEach(location => {
                document.querySelector("table").remove();
                displayLocationWeather(location);
            })
            })
        })
    })

})

// Location search bar form functionality:
const locationForm = document.querySelector("#location-search-form");

locationForm.addEventListener("submit", event => {
    event.preventDefault();

    // Get the address to search from the location bar. Replace spaces in the input with + signs:
    const addressToSearch = document.querySelector("#location-bar").value.replaceAll(" ", "+");

    console.log(addressToSearch);

    // Fetch first search result from Google Geocoding API:
    fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${addressToSearch}&language=${locale}&key=${process.env.API_KEY}`)
    .then(response => response.json())
    .then(geolocation => {
        console.log(geolocation);

        let newLocation = {
            "location_name": geolocation.results[0].formatted_address,
            "latitude": geolocation.results[0].geometry.location.lat,
            "longitude": geolocation.results[0].geometry.location.lng
        };

        // Post new location to local database:
        fetch("http://localhost:3000/locations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(newLocation)
        })
        .then(response => response.json())
        .then(newLocation => {
            // Create a card to display the new location: 
            createLocationCard(newLocation);
        })
    })

    event.target.reset();
})

function createLocationCard(location) {

    // Create card for location weather:
    const divTag = document.createElement("div");
    divTag.classList = "cards";

    const h3Tag = document.createElement("h3");
    h3Tag.textContent = location.location_name;

    const h1Tag = document.createElement("h1");
    h1Tag.id = location.id;

    const h2Tag = document.createElement("h2");
    h2Tag.id = `current-time-${location.id}`

    const pTag = document.createElement("p");
    pTag.id = `current-condition-${location.id}`;

    const imgTag = document.createElement("img");
    imgTag.id = `current-img-${location.id}`;

    const removeButton = document.createElement("button");
    removeButton.textContent = "x"
    removeButton.style.opacity = 0;

    displayLocationWeather(location);

    divTag.append(removeButton, h3Tag, h2Tag, h1Tag, imgTag, pTag);
    document.querySelector("#my-locations").append(divTag);
    
    // Add remove button functionality:
    divTag.addEventListener("mouseover", () => {
        removeButton.style.opacity = 1;
    })

    divTag.addEventListener("mouseout", () => {
        removeButton.style.opacity = 0;
    })

    removeButton.addEventListener("click", event => {
        fetch(`http://localhost:3000/locations/${location.id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        })
        event.target.parentNode.remove();
    })
}

// Define displayLocationWeather function that takes in a location object as argument:
function displayLocationWeather(location) {
    
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,is_day,rain,snowfall,cloud_cover&hourly=temperature_2m,is_day,rain,snowfall,cloud_cover&temperature_unit=${temperatureUnit}&timezone=auto&forecast_days=2`)
    .then(response => response.json())
    .then(locationWeatherData => {
        console.log(locationWeatherData);

        // Display current temperature:
        document.getElementById(`${location.id}`).textContent = `${locationWeatherData.current.temperature_2m}${locationWeatherData.current_units.temperature_2m}`;

        // Get the timezone from the weather data and split it into an array:
        const timezone = locationWeatherData.timezone.split("/");
        // => [ "continent", "region"], ex: America/New_York => [ "America", "New_York"]

        // Pass the timezone elements into the URL for a fetch to get current time from API:
        fetch(`http://worldtimeapi.org/api/timezone/${timezone[0]}/${timezone[1]}
        `)
        .then(response => response.json())
        .then(currentTime => {
            const current_time_formatted = currentTime.datetime.slice(11, 16);
            document.getElementById(`current-time-${location.id}`).textContent = `${current_time_formatted}`;
        })

        // Resolve and display current weather condition:
        document.getElementById(`current-condition-${location.id}`).textContent = `${currentWeatherCondition(locationWeatherData.current)[1]}`;
        document.getElementById(`current-img-${location.id}`).src = `${currentWeatherCondition(locationWeatherData.current)[0]}`;
        document.getElementById(`current-img-${location.id}`).alt = `${currentWeatherCondition(locationWeatherData.current)[1]}`;
        document.getElementById(`current-img-${location.id}`).style = "width:96px; height:96px;"

        // Slice the current time from the weather API call, search for it in the array of hourly data, and get its index:
        const indexOfFirstHourly = locationWeatherData.hourly.time.indexOf(`${locationWeatherData.current.time.slice(0, 14)}` + `00`);

        // Since we want to display the forecast for the next 6 hours in the table, we calculate the 6th item in the array of hourly data counting from the first:
        const indexOfSixthHourly = indexOfFirstHourly + 6;
        // console.log(indexOfSixthHourly);

        // Initialize a nextSixHours array and then iterate on the hourly weather data to get the data for the 6 hours:
        const nextSixHours = [];

        for (let i = indexOfFirstHourly; i < indexOfSixthHourly; i++) {
            
            const hourlyObj = {
                time: locationWeatherData.hourly.time[i],
                temperature: locationWeatherData.hourly.temperature_2m[i],
                temperature_unit: locationWeatherData.hourly_units.temperature_2m,
                is_day: locationWeatherData.hourly.is_day[i],
                cloud_cover: locationWeatherData.hourly.cloud_cover[i],
                rain: locationWeatherData.hourly.rain[i],
                snowfall: locationWeatherData.hourly.snowfall[i]
            };
            nextSixHours.push(hourlyObj);
        }
        
        // Execute the function to create the hourly forecast table, with the nextSixhours and location as arguments:
        createHourlyForecastTable(nextSixHours, location);
    })
}

// Define function to create the hourly forecast table:
function createHourlyForecastTable(weatherData, location) {
    
    // Create table for hourly data:
    const tableTag = document.createElement("table");
    const theadTag = document.createElement("thead");
    const trTemperature = document.createElement("tr");
    const trImg = document.createElement("tr");
    const trCondition = document.createElement("tr");
    
    tableTag.append(theadTag, trCondition, trImg, trTemperature);


    // Iterate on the weather data to create a column (td) for each item:
    for (let i = 0; i < weatherData.length; i++) {

        const tdTagHour = document.createElement("td");
        tdTagHour.textContent = weatherData[i].time.slice([11]);
        theadTag.append(tdTagHour);

        const tdTagTemperature = document.createElement("td");
        tdTagTemperature.textContent = `${weatherData[i].temperature} ${weatherData[i].temperature_unit}`;
        trTemperature.append(tdTagTemperature);

        const tdCondition = document.createElement("td");
        tdCondition.textContent = `${currentWeatherCondition(weatherData[i])[1]}`;
        trCondition.append(tdCondition);

        const tdImage = document.createElement("td");
        const imgInTable = document.createElement("img");
        imgInTable.style = "width:72; height:72px;"
        imgInTable.src = `${currentWeatherCondition(weatherData[i])[0]}`;
        imgInTable.alt = `${currentWeatherCondition(weatherData[i])[1]}`;
        tdImage.append(imgInTable);
        trImg.append(tdImage);
    }

    document.getElementById(`${location.id}`).parentNode.append(tableTag);

}

// Define function to resolve weather condition, to be used for current condition and hourly condition:
function currentWeatherCondition(weatherData) {

    if (weatherData.snowfall > 0 && weatherData.snowfall <= 0.5) {
        return [ snow, translations[locale]["condition-light-snow"] ];
    } else if (weatherData.snowfall > 0.5 && weatherData.snowfall <= 4.0) {
        return [ snow, translations[locale]["condition-moderate-snow"] ];
    } else if (weatherData.snowfall > 4) {
        return [ snow, translations[locale]["condition-heavy-snow"] ];
    } else if (weatherData.rain > 0 && weatherData.snowfall <= 0.5) {
        return [ lightRain, translations[locale]["condition-light-rain"] ];
    } else if (weatherData.rain > 0.5 && weatherData.rain <= 4.0) {
        return [ moderateRain, translations[locale]["condition-moderate-rain"] ];
    } else if (weatherData.rain > 4) {
        return [ heavyRain, translations[locale]["condition-heavy-rain"] ];
    } else if (weatherData.cloud_cover > 5 && weatherData.cloud_cover <= 20 && weatherData.is_day === 1) {
        return [ clearWeatherDay, translations[locale]["condition-clear"] ];
    } else if (weatherData.cloud_cover > 5 && weatherData.cloud_cover <= 20 && weatherData.is_day === 0) {
        return [ clearWeatherNight, translations[locale]["condition-clear"] ];
    } else if (weatherData.cloud_cover > 20 && weatherData.cloud_cover <= 70) {
        return [ cloudy, translations[locale]["condition-cloudy"] ];
    } else if (weatherData.cloud_cover > 70) {
        return [ cloudy, translations[locale]["condition-overcast"] ];
    } else if (weatherData.is_day === 1) { 
        return [ clearWeatherDay, translations[locale]["condition-clear"] ];
    } else if (weatherData.is_day === 0) {
        return [ clearWeatherNight, translations[locale]["condition-clear"] ];
    } else {
        return [ , translations[locale]["failed-to-load"]];
    }
}

// Import image assets: import imageName from '../assets/imageName.jpg';
import clearWeatherDay from "../assets/clearWeatherDay.png";
import clearWeatherNight from "../assets/clearWeatherNight.png"; 
import snow from "../assets/snow.png";
import lightRain from "../assets/lightRain.png";
import moderateRain from "../assets/moderateRain.png";
import heavyRain from "../assets/heavyRain.png";
import cloudy from "../assets/cloudy.png";


