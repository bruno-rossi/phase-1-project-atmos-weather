let temperatureUnit = "fahrenheit";

// User settings
fetch("http://localhost:3000/user_settings")
.then(response => response.json())
.then(userSettings => {
    temperatureUnit = userSettings.temperature_unit;
    document.querySelector("#select-temp-unit").value = temperatureUnit;
    console.log(temperatureUnit);

    document.querySelector("#select-temp-unit").addEventListener("change", event => {
    
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

// Location search bar form functionality
const locationForm = document.querySelector("#location-search-form");
locationForm.addEventListener("submit", event => {
    event.preventDefault();

    const addressToSearch = document.querySelector("#location-bar").value.replaceAll(" ", "+");

    console.log(addressToSearch);

    fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${addressToSearch}&key=${process.env.API_KEY}`)
    .then(response => response.json())
    .then(geolocation => {
        console.log(geolocation);

        let newLocation = {
            "location_name": geolocation.results[0].formatted_address,
            "latitude": geolocation.results[0].geometry.location.lat,
            "longitude": geolocation.results[0].geometry.location.lng
        };

        // Post new location to local database
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
            
            createLocationCard(newLocation);

        })
    })

    event.target.reset();
})

// Fetch locations from local db and createLocationCard forEach.
fetch("http://localhost:3000/locations")
.then(response => response.json())
.then(locations => {

    locations.forEach(location => {
        createLocationCard(location);
    })
})

function createLocationCard(location) {

    // Create card for location weather
    const divTag = document.createElement("div");
    divTag.classList = "cards";

    const h3Tag = document.createElement("h2");
    h3Tag.textContent = location.location_name;

    const h1Tag = document.createElement("h1");
    h1Tag.id = location.id;

    const h2Tag = document.createElement("h2");
    h2Tag.id = `current-time-${location.id}`

    const pTag = document.createElement("p");
    pTag.id = `current-condition-${location.id}`;

    const removeButton = document.createElement("button");
    removeButton.textContent = "x"
    removeButton.style.opacity = 0;

    displayLocationWeather(location);

    divTag.append(removeButton, h3Tag, h2Tag, h1Tag, pTag);
    document.querySelector("#my-locations").append(divTag);
    
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

// function getCurrentTime(location) {
//     fetch(`https://timeapi.io/api/TimeZone/coordinate?latitude=${location.latitude}&longitude=${location.longitude}
//     `)
//     .then(response => response.json())
//     .then(currentTime => {
//         console.log(currentTime)
//     })
// }

function displayLocationWeather(location) {
    
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,is_day,rain,snowfall,cloud_cover&hourly=temperature_2m,rain,snowfall,cloud_cover&temperature_unit=${temperatureUnit}&timezone=auto&forecast_days=2`)
    .then(response => response.json())
    .then(locationWeatherData => {
        console.log(locationWeatherData);

        document.getElementById(`${location.id}`).textContent = `${locationWeatherData.current.temperature_2m}${locationWeatherData.current_units.temperature_2m}`;

        // Slice the current.time property starting from index 11 to get time in hh:mm format
        const current_time_formatted = locationWeatherData.current.time.slice([11]);
        // console.log(current_time_formatted);

        document.getElementById(`current-time-${location.id}`).textContent = `Time: ${current_time_formatted}`;

        document.getElementById(`current-condition-${location.id}`).textContent = `${currentWeatherCondition(locationWeatherData)}`;

        const indexOfFirstHourly = locationWeatherData.hourly.time.indexOf(`${locationWeatherData.current.time.slice(0, 14)}` + `00`);

        const indexOfSixthHourly = indexOfFirstHourly + 6;
        console.log(indexOfSixthHourly);

        const nextSixHours = [];

        for (let i = indexOfFirstHourly; i < indexOfSixthHourly; i++) {
            
            const hourlyObj = {
                time: locationWeatherData.hourly.time[i],
                temperature: locationWeatherData.hourly.temperature_2m[i],
                temperature_unit: locationWeatherData.hourly_units.temperature_2m,
                cloud_cover: locationWeatherData.hourly.cloud_cover[i],
                rain: locationWeatherData.hourly.rain[i],
                snowfall: locationWeatherData.hourly.snowfall[i]
            };
            nextSixHours.push(hourlyObj);
        }
        
        createHourlyForecastTable(nextSixHours, location);

        currentWeatherCondition(locationWeatherData.current);
    })
}

function createHourlyForecastTable(weatherData, location) {
    
    // Create table for hourly data:
    const tableTag = document.createElement("table");
    const theadTag = document.createElement("thead");
    const trTemperature = document.createElement("tr");
    const trCondition = document.createElement("tr");
    
    tableTag.append(theadTag, trCondition, trTemperature);

    // const slicedWeatherDataHours = weatherData.hourly.time.slice(0, 6);
    // const slicedWeatherDataTemperature = weatherData.hourly.temperature_2m.slice(0, 6);

    for (let i = 0; i < weatherData.length; i++) {

        const tdTagHour = document.createElement("td");
        tdTagHour.textContent = weatherData[i].time.slice([11]);
        theadTag.append(tdTagHour);

        const tdTagTemperature = document.createElement("td");
        tdTagTemperature.textContent = `${weatherData[i].temperature} ${weatherData[i].temperature_unit}`;
        trTemperature.append(tdTagTemperature);

        const tdCondition = document.createElement("td");
        tdCondition.textContent = `${currentWeatherCondition(weatherData[i])}`;
        trCondition.append(tdCondition);
    }

    document.getElementById(`${location.id}`).parentNode.append(tableTag);

}

function currentWeatherCondition(weatherData) {

    // return `${dayOrNight()}, ${clouds()}, ${isRaining()}, ${isSnowing()}`;
    
    // function dayOrNight (){
    //     if (weatherData.current.is_day === 1) {
    //     return "It's daytime!";
    // } else {
    //     return "It's nighttime!";
    // };}

    if (weatherData.snowfall > 0 && weatherData.snowfall <= 0.5) {
        return "Light snow";
    } else if (weatherData.snowfall > 0.5 && weatherData.snowfall <= 4.0) {
        return "Moderate snow";
    } else if (weatherData.snowfall > 4) {
        return "Heavy snow";
    } else if (weatherData.rain > 0 && weatherData.snowfall <= 0.5) {
        return "Light rain";
    } else if (weatherData.rain > 0.5 && weatherData.rain <= 4.0) {
        return "Moderate rain";
    } else if (weatherData.rain > 4) {
        return "Heavy rain";
    } else if (weatherData.cloud_cover > 5 && weatherData.cloud_cover <= 20) {
        return "Clear skies";
    } else if (weatherData.cloud_cover > 20 && weatherData.cloud_cover <= 60) {
        return "Cloudy";
    } else if (weatherData.cloud_cover > 60 && weatherData.cloud_cover <= 100) {
        return "Overcast";
    } else { 
        return "Clear weather";
    };
}
