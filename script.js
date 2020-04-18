const dataApp = {} //namespace object

// property store the map
dataApp.map = '';
dataApp.marker = '';
dataApp.lineGraph = null;

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

            $('.viewType').text(view)
            $('.totalConfirmed span').html(`${dataApp.formatNumber(confirmed)}`);
            $('.totalDeaths span').html(`${dataApp.formatNumber(deaths)}`);
            $('.totalRecovered span').html(`${dataApp.formatNumber(recovered)}`);
            $('.timeElapsed').html(result.Date);
        })
}

dataApp.sortCountries = (object) => {
    const countriesSorted = Object.entries(object).sort(function (a, b) {
        const aNum = a[1];
        const bNum = b[1];
        return bNum - aNum;
    });

    return countriesSorted;
}

dataApp.displayTopTen = () => {
    dataApp.getGlobalData("summary")
        .then((result) => {
            const countries = result.Countries;
            let countryData = {}

            countries.forEach((index) => {
                countryData[index.Country] = index.TotalConfirmed;
            })

            const countriesSorted = dataApp.sortCountries(countryData);
            const newArray = Object.values(countriesSorted);
            const topTenResults = newArray.slice(0, 10);

            const countryNames = topTenResults.map(num => num[0]);
            const countryCases = topTenResults.map(num => num[1]);
            dataApp.displayChart(countryNames, countryCases);
        })
};

dataApp.displayChart = (countries, cases) => {  
    const casesPerThousand = cases.map(num => num/1000);

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
            datasets: [{
                label: '# of Confirmed Cases',
                data: [...casesPerThousand],
                backgroundColor: function (context) {
                    const index = context.dataIndex;
                    return index % 2 ? '#5fb6d3' : '#5562b6';
                },
                borderColor: 'rgba(255,111,22,0.6)',
                borderWidth: 0,
            }],
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
                    barPercentage: 0.7,
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
                        labelString: 'Total Confirmed Cases (per thousand)'
                    },
                    ticks: {
                        beginAtZero: true,
                        callback: function (value) {
                            return value + 'K';
                        },
                    },
                }],
                scaleLabel: {
                    labelString: 'Total Confirmed Cases by Country (per thousand)',
                },
            },
            title: {
                display: true,
                text: ['Top 10 Countries With', 'Most Confirmed Cases'],
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
                text: `Progression of Cases for ${name}`,
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
    dataApp.map =
        L.mapquest.map('map', {
            center: [`${lat}`, `${lng}`],
            layers: L.mapquest.tileLayer('map'),
            zoom: 4,
            maxZoom:8,
            minZoom:3,
            zoomControl: true,
            scrollWheelZoom: false
    }).on('click', dataApp.handleMapClick);
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
        const casesType = e.target.value
        dataApp.displayGlobalData(casesType);
    });
}

// Document Ready
$(() => {
    dataApp.init();
})