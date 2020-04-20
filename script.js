const dataApp = {} //namespace object

// GLOBAL VARIABLES
// property store the map
dataApp.map = '';
dataApp.marker = '';
dataApp.lineGraph = null; 
dataApp.blue = '#30bbdd';
dataApp.red = '#f55179';
dataApp.green = '#64d9c1';
// object to store month
dataApp.months = {
    '01': 'Jan',
    '02': 'Feb',
    '03': 'Mar',
    '04': 'Apr',
    '05': 'May',
    '06': 'Jun',
    '07': 'Jul',
    '08': 'Aug',
    '09': 'Sep',
    '10': 'Oct',
    '11': 'Nov',
    '12': 'Dec'
}

// Overrides for the Chart.js default settings
Chart.defaults.global.defaultFontFamily = "'Source Sans Pro', 'Arial', sans-serif";
Chart.defaults.global.defaultFontSize = 14;
Chart.defaults.global.hover.intersect = false;

// AJAX CALLS - PROMISE OBJECTS
// return global data promise
// Params: @EndPoint - summary or countries
dataApp.getGlobalData = (endPoint) => {
    return $.ajax({
        url: `https://api.covid19api.com/${endPoint}`,
        method: 'GET',
        format: 'jsonp'
    })
}

// returns the country data promise
// Params: @CountryCode
dataApp.getCountryData = function (countryCode) {
    return $.ajax({
        url: `https://api.covid19api.com/total/country/${countryCode}`,
        method: 'GET',
        format: 'jsonp'
    });
}

// returns rest countries data promise
// Params: @CountryCode
dataApp.getRestCountriesData = function (countryCode) {
    const apiUrl = `https://restcountries-v1.p.rapidapi.com/alpha/${countryCode}`;
    return $.ajax({
        url: apiUrl,
        method: 'GET',
        format: 'jsonp',
        headers: {
            'x-rapidapi-host': 'restcountries-v1.p.rapidapi.com',
            'x-rapidapi-key': '6f14bd9ffbmsh0b1fd17cc1d70e5p1cbae5jsn22a2ab82fc71'
        }
    });
}

// returns reverse geo location promise (map click)
// Params: @LatLng - string
dataApp.getGeoLocation = function (latlng) {
    return $.ajax({
        url: `https://www.mapquestapi.com/geocoding/v1/reverse?key=ozwRV4KrZgLGMjKBYbnTIZBWQAN4JZBn&location=${latlng}`,
        method: 'GET',
        format: 'json',
        options: {
            thumbMaps: false
        }
    })
}

// Adds white space after every 3rd digit
// Params: @Number
dataApp.formatNumber = (num => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " "));

// Get formatted time string in format (Sat Apr 18 2020, 9:05:03 a.m) from json date
// Params: @Date - json format
dataApp.formatDate = (resultDate) => {
    const date = new Date(resultDate).toLocaleString();  
    const dateSliced = date.slice(0, 10);
    const timeSliced = date.slice(11, date.length);
    const d = new Date(dateSliced).toDateString(); 
    return `${d}, ${timeSliced}`; 
}

// Converts a month as number to the name of month
// Params: @Date
dataApp.convertDatetoMonth = (date) => {
    const month = date.slice(0, 2);
    return dataApp.months[month]
}

// Sort the object by its key in ascending order
// (This method works by converting an object to array and sort and then convert back to the object)
// Params: @Object -  to be sorted
dataApp.sortObjectByKey = (object) => {
    let sorted = {},key, array = [];
    for (key in object) {
        if (object.hasOwnProperty(key)) {
            array.push(key);
        }
    }
    array.sort();
    for (key = 0; key < array.length; key++) {
        sorted[array[key]] = object[array[key]];
    }
    return sorted;
}

// converts country code to flag
// Params: @CountryCode
dataApp.codeToFlag = (countryCode) => {
    return countryCode
        .toUpperCase()
        .replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397));
}

// This method get the country list from the given country list in summary result
// Params: @no-params
dataApp.displayCountryList = () => {
    const selectList = $('#countryList');
    selectList.empty();
    $.when(dataApp.getGlobalData("countries"))
        .then((countries) => {
            countries.sort((a, b) => a.Country > b.Country);

            let alphaCodes = [];
            let countryNames = [];

            for (country in countries) {
                alphaCodes.push(countries[country].ISO2);
                countryNames.push(countries[country].Country);
            }
            alphaCodes.forEach((alphaCode, index) => {
                selectList.append(`<option value=${alphaCode}>${countryNames[index]}</option>`);
            })
            $('option[value="CA"]').attr("selected", "selected");
        })
}

// Display global statistics based on user selection
// Params: @type - totalCases or newCases
dataApp.displayGlobalData = (type) => {
    $.when(dataApp.getGlobalData("summary"))
    .then((result) => {
        const { NewConfirmed, NewDeaths, NewRecovered, TotalConfirmed, TotalDeaths, TotalRecovered } = result.Global;
        let view;
        let confirmed;
        let deaths;
        let recovered;

        if (type === "totalCases") {
            view = 'Total';
            confirmed = TotalConfirmed;
            deaths = TotalDeaths;
            recovered = TotalRecovered;
        } else {
            view = 'New';
            confirmed = NewConfirmed;
            deaths = NewDeaths;
            recovered = NewRecovered;
        }

        $('.viewType').text(view);
        $('.totalConfirmed span').html(`${dataApp.formatNumber(confirmed)}`);
        $('.totalDeaths span').html(`${dataApp.formatNumber(deaths)}`);
        $('.totalRecovered span').html(`${dataApp.formatNumber(recovered)}`);
        $('.timeElapsed').html(dataApp.formatDate(result.Date));
    })
}

// Gets data for top ten country data
// Params: @no-params 
dataApp.displayTopTen = () => {
    $.when(dataApp.getGlobalData("summary"))
    .then((result) => {
        const countries = result.Countries; 
        // sort countries data as per highest confirmed cases
        countries.sort((a, b) => b.TotalConfirmed - a.TotalConfirmed);
        // get top ten out of sorted object
        const topTen = countries.slice(0, 10);

        let confirmed = [];
        let deaths = [];
        let recovered = [];
        let countryNames = [];

        topTen.forEach((country) => {
            countryNames.push(country.Country)
            confirmed.push(country.TotalConfirmed);
            deaths.push(country.TotalDeaths);
            recovered.push(country.TotalRecovered);
        })
        // show top ten on horizontal bar chart
        dataApp.displayChart(countryNames, confirmed, deaths, recovered);
    })
};

// Displays top ten country data to chart
// Params: @CountryNames, @ConfirmedCases, @DeathCases, @RecoveredCases
dataApp.displayChart = (countries, confirmed, deaths, recovered) => {   
    const confirmedPerThousand = confirmed.map(num => num/1000);
    const deathsPerThousand = deaths.map(num => num / 1000);
    const recoveredPerThousand = recovered.map(num => num / 1000);
    // shorten the country Names
    if (countries.includes("United States of America")) {
        const index = countries.indexOf("United States of America");
        countries[index] = "USA";
    }

    if (countries.includes("Iran, Islamic Republic of")) {
        const index = countries.indexOf("Iran, Islamic Republic of");
        countries[index] = "Iran";
    }

    if (countries.includes("United Kingdom")) {
        const index = countries.indexOf("United Kingdom");
        countries[index] = "UK";
    }

    if (countries.includes("Russian Federation")) {
        const index = countries.indexOf("Russian Federation");
        countries[index] = "Russia";
    }

    // get new chart on the html tag #barChart (chart.js)
    new Chart(document.getElementById('barChart'), {
        type: 'horizontalBar',
        data: {
            labels: [...countries],
            datasets: [
                {
                label: 'Confirmed',
                data: [...confirmedPerThousand],
                backgroundColor: dataApp.blue, 
                borderWidth: 0,
            },
            {
                label: 'Deceased',
                data: [...deathsPerThousand],
                backgroundColor: dataApp.red, 
                borderWidth: 0,
            },
            {
                label: 'Recovered',
                data: [...recoveredPerThousand],
                backgroundColor: dataApp.green, 
                borderWidth: 0,
            }
        ],
        },
        options: {
            layout: {
                padding: {
                    left: 30,
                    right: 40,
                    top: 30,
                    bottom: 30
                },
            },
            legend: { 
                display: true,
                position: "bottom",
                labels: {
                    boxWidth: 15,
                },
            },
            aspectRatio: 2,
            maintainAspectRatio: false,
            scales: {
                yAxes: [{
                    barPercentage: 1,
                    ticks: {
                        fontSize: 14,
                    },
                    gridLines: {
                        display: false
                    },
                }],
                xAxes: [{
                    gridLines: {
                        zeroLineColor: "black",
                        zeroLineWidth: 1
                    },
                    scaleLabel: {
                        display: true,
                        labelString: 'Total Confirmed Cases (thousands)'
                    },
                    ticks: {
                        beginAtZero: true,
                        callback: function (value) {
                            return value + '';
                        },
                    },
                }], 
            },
            title: {
                display: true,
                text: ['Top 10 Countries By', 'Most Confirmed Cases'],
                fontSize: 22,
                fontColor: '#333333'
            }
        }
    });
}

// Displays line graph for selected country
// Params: @Dates, @ConfirmedCases, @DeathCases, @RecoveredCases, @CountryName
dataApp.displayLineGraph = (dates, cCases, dCases, rCases, name) => {
    
    // Destroy data for previous selection
    if (dataApp.lineGraph) {
        dataApp.lineGraph.destroy();
    }

    const canvas = document.getElementById("timeGraph");
    const ctx = canvas.getContext('2d');
    
    // get chart to show on the canvas context in 2D
    dataApp.lineGraph = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [...dates], //dates
            datasets: [{
                // confirmed cases
                data: [...cCases], //cases 
                label: 'Confirmed',
                borderColor: dataApp.blue,
                backgroundColor: dataApp.blue,
                pointBackgroundColor: dataApp.blue, 
                pointRadius: 2,
                fill: false
            },
            {
                // deaths
                data: [...dCases], //cases 
                label: 'Deceased',
                borderColor: dataApp.red,
                backgroundColor: dataApp.red, 
                pointBackgroundColor: dataApp.red, 
                pointRadius: 2,
                fill: false
            },
            {
                // recovered
                data: [...rCases], //cases 
                label: 'Recovered',
                borderColor: dataApp.green,
                backgroundColor: dataApp.green, 
                pointBackgroundColor: dataApp.green,
                pointRadius: 2,
                fill: false,
            },
            ],
        },
        options: {
            tooltips: {
                mode: 'line'
            },
            aspectRatio: 1.4,
            maintainAspectRatio: false,
            legend: {
                position: 'bottom',
                labels: {
                    boxWidth: 15,
                },
                tooltips: {
                    mode: 'dataset'
                }
            },
            scales: {
                yAxes: [{
                    ticks: {
                        min: 0
                    },
                    scaleLabel: {
                        display: true,
                        labelString: 'Number of Cases'
                    },
                }],
                xAxes: [{
                    ticks: {
                        display: true,
                        autoSkip: true,
                        maxTicksLimit: 6,
                        maxRotation: 0,
                    },
                    gridLines: {
                        zeroLineColor: "black",
                        zeroLineWidth: 1

                    },
                }],
            },
            layout: {
                padding: {
                    left: 30,
                    right: 30,
                    top: 30,
                    bottom: 30
                },
            },
            title: {
                display: true,
                text: ['Progression of Cases for', name],
                fontSize: 22,
                fontColor: '#333333'
            }
        }
    });
}

// Displays stats for selected country
// Params: @CountryCode, @CountryName
dataApp.displayCountryData = (countryCode, countryName) => {
    $('.countryName span').html(countryName);
    
    const receivedCountryPromise = dataApp.getCountryData(countryCode);
    $.when(receivedCountryPromise)
        .then((caughtCountryData) => {
            const countryData = caughtCountryData[caughtCountryData.length - 1];
            // if country data is returned with positive cases
            if (countryData) {
                const confirmed = dataApp.formatNumber(countryData.Confirmed);
                const deaths = dataApp.formatNumber(countryData.Deaths);
                const recovered = dataApp.formatNumber(countryData.Recovered);
                $('.countryConfirmed span').html(confirmed);
                $('.countryDeaths span').html(deaths);
                $('.countryRecovered span').html(recovered);
            } else {
                $('.countryConfirmed span').html("0");
                $('.countryDeaths span').html("0");
                $('.countryRecovered span').html("0");
            }

            // create arrays to show the progression of cases 
            let cCasesArray = [];
            let dCasesArray = [];
            let rCasesArray = [];
            let countryDatesArray = [];
            for (key in caughtCountryData) {
                const date = caughtCountryData[key].Date.slice(5, 10);
                const formattedMonth = dataApp.convertDatetoMonth(date);
                const formattedDate = `${formattedMonth} ${date.slice(2, 5)}`;
                countryDatesArray.push(formattedDate);
                cCasesArray.push(caughtCountryData[key].Confirmed);
                dCasesArray.push(caughtCountryData[key].Deaths);
                rCasesArray.push(caughtCountryData[key].Recovered);
            }
            // display data on line graph
            dataApp.displayLineGraph(countryDatesArray, cCasesArray, dCasesArray, rCasesArray, countryName)

        }).fail((error) => { // if data is not found for the country from api
            if (error.statusText === "Not Found") {
                $('.countryName span').html(countryName);
                $('.countryConfirmed span').html("0");
                $('.countryDeaths span').html("0");
                $('.countryRecovered span').html("0");
                dataApp.displayLineGraph([],[],[],[], countryName);
            }
        });
}

// Display the location of country on map with the popup showing number of cases
// Params: @Latitude, @Longitude, @CountryName, @ConfirmedCases, @CountryCode
dataApp.displayOnMap = (lat, lng, name, cases, cC) => {
    // remove previously display markers on map
    if (dataApp.map.hasLayer(dataApp.marker))
        dataApp.map.removeLayer(dataApp.marker);

    // if map is rendered then display
    if (dataApp.map) {
        // center map to the lat, lng
        dataApp.map.setView(L.latLng(`${lat}`, `${lng}`));
        const flag = dataApp.codeToFlag(cC);
        const popUp = `<strong>${flag} ${name}</strong> has <strong><br>${cases}</strong> confirmed cases`;
        // marker to show on the lat, lng location
        dataApp.marker = L.marker([`${lat}`, `${lng}`], {
            icon: L.mapquest.icons.marker({
                primaryColor: '#5562b6',
                secondaryColor: '#5562b6',
                shadow: true,
                size: 'sm',
                symbol: ''
            })
        });
        // add marker to the map
        dataApp.map.addLayer(dataApp.marker);
        // show Popup
        dataApp.marker.bindPopup(popUp).openPopup();
    }
}

// Get population, cases and lat, lng for selected country
// Params: @CountryCode
dataApp.displayRestCountriesData = (countryCode) => {
    const receivedRestPromise = dataApp.getRestCountriesData(countryCode);
    const receivedCountryPromise = dataApp.getCountryData(countryCode);
    // get promise from api 
    $.when(receivedRestPromise, receivedCountryPromise)
    .then((caughtRestData, caughtCountryData) => {
        const population = caughtRestData[0].population;
        const lat = caughtRestData[0].latlng[0];
        const lng = caughtRestData[0].latlng[1];
        const name = caughtRestData[0].name;
        $('.countryPopulation span').html(dataApp.formatNumber(population));
        // it the selected country has any confirmed cases
        if (caughtCountryData[0].length > 0) {
            const countryData = caughtCountryData[0][caughtCountryData[0].length - 1];
            const cases = countryData.Confirmed;
            dataApp.displayOnMap(lat, lng, name, cases, countryCode);
        } else // if selected country has 0 confirmed cases
            dataApp.displayOnMap(lat, lng, name, "0", countryCode);
    });
}

// when user click on the map
// Params: @ClickEvent
dataApp.handleMapClick = (e) => {
    // get the geocode location from the click event
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    const latlng = lat + "," + lng;
    const receivedGeoLocationPromise = dataApp.getGeoLocation(latlng);
    // when promise is returned from reverse geoLocation api
    $.when(receivedGeoLocationPromise)
    .then((caughtGeoLocationData) => {
        let locationsLength = caughtGeoLocationData.results[0].locations.length;
        // if the location is from the map in given bounds
        if (locationsLength) {
            // get country code with reverse geoLocation
            const countryCode = caughtGeoLocationData.results[0].locations[0].adminArea1;
            const countryName = caughtGeoLocationData.results[0].locations[0].adminArea1;
            // XZ, exclude international waters
            if (countryCode !== 'XZ') {
                // for the given country, get the confirmed cases from Covid-19
                const receivedCountryPromise = dataApp.getCountryData(countryCode);
                $.when(receivedCountryPromise)
                .then((caughtCountryData) => {
                    const countryData = caughtCountryData[caughtCountryData.length - 1];
                    // if given country has any number of confirmed cases
                    if (countryData) {
                        const name = countryData.Country;
                        const cases = countryData.Confirmed;
                        dataApp.displayOnMap(lat, lng, name, cases, countryCode);
                    } else { // if given country has 0 confirmed cases
                        dataApp.displayOnMap(lat, lng, countryName, "0", countryCode);
                    }
                })  
            }
        }
    });
}

// get the map from the mapQuest api
// Params: @Latitude, @Longitude
dataApp.getMap = (lat, lng) => {
    // api key for map
    const apiKEY = 'ozwRV4KrZgLGMjKBYbnTIZBWQAN4JZBn';
    L.mapquest.key = apiKEY;
    let baseLayer = L.mapquest.tileLayer('map');
    // get map from mapQuest and center it on given lat, lng
    // 'map' is the id of the div to display map in html
    dataApp.map =
        L.mapquest.map('map', {
            center: [`${lat}`, `${lng}`],
            layers: baseLayer,
            zoom: 2,
            maxZoom:10,
            minZoom:2,
            zoomControl: true,
            scrollWheelZoom: false
    });
    //  control to show the map in light and dark modes
    L.control.layers({
        'Map': baseLayer,
        'Light': L.mapquest.tileLayer('light'),
        'Dark': L.mapquest.tileLayer('dark')
    }).addTo(dataApp.map);

    $.when(dataApp.getGlobalData("summary"))
    .then((result)=>{
        // get the result from Covid-19 with cases in an object in ascending order
        const sortedCountriesObject = dataApp.getJsonObject(result);
        // set a delay in binding the incoming result to the map
        setTimeout(function(){
            dataApp.bindCasesToMap(sortedCountriesObject);
        }, 
        1000);
    })
}

// get the object in json format from the incoming result
// Params: @Result-result from Covid-19 summary end point
dataApp.getJsonObject = (result)=>{
    let object = '{';
    for (country in result.Countries) {
        const cC = result.Countries[country].CountryCode;
        const confirmed = result.Countries[country].TotalConfirmed;
        object = object + `"${cC}" :{ "Confirmed":${confirmed}},`
    }
    object = object.slice(0, -1);
    object = object + "}";
    const jsonObject = JSON.parse(object);
    // sort the object in ascending order for key
    dataApp.casesByCCode = dataApp.sortObjectByKey(jsonObject);
    // return the sorted object
    return dataApp.sortObjectByKey(countriesObject);
}

// bind the incoming cases result to the map
// Params: @Sorted countries object containing country cases
dataApp.bindCasesToMap = (sortedCountriesObject)=>{
    for (country in sortedCountriesObject) {
        // if the country data is returned from result in object
        if (dataApp.casesByCCode.hasOwnProperty(country)) {
            const lat = sortedCountriesObject[country].Lat + "";
            const lng = sortedCountriesObject[country].Lng + "";
            const name = sortedCountriesObject[country].Name + "";
            const cases = dataApp.casesByCCode[country].Confirmed + "";
            const flag = dataApp.codeToFlag(country);
            // add the area to the map if it has a location and has positive cases
            if (lng !== 'undefined' && cases !== "0") {
                L.circle(
                    [lat, lng],
                    {
                        radius: `${cases}`,
                    })
                    .bindPopup(`${flag} <strong>${name}</strong> has<br><strong>${cases}</strong> confirmed cases`).addTo(dataApp.map)
            }
        }
    }
}

// Mobile nav menu
dataApp.toggleMenu = () => {
    $('nav ul').toggleClass('showMenu'); // show/hide menu 
    $('body').toggleClass("positionFixed"); // Prevents scrolling when side bar is open
    $('button i').toggleClass("fa-times");
    //On clicking outside the mobile nav
    $('body').on('click', function (e) {
        //Hide nav if click event on nav menu not registered
        if (e.target.closest('nav') === null) {
            $('nav ul').removeClass('showMenu');
            $('body').removeClass("positionFixed"); 
            $('button i').removeClass("fa-times");
        }
    });
}

// Initialization
dataApp.init = () => {
    // On page load: 
    dataApp.displayCountryList();
    dataApp.displayGlobalData("totalCases");
    dataApp.displayTopTen(); // Displays bar chart
    dataApp.displayCountryData("CA", "Canada");
    dataApp.displayRestCountriesData("CA");
    // get map to center on Canada (default)
    dataApp.getMap(60, -95); 

    // add change event to drop down selection
    $('select#countryList').on('change', function () {
        const countryName = $("#countryList option:selected").text();
        const countryCode = $("#countryList option:selected").val();

        dataApp.displayCountryData(countryCode, countryName);
        dataApp.displayRestCountriesData(countryCode);
    });

    // On clicking Total Cases and New Cases buttons:
    $('.toggleButtons button').on('click', function (e) {
        $('.toggleButtons button').removeClass('active');
        const casesType = e.target.id;
        $(`#${casesType}`).addClass('active');
        dataApp.displayGlobalData(casesType);
    });
    // attach click event to the map
    dataApp.map.on('click', dataApp.handleMapClick);

    // toggle mobile nav menu
    $('nav button').on('click', dataApp.toggleMenu);
    $('nav li').on('click', dataApp.toggleMenu); 
}

// DOCUMENT READY
$(() => {
    dataApp.init();
})