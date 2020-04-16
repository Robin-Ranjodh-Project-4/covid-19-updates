const dataApp = {} //namespace object
// property store the map
dataApp.map = '';
dataApp.marker = '';
dataApp.getGlobalData = function(endPoint){ 
    return $.ajax({
        url: `https://api.covid19api.com/${endPoint}`,
        method:'GET',
        format:'jsonp' 
    }) 
}

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
        const countries = result.Countries
        let countryData = {}

        countries.forEach((index) => {
            countryData[index.Country] = index.TotalConfirmed;
        })
        
        const countriesSorted = dataApp.sortCountries(countryData);
        const newArray = Object.values(countriesSorted)
        const topTenResults = newArray.slice(0, 10); 
        
        const countryNames = topTenResults.map(num => num[0]);
        const countryCases = topTenResults.map(num => num[1]); 
        dataApp.displayChart(countryNames, countryCases);
    })
};

dataApp.displayChart = (countries,cases) => { 
    let ctx = document.getElementById('barChart').getContext('2d');
    let myChart = new Chart(ctx, {
        type: 'horizontalBar',
        data: {
            labels: [...countries],
            datasets: [{
                label: '# of Confirmed Cases',
                data: [...cases],
                backgroundColor: '#3498db',
                borderColor: 'rgba(255,111,22,0.6)',
                borderWidth: 0 
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });
}

dataApp.getUserSelection = (e) => {
    const countryCode = $("#countryList option:selected").val();
    dataApp.displayCountryData(countryCode);
    dataApp.displayRestCountriesData(countryCode);
}

dataApp.getCountryData = function(countryCode) {
    return $.ajax({
        url: `https://api.covid19api.com/total/country/${countryCode}`,
        method:'GET',
        format:'jsonp'
    });
}

dataApp.displayCountryData = function(countryCode){
    const receivedCountryPromise = dataApp.getCountryData(countryCode);
    $.when(receivedCountryPromise)
    .then((caughtCountryData) => { 
        let countryData = caughtCountryData[caughtCountryData.length - 1];
        const countryName = $("#countryList option:selected").html();
        $('.countryName span').html(countryName);
        if(countryData){
            $('.countryConfirmed span').html(countryData.Confirmed);
            $('.countryRecovered span').html(countryData.Recovered);
        }else{
            $('.countryConfirmed span').html("0");
            $('.countryRecovered span').html("0");
        }
    });
}


dataApp.displayOnMap = (lat, lng, name, cases) => {
    
    if(dataApp.map.hasLayer(dataApp.marker))
        dataApp.map.removeLayer(dataApp.marker);
    if (dataApp.map) {
        dataApp.map.setView(L.latLng(`${lat}`, `${lng}`));
        let popUp = `<strong>${name}</strong> has <strong><br>${cases}</strong> confirmed cases`;
        dataApp.marker = L.marker([`${lat}`, `${lng}`], {
            icon: L.mapquest.icons.marker({
                primaryColor: '#ff1111',
                secondaryColor: '#111111',
                shadow: true,
                size: 'sm',
                symbol: ''
            })
        });
        // marker.addTo(dataApp.map)
        dataApp.map.addLayer(dataApp.marker);
        dataApp.marker.bindPopup(popUp)
        .openPopup();
        // console.log(dataApp.map.hasLayer(marker));
    } else {
        console.log("Map not found");
    }
}

dataApp.getRestCountriesData = function(countryCode){
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
        if(caughtCountryData[0].length > 0){
            const countryData = caughtCountryData[0][caughtCountryData[0].length - 1];
            const cases = countryData.Confirmed;
            dataApp.displayOnMap(lat, lng, name, cases);
        }else
            dataApp.displayOnMap(lat,lng,name,"0");
    });
}
dataApp.getGeoLocation = function(latlng){
    return $.ajax({
        url: `http://www.mapquestapi.com/geocoding/v1/reverse?key=ozwRV4KrZgLGMjKBYbnTIZBWQAN4JZBn&location=${latlng}`,
        method: 'GET'
    })
}
dataApp.handleMapClick = function(e){
    // get the geocode location 
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    const latlng = lat + "," + lng;
    const receivedGeoLocationPromise = dataApp.getGeoLocation(latlng);
    $.when(receivedGeoLocationPromise)
    .then((caughtGeoLocationData) => {
        let locationsLength = caughtGeoLocationData.results[0].locations.length;
        if (locationsLength){
            const countryCode = caughtGeoLocationData.results[0].locations[0].adminArea1;
            // XZ, exclude international waters
            if (countryCode !== 'XZ'){
                const receivedCountryPromise = dataApp.getCountryData(countryCode);
                $.when(receivedCountryPromise)
                .then((caughtCountryData) => {
                    const countryData = caughtCountryData[caughtCountryData.length - 1];
                    if (countryData) {
                        const name = countryData.Country;
                        const cases = countryData.Confirmed;
                        dataApp.displayOnMap(lat, lng, name, cases);
                    }else{
                        dataApp.displayOnMap(lat,lng, name, "0");
                    }
                })
            }
        }
    });
}

dataApp.getMap = function(lat,lng){
    const apiKEY = 'ozwRV4KrZgLGMjKBYbnTIZBWQAN4JZBn';
    L.mapquest.key = apiKEY;
    dataApp.map =  
    L.mapquest.map('map', {
            center: [`${lat}`,`${lng}`],
            layers: L.mapquest.tileLayer('map'),
            zoom: 4,
            maxZoom:8,
            minZoom:3
    }).on('click', dataApp.handleMapClick);
}

// Initialization
dataApp.init = () =>{
    dataApp.displayGlobalData("totalCases");
    dataApp.displayTopTen();
    dataApp.displayCountryData("CA");
    dataApp.displayRestCountriesData("CA");
    dataApp.getMap(60,-95);// pass the coordinates to center map on Canada
    // Write a function to get the map icon for the country (pending)
    $('select#countryList').on('change', dataApp.getUserSelection);
    $('form[name="globalForm"]').on('change', function(e){
        const casesType = e.target.value
        dataApp.displayGlobalData(casesType);
    });
} 
// Document Ready
$(() => {
    dataApp.init();
})