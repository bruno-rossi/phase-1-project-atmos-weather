# phase-1-project-atmos-weather
GitHub Repository for my Flatiron School Software Engineering Phase 1 final project. The goal is to build a weather app from scratch using a publicly available API.

# MVP User Stories

12/1/2023:
As a user, I would like to enter a location's name, latitude and longitude, and display the current temperature for that location.

As a user, I would like to keep a collection of locations and temperatures that I'm tracking. When I select a new location, it gets added to my collection and displayed in the collection of locations and temperatures.

As a user, I would like to remove a location from my collection.

12/2/2023:
As a user, I would like to search for and add a location to my collection by name, without having to specify lat and lng.

12/4/23: 
As a user, I would like to view the current time and weather at my selected locations. Display the time of day and whether it is sunny, overcast, raining, snowing.

As a user, I would like to see the weather forecast, that is, temperature and condition, for the next 6 hours, for each of my selected locations, displayed as a table.

Maintenance work: Refactor code to create a new object per location. The new object will have the following structure:
{
    location_name: "New York",
    local_time: "12:45",
    current_temperature: 50.1°F",
    current_condition: "Light rain",
    next_six_hours: [
        {
            id: 1,
            time: "01:00",
            current_temperature: 50.1°F",
            current_condition: "Light rain"
        },
        {
            id: 2,
            time: "02:00",
            current_temperature: 50.1°F",
            current_condition: "Light rain"
        },
        {
            id: 3,
            time: "03:00",
            current_temperature: 50.1°F",
            current_condition: "Light rain"
        },
        {
            id: 4,
            time: "04:00",
            current_temperature: 50.1°F",
            current_condition: "Light rain"
        },
        {
            id: 5,
            time: "05:00",
            current_temperature: 50.1°F",
            current_condition: "Light rain"
        },
        {
            id: 6,
            time: "06:00",
            current_temperature: 50.1°F",
            current_condition: "Light rain"
        }
    ]
}

Backlog:
As a user, I would like to view the weather forecast for the next 3 days. 

As a user, I would like to toggle between Fahrenheit temperatures and Celsius temperatures and milimeters/inches.

As a user, I would like to change the date and time format.

Bonus: As a user, I would like to view the page in a different language (enable localization).

