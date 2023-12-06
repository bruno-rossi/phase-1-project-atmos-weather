// Initialize temperature unit in case it isn't defined:
let temperatureUnit = "fahrenheit";

// User settings
fetch("http://localhost:3000/user_settings")
.then(response => response.json())
.then(userSettings => {
    temperatureUnit = userSettings.temperature_unit;
    document.querySelector("#select-temp-unit").value = temperatureUnit;
    console.log(temperatureUnit);

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
    fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${addressToSearch}&key=${process.env.API_KEY}`)
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

// Fetch locations from local db and createLocationCard forEach:
fetch("http://localhost:3000/locations")
.then(response => response.json())
.then(locations => {

    locations.forEach(location => {
        createLocationCard(location);
    })
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
        document.getElementById(`current-img-${location.id}`).style = "width:48px; height:48px;"

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
        imgInTable.style = "width:48px; height:48px;"
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
        return [ snow, "Light snow" ];
    } else if (weatherData.snowfall > 0.5 && weatherData.snowfall <= 4.0) {
        return [ snow, "Moderate snow" ];
    } else if (weatherData.snowfall > 4) {
        return [ snow, "Heavy snow" ];
    } else if (weatherData.rain > 0 && weatherData.snowfall <= 0.5) {
        return [ lightRain, "Light rain" ];
    } else if (weatherData.rain > 0.5 && weatherData.rain <= 4.0) {
        return [ moderateRain, "Moderate rain" ];
    } else if (weatherData.rain > 4) {
        return [ heavyRain, "Heavy rain" ];
    } else if (weatherData.cloud_cover > 5 && weatherData.cloud_cover <= 20 && weatherData.is_day === 1) {
        return [ clearWeatherDay, "Clear weather" ];
    } else if (weatherData.cloud_cover > 5 && weatherData.cloud_cover <= 20 && weatherData.is_day === 0) {
        return [ clearWeatherNight, "Clear weather" ];
    } else if (weatherData.cloud_cover > 20 && weatherData.cloud_cover <= 70) {
        return [ cloudy, "Cloudy" ];
    } else if (weatherData.cloud_cover > 70) {
        return [ cloudy, "Overcast" ];
    } else if (weatherData.is_day === 1) { 
        return [ clearWeatherDay, "Clear weather" ];
    } else if (weatherData.is_day === 0) {
        return [ clearWeatherNight, "Clear weather" ];
    } else {
        return [ , "Failed to load"];
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

