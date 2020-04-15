const dataApp = {} //namespace object
// property store the map
dataApp.map = '';
dataApp.available = false;

dataApp.getGlobalData = () => {
    $.ajax({
        url: 'https://api.covid19api.com/summary',
        method:'GET',
        format:'jsonp',
        success:function(result){
        },
        error:function(error){
        }
    }).then(function(result){
        dataApp.displayGlobalData(result);
        dataApp.displayTopTen(result);
    });
} 
dataApp.displayTopTen = (result) => {
    const countries = result.Countries
    let newObject = {}
    countries.forEach((index) => {
        newObject[index.Country] = index.TotalConfirmed;
    })
    
    const countriesSorted = Object.entries(newObject).sort(function (a, b) {
        const aNum = a[1];
        const bNum = b[1];
        return bNum - aNum;
    });
    
    const newArray = Object.values(countriesSorted)
    const topTenResults = newArray.slice(0, 10); 
    
    
    const countryNames = topTenResults.map((num) => {
        return num[0];
    });
    const countryNumbers = topTenResults.map((num) => {
        return num[1];
    }) 
    dataApp.displayChart(countryNames,countryNumbers);
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
                borderWidth: 2
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

dataApp.displayGlobalData = (res) => {
    const {NewConfirmed,NewDeaths,NewRecovered,TotalConfirmed,TotalDeaths, TotalRecovered} = res.Global;
    $('.totalConfirmed span').html(`${TotalConfirmed}`);
    $('.totalRecovered span').html(`${TotalRecovered}`);
    $('.totalDeaths span').html(`${TotalDeaths}`); 
    $('.timeElapsed').html(res.Date);
}

dataApp.getUserSelection = (e) => {
    const countryCode = e.target.value;
    dataApp.getCountryData(countryCode);
    dataApp.getPopulationData(countryCode);
}
dataApp.getCountryData = (countryCode)=>{
    const apiUrl = `https://api.covid19api.com/total/country/${countryCode}`;
    $.ajax({
        url:apiUrl,
        method:'GET',
        format:'jsonp',
        async:false,
        success:function(result){
        },
        error:function(error){
        }
    }).then((result)=>{ 
        let countryData = result[result.length - 1];
        console.log(countryData);
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

dataApp.getPopulationData = (countryCode)=>{
    const apiUrl = `https://restcountries-v1.p.rapidapi.com/alpha/${countryCode}`;
    //'https://restcountries-v1.p.rapidapi.com/all';
    $.ajax({
        url:apiUrl,
        method:'GET',
        format:'jsonp',
        headers: {
            'x-rapidapi-host': 'restcountries-v1.p.rapidapi.com',
            'x-rapidapi-key': '6f14bd9ffbmsh0b1fd17cc1d70e5p1cbae5jsn22a2ab82fc71'
        }
    }).then(function(result){
        console.log(result);
        $('.countryPopulation span').html(result.population);
        const lat = result.latlng[0];
        const lng = result.latlng[1];
        console.log(lat,lng);
        const cases = $('.countryConfirmed span').text();
        if (dataApp.map) {
            dataApp.map.setView(L.latLng(`${lat}`, `${lng}`));
            let popUp = 'Data Not Available';
            if(dataApp.available){
                popUp = `<strong>${result.name}</strong> has <strong><br>${cases}</strong> confirmed cases`;
            }

            L.marker([`${lat}`, `${lng}`])
                .addTo(dataApp.map)
                .bindPopup(popUp)
                .openPopup()
        } else {
            console.log("Map not found");
        }
    });
}
dataApp.getMap = function(lat,lng){
    console.log("GET MAP at "+lat+"::"+lng)
    L.mapquest.key = 'ozwRV4KrZgLGMjKBYbnTIZBWQAN4JZBn';
    dataApp.map =  L.mapquest.map('map', {
            center: [`${lat}`,`${lng}`],
            layers: L.mapquest.tileLayer('map'),
            zoom: 4
        });
}

// Initialization
dataApp.init = () =>{
    dataApp.getGlobalData();
    dataApp.getCountryData("CA");
    dataApp.getPopulationData("CA");
    dataApp.getMap(60,-95);// pass the coordinates of Canada
    $('select#countryList').on('change', dataApp.getUserSelection);
} 
// Document Ready
$(() => {
    dataApp.init();
})