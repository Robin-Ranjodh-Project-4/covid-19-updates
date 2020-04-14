const dataApp = {} //namespace object

dataApp.getGlobalData = () => {
    $.ajax({
        url: 'https://api.covid19api.com/summary',
        method:'GET',
        format:'jsonp',
        success:function(result){
            // console.log(result);
        },
        error:function(error){
            console.log(error);
        }
    }).then(function(result){
        dataApp.displayGlobalData(result);
        dataApp.displayTopTen(result);
    });
} 
dataApp.getCountryData = (countryCode)=>{

    const apiUrl = `https://api.covid19api.com/total/country/${countryCode}`;
    $.ajax({
        url:apiUrl,
        method:'GET',
        format:'jsonp',
        success:function(result){
        },
        error:function(error){
            console.log(error);
        }
    }).then((result)=>{ 
        const countryData = result[result.length - 1];
        $('.countryName span').html(countryData.Country);
        if(countryData){
            $('.countryConfirmed span').html(countryData.Confirmed);
            $('.countryRecovered span').html(countryData.Recovered);
        }else{
            $('.countryConfirmed span').html("No Data");
            $('.countryRecovered span').html("No Data");
        }
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



    // const totalConfirmed = result.Countries;
    // console.table(totalConfirmed);
    // totalConfirmed.sort(function (a, b) {
    //     return b.TotalConfirmed - a.TotalConfirmed;
    // });
    // const topTen = totalConfirmed.slice(0, 10);
    // const tempObject = {};
    // topTen.forEach((index)=>{
    //     tempObject[index.Country] = index.TotalConfirmed;
    // })
    // console.table(tempObject);
    // console.log(tempObject);
    // // dataApp.displayChart(tempObject);
    // const countries = [];
    // const cases = [];
    // // tempObject.forEach(obj=>{
    // //     countries.push(obj.Country);
    // //     cases.push(obj.TotalConfirmed);
    // // });
    // console.log(countries);
    // console.log(cases);
// }

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
}

// Initialization
dataApp.init = () =>{
    dataApp.getCountryData("CA");
    $('select').on('change', dataApp.getUserSelection);
    dataApp.getGlobalData();
} 
// Document Ready
$(() => {
    dataApp.init();
})



// Robin's code 
// const getGlobalData1 = $.ajax({
//         url: 'https://api.covid19api.com/summary',
//         method: 'GET',
//         format: 'json'
//     }).then((result) => {
//         const countries = result.Countries

//         let newObject = {}
//         countries.forEach((index) => {
//             newObject[index.Country] = index.TotalConfirmed;
//         })

//         const countriesSorted = Object.entries(newObject).sort(function (a, b) {
//             const aNum = a[1];
//             const bNum = b[1];
//             return bNum - aNum;
//         });

//         const newArray = Object.values(countriesSorted)
//         const topTenResults = newArray.slice(0, 10); 

//         const countryNames = newArray.map((num) => {
//                return num.Country
//         }) 
//         const countryNumbers = newArray.map((num) => {
//                return num.TotalConfirmed
//         }) 
//         console.log(countryNames)
//         console.log(countryNumbers)
//     });
