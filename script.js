const dataApp = {} //namespace object
// property store the map
dataApp.map = '';
dataApp.available = false;
 
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
    const countryCode = e.target.value;
    dataApp.getCountryData(countryCode);
    dataApp.getPopulationData(countryCode);
}

dataApp.getCountryData = (countryCode) => {
    const apiUrl = `https://api.covid19api.com/total/country/${countryCode}`;
    $.ajax({
        url:apiUrl,
        method:'GET',
        format:'jsonp',
        async:false
    })
    .then((result) => { 
        let countryData = result[result.length - 1];

        if(countryData){
            dataApp.available = true;
            $('.countryName span').html(countryData.Country);
            $('.countryConfirmed span').html(countryData.Confirmed);
            $('.countryRecovered span').html(countryData.Recovered);
        }else{
            dataApp.available = false
            $('.countryName span').html("No Data");
            $('.countryConfirmed span').html("No Data");
            $('.countryRecovered span').html("No Data");
        }
    });
}

dataApp.displayOnMap = (lat, lng, name) => {
    const cases = $('.countryConfirmed span').text();
    if (dataApp.map) {
        dataApp.map.setView(L.latLng(`${lat}`, `${lng}`));
        let popUp = 'Data Not Available';
        if (dataApp.available) {
            popUp = `<strong>${name}</strong> has <strong><br>${cases}</strong> confirmed cases`;
        }

        L.marker([`${lat}`, `${lng}`])
            .addTo(dataApp.map)
            .bindPopup(popUp)
            .openPopup()
    } else {
        console.log("Map not found");
    }
}

dataApp.getPopulationData = (countryCode) => {
    const apiUrl = `https://restcountries-v1.p.rapidapi.com/alpha/${countryCode}`;

    $.ajax({
        url:apiUrl,
        method:'GET',
        format:'jsonp',
        headers: {
            'x-rapidapi-host': 'restcountries-v1.p.rapidapi.com',
            'x-rapidapi-key': '6f14bd9ffbmsh0b1fd17cc1d70e5p1cbae5jsn22a2ab82fc71'
        }
    })
    .then((result) => {
        $('.countryPopulation span').html(result.population);
        const lat = result.latlng[0];
        const lng = result.latlng[1];
        const name = result.name;

        dataApp.displayOnMap(lat, lng, name);
    });
}

dataApp.getMap = function(lat,lng){
    L.mapquest.key = 'ozwRV4KrZgLGMjKBYbnTIZBWQAN4JZBn';
    dataApp.map =  L.mapquest.map('map', {
            center: [`${lat}`,`${lng}`],
            layers: L.mapquest.tileLayer('map'),
            zoom: 4
        });
}

// Initialization
dataApp.init = () =>{
    dataApp.displayGlobalData("totalCases");
    dataApp.displayTopTen();
    dataApp.getCountryData("CA");
    dataApp.getPopulationData("CA");
    // Write a function to get the map icon for the country
    dataApp.getMap(60,-95);// pass the coordinates of Canada
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