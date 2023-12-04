const userProfile = {
    temperature_unit: "fahrenheit",
    precipitation_unit: "inch",
    wind_speed: "kmh"
};
fetch("http://localhost:3000/locations").then((response)=>response.json()).then((locations)=>{
    locations.forEach((location)=>{
        createLocationCard(location);
    });
});
function createLocationCard(location) {
    // Create card for location weather
    const divTag = document.createElement("div");
    divTag.classList = "cards";
    const h3Tag = document.createElement("h3");
    h3Tag.textContent = location.location_name;
    const h1Tag = document.createElement("h1");
    h1Tag.id = location.id;
    const h2Tag = document.createElement("h2");
    h2Tag.id = `current-time-${location.id}`;
    const removeButton = document.createElement("button");
    removeButton.textContent = "x";
    displayLocationWeather(location);
    divTag.append(h3Tag, h2Tag, h1Tag, removeButton);
    document.querySelector("#my-locations").append(divTag);
    removeButton.addEventListener("click", (event)=>{
        fetch(`http://localhost:3000/locations/${location.id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        });
        event.target.parentNode.remove();
    });
}
function displayLocationWeather(location) {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,is_day,precipitation,rain,showers,snowfall,cloud_cover,wind_speed_10m&hourly=temperature_2m,precipitation_probability,precipitation,rain,showers,snowfall,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high&temperature_unit=fahrenheit&precipitation_unit=inch&timezone=auto`).then((response)=>response.json()).then((locationWeatherData)=>{
        console.log(locationWeatherData);
        document.getElementById(`${location.id}`).textContent = `${locationWeatherData.current.temperature_2m}${locationWeatherData.current_units.temperature_2m}`;
        document.getElementById(`current-time-${location.id}`).textContent = `${locationWeatherData.current.time} ${locationWeatherData.timezone}`;
        createHourlyForecastTable(locationWeatherData, location);
        currentWeatherCondition(locationWeatherData);
    });
}
const locationForm = document.querySelector("#location-search");
locationForm.addEventListener("submit", (event)=>{
    event.preventDefault();
    const addressToSearch = document.querySelector("#location-bar").value.replaceAll(" ", "+");
    console.log(addressToSearch);
    fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${addressToSearch}&key=AIzaSyDDGjaILsNwimx1opHCdZ_3DJgMeHd2C7s`).then((response)=>response.json()).then((geolocation)=>{
        console.log(geolocation);
        let newLocation = {
            "location_name": geolocation.results[0].formatted_address,
            "latitude": geolocation.results[0].geometry.location.lat,
            "longitude": geolocation.results[0].geometry.location.lng
        };
        fetch("http://localhost:3000/locations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(newLocation)
        }).then((response)=>response.json()).then((newLocation)=>{
            createLocationCard(newLocation);
        });
    });
    event.target.reset();
});
function createHourlyForecastTable(weatherData, location) {
    // Create table for hourly data:
    const tableTag = document.createElement("table");
    const theadTag = document.createElement("thead");
    const trTag = document.createElement("tr");
    tableTag.append(theadTag, trTag);
    const slicedWeatherDataHours = weatherData.hourly.time.slice(0, 6);
    const slicedWeatherDataTemperature = weatherData.hourly.temperature_2m.slice(0, 6);
    for(let i = 0; i < slicedWeatherDataHours.length; i++){
        const tdTagHour = document.createElement("td");
        tdTagHour.textContent = slicedWeatherDataHours[i];
        theadTag.append(tdTagHour);
        const tdTagTemperature = document.createElement("td");
        tdTagTemperature.textContent = `${slicedWeatherDataTemperature[i]} ${weatherData.hourly_units.temperature_2m}`;
        trTag.append(tdTagTemperature);
    }
    document.getElementById(`${location.id}`).parentNode.append(tableTag);
}
function currentWeatherCondition(weatherData) {
    if (weatherData.current.is_day === 1) console.log("It's daytime!");
    else console.log("It's nighttime!");
    if (weatherData.current.cloud_cover <= 30) console.log("Today the sky is clear!");
    else if (weatherData.current.cloud_cover <= 60) console.log("There are a few clouds in the sky...");
    else if (weatherData.current.cloud_cover <= 90) console.log("The sky is mostly cloudy right now...");
    else console.log("Completely overcast");
    if (weatherData.current.rain === 0) console.log("No rain");
    else if (weatherData.current.rain <= 0.5) console.log("Light rain");
    else if (weatherData.current.rain <= 4.0) console.log("Moderate rain");
    else console.log("Heavy Rain");
    if (weatherData.current.snowfall === 0) console.log("It is not snowing");
    else if (weatherData.current.snowfall <= 0.5) console.log("Light snow");
    else if (weatherData.current.snowfall <= 4.0) console.log("Moderate snow");
    else console.log("Heavy snow");
}

//# sourceMappingURL=index.579125c3.js.map
