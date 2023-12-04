// Location search bar form functionality
const locationForm = document.querySelector("#location-search");
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

    const h3Tag = document.createElement("h3");
    h3Tag.textContent = location.location_name;

    const h1Tag = document.createElement("h1");
    h1Tag.id = location.id;

    const h2Tag = document.createElement("h2");
    h2Tag.id = `current-time-${location.id}`

    const pTag = document.createElement("p");
    pTag.id = `current-condition-${location.id}`;

    const removeButton = document.createElement("button");
    removeButton.textContent = "x"

    displayLocationWeather(location);

    divTag.append(h3Tag, h2Tag, h1Tag, pTag, removeButton);
    document.querySelector("#my-locations").append(divTag);

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

function displayLocationWeather(location) {
    
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,is_day,precipitation,rain,showers,snowfall,cloud_cover,wind_speed_10m&hourly=temperature_2m,precipitation_probability,precipitation,rain,showers,snowfall,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high&temperature_unit=fahrenheit&precipitation_unit=inch&timezone=auto`)
    .then(response => response.json())
    .then(locationWeatherData => {
        console.log(locationWeatherData);

        document.getElementById(`${location.id}`).textContent = `${locationWeatherData.current.temperature_2m}${locationWeatherData.current_units.temperature_2m}`;

        // Slice the current.time property starting from index 11 to get time in hh:mm format
        const current_time_formatted = locationWeatherData.current.time.slice([11]);
        console.log(current_time_formatted);

        document.getElementById(`current-time-${location.id}`).textContent = `${current_time_formatted}`

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

        currentWeatherCondition(locationWeatherData);
    })
}

// const userProfile = {
//     temperature_unit: "fahrenheit",
//     precipitation_unit: "inch",
//     wind_speed: "kmh"
// }


function createHourlyForecastTable(weatherData, location) {
    
    // Create table for hourly data:
    const tableTag = document.createElement("table");
    const theadTag = document.createElement("thead");
    const trTag = document.createElement("tr");
    
    tableTag.append(theadTag, trTag);

    // const slicedWeatherDataHours = weatherData.hourly.time.slice(0, 6);
    // const slicedWeatherDataTemperature = weatherData.hourly.temperature_2m.slice(0, 6);

    for (let i = 0; i < weatherData.length; i++) {

        const tdTagHour = document.createElement("td");
        tdTagHour.textContent = weatherData[i].time.slice([11]);
        theadTag.append(tdTagHour);

        const tdTagTemperature = document.createElement("td");
        tdTagTemperature.textContent = `${weatherData[i].temperature} ${weatherData[i].temperature_unit}`;
        trTag.append(tdTagTemperature);
    }

    document.getElementById(`${location.id}`).parentNode.append(tableTag);

}

function currentWeatherCondition(weatherData) {

    return `${dayOrNight()}, ${clouds()}, ${isRaining()}, ${isSnowing()}`;

    
    function dayOrNight (){
        if (weatherData.current.is_day === 1) {
        return "It's daytime!"
    } else {
        return "It's nighttime!"
    };}

    function clouds() {
        if (weatherData.current.cloud_cover <= 30) {
            return "Today the sky is clear!"
        } else if (weatherData.current.cloud_cover <= 60) {
            return "There are a few clouds in the sky..."
        } else if (weatherData.current.cloud_cover <= 90) {
            return "The sky is mostly cloudy right now..."
        } else { 
            return "Completely overcast"
        };
    } 

    function isRaining() {
        if (weatherData.current.rain === 0) {
            return "No rain"
        } else if (weatherData.current.rain <= 0.5) {
            return "Light rain"
        } else if (weatherData.current.rain <= 4.0) {
            return "Moderate rain"
        } else {
            return "Heavy Rain"
        };
    }

    function isSnowing() {
        if (weatherData.current.snowfall === 0) {
            return "It is not snowing"
        } else if (weatherData.current.snowfall <= 0.5) {
            return "Light snow"
        } else if (weatherData.current.snowfall <= 4.0) {
            return "Moderate snow"
        } else {
            return "Heavy snow"
        };
    }

}
