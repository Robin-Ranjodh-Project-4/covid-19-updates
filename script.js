const dataApp = {} //namespace object

// property store the map
dataApp.map = '';
dataApp.marker = '';
dataApp.lineGraph = null;

// AJAX CALLS - PROMISE OBJECTS
// return global data promise
dataApp.getGlobalData = (endPoint) => { 
    return $.ajax({
        url: `https://api.covid19api.com/${endPoint}`,
        method:'GET',
        format:'jsonp' 
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

dataApp.displayCountryList = ()=>{
    const selectList = $('#countryList');
    selectList.empty();
    $.when(dataApp.getGlobalData('countries'))
    .then((caughtCountryList)=>{
        caughtCountryList.sort(function (a, b) {
            return a.Country > b.Country;
        });
        let iso2 = [];
        let names = [];
        for(country in caughtCountryList){
            iso2.push(caughtCountryList[country].ISO2);
            names.push(caughtCountryList[country].Country);
        }
        iso2.forEach((code,index)=>{
            const html = `<option value=${code}>${names[index]}</option>`;
            selectList.append(html);
        });
    })
}

// returns the country data promise
dataApp.getCountryData = (countryCode) => {
    return $.ajax({
        url: `https://api.covid19api.com/total/country/${countryCode}`,
        method: 'GET',
        format: 'jsonp'
    });
}

// returns rest countries data promise
dataApp.getRestCountriesData = (countryCode) => {
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
dataApp.getGeoLocation = (latlng) => {
    return $.ajax({
        url: `https://www.mapquestapi.com/geocoding/v1/reverse?key=ozwRV4KrZgLGMjKBYbnTIZBWQAN4JZBn&location=${latlng}`,
        method: 'GET',
        format: 'json'
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

// Display global statistics based on user selection
dataApp.displayGlobalData = (type) => {
    dataApp.getGlobalData("summary")
    .then((result) => {
        const {NewConfirmed,NewDeaths,NewRecovered,TotalConfirmed,TotalDeaths, TotalRecovered} = result.Global;
        if (type === "totalCases") {
            $('.viewType').text("Total")
            $('.totalConfirmed span').html(`${TotalConfirmed}`);
            $('.totalRecovered span').html(`${TotalRecovered}`);
            $('.totalDeaths span').html(`${TotalDeaths}`); 
        } else {
            $('.viewType').text("New")
            $('.totalConfirmed span').html(`${NewConfirmed}`);
            $('.totalRecovered span').html(`${NewRecovered}`);
            $('.totalDeaths span').html(`${NewDeaths}`); 
        }
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
    
    Chart.defaults.global.defaultFontFamily = "'Source Sans Pro', 'Arial', sans-serif";
    Chart.defaults.global.defaultFontSize = 14;
    new Chart(document.getElementById('barChart'), {
        type: 'bar',
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
                borderWidth: 0
            }],
        },
        options: { 
            layout: {
                padding: {
                    left: 20,
                    right: 20,
                    top: 20,
                    bottom: 20
                },
            },
            legend: { display: false },
            aspectRatio: 2,
            maintainAspectRatio: false,
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            },
            title: {
                display: true,
                text: 'Total Confirmed Cases by Country (per thousand)',
                fontSize: 20,
            }
        }
    });
}

dataApp.displayLineGraph = (dates, cases, name) => {    

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
                data: [...cases], //cases 
                label: name,
                borderColor: "#3e95cd",
                fill: false
            }, 
            ]
        },
        options: {
            layout: {
                padding: {
                    left: 20,
                    right: 20,
                    top: 20,
                    bottom: 20
                },
            },
            title: {
                display: true,
                text: 'Progression of Cases'
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
            $('.countryConfirmed span').html(countryData.Confirmed);
            $('.countryRecovered span').html(countryData.Recovered);
        } else {
            $('.countryConfirmed span').html("0");
            $('.countryRecovered span').html("0");
        }

        let countryCasesArray = [];
        let countryDatesArray = [];
        
        for (key in caughtCountryData) {
            countryCasesArray.push(caughtCountryData[key].Confirmed);
            countryDatesArray.push(caughtCountryData[key].Date.slice(0, 10));
        } 
        
        dataApp.displayLineGraph(countryDatesArray, countryCasesArray, countryName)  
    }).fail((error)=>{
        if(error.statusText === "Not Found"){
            $('.countryName span').html(countryName);
            $('.countryConfirmed span').html("0");
            $('.countryRecovered span').html("0");
            dataApp.displayLineGraph([],[],countryName);
        }
    });
}

dataApp.displayOnMap = (lat, lng, name, cases, cC) => {
    if(dataApp.map.hasLayer(dataApp.marker)) 
    dataApp.map.removeLayer(dataApp.marker);
    
    if (dataApp.map) {
        const flag = dataApp.codeToFlag(cC);
        dataApp.map.setView(L.latLng(`${lat}`, `${lng}`));
        let popUp = `<strong>${flag} ${name}</strong> has <strong><br>${cases}</strong> confirmed cases`;

        dataApp.marker = L.marker([`${lat}`, `${lng}`], {
            icon: L.mapquest.icons.marker({
                primaryColor: '#ff1111',
                secondaryColor: '#111111',
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

    $.when(receivedRestPromise,receivedCountryPromise)
    .then((caughtRestData, caughtCountryData ) => {
        const population = caughtRestData[0].population;
        const lat = caughtRestData[0].latlng[0];
        const lng = caughtRestData[0].latlng[1];
        const name = caughtRestData[0].name;
        $('.countryPopulation span').html(population);
        
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
                    } else{
                        dataApp.displayOnMap(lat,lng, countryName, "0", countryCode);
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
            center: [`${lat}`,`${lng}`],
            layers: L.mapquest.tileLayer('map'),
            zoom: 4,
            maxZoom:8,
            minZoom:3,
            zoomControl: false
    }).on('click', dataApp.handleMapClick);
}

// converts country code to flag
dataApp.codeToFlag = (countryCode) => {
    return countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0)+127397));
}

dataApp.displayLineGraph = (dates, cases, name)=>{


    if (dataApp.lineGraph){
        dataApp.lineGraph.destroy();
    }

    const canvas = document.getElementById("timeGraph");
    const ctx = canvas.getContext('2d');
    dataApp.lineGraph = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [...dates],
            datasets: [{
                data: [...cases],
                label: name,
                borderColor: "#3e95cd",
                fill: false,
            }]
        },
        options: {
            title: {
                display: true,
                text: 'Progression of COVID-19 cases'
            }
        }
    });
}

// Initialization
dataApp.init = () => {
    dataApp.displayCountryList();
    dataApp.displayGlobalData("totalCases");
    dataApp.displayTopTen();
    dataApp.displayCountryData("CA", "Canada");
    dataApp.displayRestCountriesData("CA");
    dataApp.getMap(60,-95);// pass the coordinates to center map on Canada

    $('select#countryList').on('change', function() {
        const countryName = $("#countryList option:selected").text();
        const countryCode = $("#countryList option:selected").val();

        dataApp.displayCountryData(countryCode, countryName);
        dataApp.displayRestCountriesData(countryCode);
    });

    $('form[name="globalForm"]').on('change', function(e){
        const casesType = e.target.value 
        dataApp.displayGlobalData(casesType);
    });
} 

// Document Ready
$(() => {
    dataApp.init();
})