const dataApp = {} //namespace object

// property store the map
dataApp.map = '';
dataApp.marker = '';
dataApp.lineGraph = null;
// dataApp.casesByCCode = {};
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

Chart.defaults.global.defaultFontFamily = "'Source Sans Pro', 'Arial', sans-serif";
Chart.defaults.global.defaultFontSize = 14;

// AJAX CALLS - PROMISE OBJECTS
// return global data promise
dataApp.getGlobalData = (endPoint) => {
    return $.ajax({
        url: `https://api.covid19api.com/${endPoint}`,
        method: 'GET',
        format: 'jsonp'
    })
}
// returns the country data promise
dataApp.getCountryData = function (countryCode) {
    return $.ajax({
        url: `https://api.covid19api.com/total/country/${countryCode}`,
        method: 'GET',
        format: 'jsonp'
    });
}
// returns rest countries data promise
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
// returns geo location promise
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

// Adds white space after every 3rd digit
dataApp.formatNumber = (num => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " "));

//Get formatted time string
dataApp.formatDate = (resultDate) => {
    
    const date = new Date(resultDate).toLocaleString();  
    const dateSliced = date.slice(0, 10);
    const timeSliced = date.slice(11, date.length);
    const d = new Date(dateSliced).toDateString(); 
    return `${d}, ${timeSliced}`; 
}

// Display global statistics based on user selection
dataApp.displayGlobalData = (type) => {
    dataApp.getGlobalData("summary")
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

dataApp.displayTopTen = () => {
    dataApp.getGlobalData("summary")
        .then((result) => {
            const countries = result.Countries; 

            countries.sort((a, b) => b.TotalConfirmed - a.TotalConfirmed);
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

            dataApp.displayChart(countryNames, confirmed, deaths, recovered);
        })
};

dataApp.displayChart = (countries, confirmed, deaths, recovered) => {   
    const confirmedPerThousand = confirmed.map(num => num/1000);
    const deathsPerThousand = deaths.map(num => num / 1000);
    const recoveredPerThousand = recovered.map(num => num / 1000);

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

    new Chart(document.getElementById('barChart'), {
        type: 'horizontalBar',
        data: {
            labels: [...countries],
            datasets: [
                {
                label: '# of Confirmed Cases',
                data: [...confirmedPerThousand],
                backgroundColor: '#5fb6d3',
                borderColor: 'rgba(255,111,22,0.6)',
                borderWidth: 0,
            },
            {
                label: '# of Confirmed Cases',
                data: [...deathsPerThousand],
                backgroundColor: '#ea5b25',
                borderColor: 'rgba(255,111,22,0.6)',
                borderWidth: 0,
            },
            {
                label: '# of Confirmed Cases',
                data: [...recoveredPerThousand],
                backgroundColor: '#a9aa00',
                borderColor: 'rgba(255,111,22,0.6)',
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
            legend: { display: false },
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
                            return value + 'K';
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

dataApp.displayLineGraph = (dates, cCases, dCases, rCases, name) => {

    if (dataApp.lineGraph) {
        dataApp.lineGraph.destroy();
    }

    const canvas = document.getElementById("timeGraph");
    const ctx = canvas.getContext('2d');
    dataApp.lineGraph = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [...dates], //dates
            datasets: [{
                // confirmed cases
                data: [...cCases], //cases 
                label: 'Confirmed',
                borderColor: "#5fb6d3",
                backgroundColor: "#5fb6d3",
                pointBackgroundColor: "#5fb6d3", 
                pointRadius: 2,
                fill: false
            },
            {
                // deaths
                data: [...dCases], //cases 
                label: 'Deaths',
                borderColor: "#ea5b25",
                backgroundColor: "#ea5b25", 
                pointBackgroundColor: "#ea5b25", 
                pointRadius: 2,
                fill: false
            },
            {
                // recovered
                data: [...rCases], //cases 
                label: 'Recovered',
                borderColor: "#a9aa00",
                backgroundColor: "#a9aa00", 
                pointBackgroundColor: "#a9aa00",
                pointRadius: 2,
                fill: false
            },
            ],
        },
        options: {
            aspectRatio: 1.4,
            maintainAspectRatio: false,
            legend: {
                labels: {
                    boxWidth: 30,
                },
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
                        maxTicksLimit: 6
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

dataApp.displayCountryData = (countryCode, countryName) => {
    const receivedCountryPromise = dataApp.getCountryData(countryCode);
    $('.countryName span').html(countryName);

    $.when(receivedCountryPromise)
        .then((caughtCountryData) => {
            const countryData = caughtCountryData[caughtCountryData.length - 1];


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

            dataApp.displayLineGraph(countryDatesArray, cCasesArray, dCasesArray, rCasesArray, countryName)

        }).fail((error) => {
            if (error.statusText === "Not Found") {
                $('.countryName span').html(countryName);
                $('.countryConfirmed span').html("0");
                $('.countryDeaths span').html("0");
                $('.countryRecovered span').html("0");
                dataApp.displayLineGraph([], [], countryName);
            }
        });
}

dataApp.convertDatetoMonth = (date) => {
    const month = date.slice(0, 2);
    return dataApp.months[month]
}

dataApp.displayOnMap = (lat, lng, name, cases, cC) => {
    if (dataApp.map.hasLayer(dataApp.marker))
        dataApp.map.removeLayer(dataApp.marker);

    if (dataApp.map) {
        const flag = dataApp.codeToFlag(cC);
        dataApp.map.setView(L.latLng(`${lat}`, `${lng}`));
        let popUp = `<strong>${flag} ${name}</strong> has <strong><br>${cases}</strong> confirmed cases`;

        dataApp.marker = L.marker([`${lat}`, `${lng}`], {
            icon: L.mapquest.icons.marker({
                primaryColor: '#5562b6',
                secondaryColor: '#5562b6',
                shadow: true,
                size: 'sm',
                symbol: ''
            })
        });

        dataApp.map.addLayer(dataApp.marker);
        dataApp.marker.bindPopup(popUp)
            .openPopup();
    }
}

dataApp.displayRestCountriesData = (countryCode) => {

    const receivedRestPromise = dataApp.getRestCountriesData(countryCode);
    const receivedCountryPromise = dataApp.getCountryData(countryCode);

    $.when(receivedRestPromise, receivedCountryPromise)
        .then((caughtRestData, caughtCountryData) => {
            const population = caughtRestData[0].population;
            const lat = caughtRestData[0].latlng[0];
            const lng = caughtRestData[0].latlng[1];
            const name = caughtRestData[0].name;
            $('.countryPopulation span').html(dataApp.formatNumber(population));

            if (caughtCountryData[0].length > 0) {
                const countryData = caughtCountryData[0][caughtCountryData[0].length - 1];
                const cases = countryData.Confirmed;
                dataApp.displayOnMap(lat, lng, name, cases, countryCode);
            } else
                dataApp.displayOnMap(lat, lng, name, "0", countryCode);
        });
}

dataApp.handleMapClick = (e) => {
    // get the geocode location 
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    const latlng = lat + "," + lng;
    const receivedGeoLocationPromise = dataApp.getGeoLocation(latlng);

    $.when(receivedGeoLocationPromise)
        .then((caughtGeoLocationData) => {
            let locationsLength = caughtGeoLocationData.results[0].locations.length;

            if (locationsLength) {
                const countryCode = caughtGeoLocationData.results[0].locations[0].adminArea1;
                const countryName = caughtGeoLocationData.results[0].locations[0].adminArea1;

                // XZ, exclude international waters
                if (countryCode !== 'XZ') {
                    const receivedCountryPromise = dataApp.getCountryData(countryCode);

                    $.when(receivedCountryPromise)
                        .then((caughtCountryData) => {
                            const countryData = caughtCountryData[caughtCountryData.length - 1];

                            if (countryData) {
                                const name = countryData.Country;
                                const cases = countryData.Confirmed;
                                dataApp.displayOnMap(lat, lng, name, cases, countryCode);
                            } else {
                                dataApp.displayOnMap(lat, lng, countryName, "0", countryCode);
                            }
                        })
                }
            }
        });
}

dataApp.getMap = (lat, lng) => {
    const apiKEY = 'ozwRV4KrZgLGMjKBYbnTIZBWQAN4JZBn';
    L.mapquest.key = apiKEY;
    let baseLayer = L.mapquest.tileLayer('map');
    dataApp.map =
        L.mapquest.map('map', {
            center: [`${lat}`, `${lng}`],
            layers: baseLayer,
            zoom: 4,
            maxZoom:8,
            minZoom:3,
            zoomControl: true,
            scrollWheelZoom: false
    }).on('click', dataApp.handleMapClick);
    L.control.layers({
        'Map': baseLayer,
        'Light': L.mapquest.tileLayer('light'),
        'Dark': L.mapquest.tileLayer('dark')
    }).addTo(dataApp.map);
    dataApp.map.addControl(L.mapquest.geocodingControl({
        position: 'topright',
        placeMarker:false
    }));
    
    $.when(dataApp.getGlobalData("summary"))
    .then((result)=>{

        let object = '{';
        for (country in result.Countries) {
            // const co = result.Countries[country].Country;
            const cC = result.Countries[country].CountryCode;
            const confirmed = result.Countries[country].TotalConfirmed;
            object = object + `"${cC}" :{ "Confirmed":${confirmed}},`
        }
        object = object.slice(0, -1);
        object = object + "}";
        const jsonObject = JSON.parse(object);
        dataApp.casesByCCode = dataApp.sortObjectByKey(jsonObject);
        const sortedCountriesObject = dataApp.sortObjectByKey(countriesObject);

        setTimeout(function(){
        for (country in sortedCountriesObject) {
            // CN country is not appearing in the results
            if(country !== "CN"){
            const lat = sortedCountriesObject[country].Lat + "";
            const lng = sortedCountriesObject[country].Lng + "";
            const name = sortedCountriesObject[country].Name + "";
            const cases = dataApp.casesByCCode[country].Confirmed + "";
            if (lng !== 'undefined') {
                L.circle(
                    [lat, lng],
                    {
                        radius: 100,
                    })
                    .bindPopup(`<strong>${name}</strong> has reported <strong>${cases}</strong> confirmed cases`).addTo(dataApp.map);
                }
            }
        }
        }, 1000);
    })
}

// converts country code to flag
dataApp.codeToFlag = (countryCode) => {
    return countryCode
        .toUpperCase()
        .replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397));
}

// Initialization
dataApp.init = () => {
    dataApp.displayCountryList();
    dataApp.displayGlobalData("totalCases");
    dataApp.displayTopTen();
    dataApp.displayCountryData("CA", "Canada");
    dataApp.displayRestCountriesData("CA");
    dataApp.getMap(60, -95);// pass the coordinates to center map on Canada

    $('select#countryList').on('change', function () {
        const countryName = $("#countryList option:selected").text();
        const countryCode = $("#countryList option:selected").val();

        dataApp.displayCountryData(countryCode, countryName);
        dataApp.displayRestCountriesData(countryCode);
    });

    $('form[name="globalForm"]').on('change', function (e) {
        const casesType = e.target.value;
        dataApp.displayGlobalData(casesType);
    });
}

// Document Ready
$(() => {
    dataApp.init();
})