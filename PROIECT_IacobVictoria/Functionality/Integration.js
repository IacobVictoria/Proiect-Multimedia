// tara an indicator asa sa arate datele in romana

const countries = [
  "BE",
  "BG",
  "CZ",
  "DK",
  "DE",
  "EE",
  "IE",
  "EL",
  "ES",
  "FR",
  "HR",
  "IT",
  "CY",
  "LV",
  "LT",
  "LU",
  "HU",
  "MT",
  "NL",
  "AT",
  "PL",
  "PT",
  "RO",
  "SI",
  "SK",
  "FI",
  "SE",
];

const years = [
  2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020,
  2021, 2022, 2023,
];

async function fetchData(indicator, queryParams) {
  const baseUrl = `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${indicator}`;
  const url = `${baseUrl}?${queryParams}`;
  try {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(
        `Eroare la API pentru ${indicator}: ${response.statusText}`
      );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Eroare la preluarea datelor:", error);
    return null;
  }
}

const geoParam = countries.map((country) => `geo=${country}`).join("&");
const timeParam = years.map((year) => `time=${year}`).join("&");

// Parametrii pentru fiecare indicator
const paramsPIB = `na_item=B1GQ&unit=CLV10_EUR_HAB&${geoParam}&${timeParam}`;
const paramsSV = `sex=T&age=Y1&${geoParam}&${timeParam}`;
const paramsPop = `sex=T&age=TOTAL&${geoParam}&${timeParam}`;

function processData(apiResponse, indicator) {
  const values = apiResponse.value;
  const geoIndex = apiResponse.dimension.geo.category.index;
  const timeIndex = apiResponse.dimension.time.category.index;

  let results = [];
  for (let [index, value] of Object.entries(values)) {
    const geoKey = Object.keys(geoIndex).find(
      (key) =>
        geoIndex[key] === Math.floor(index / Object.keys(timeIndex).length)
    );
    const timeKey = Object.keys(timeIndex).find(
      (key) => timeIndex[key] === index % Object.keys(timeIndex).length
    );

    results.push({
      country: geoKey,
      year: timeKey,
      indicator: indicator,
      value: value,
    });
  }
  return results;
}

// Funcția pentru a popula tabelul
function displayData(data) {
  const tbody = document.querySelector("#tbody");
  tbody.innerHTML = "";
  for (let i = 0; i < data.length; i++) {
    let row = document.createElement("tr");

    const addCell = (text) => {
      let td = document.createElement("td");
      td.innerText = text;
      row.append(td);
    };

    addCell(data[i].country);
    addCell(data[i].year);
    addCell(data[i].indicator);
    addCell(data[i].value);

    tbody.append(row);
  }
}

// Funcția pentru filtrarea datelor
function filterData(allData) {
  const indicator = document.getElementById("indicatorSelect").value;
  const countryFilter = document
    .getElementById("countryInput")
    .value.toUpperCase();
  const yearFilter = document.getElementById("yearInput").value;

  // Filtrăm datele
  const filteredData = allData.filter((row) => {
    const matchesCountry = row.country.includes(countryFilter);
    const matchesYear = row.year.includes(yearFilter);
    const matchesIndicator = indicator === "All" || row.indicator === indicator;

    return matchesCountry && matchesYear && matchesIndicator;
  });

  // Populăm tabelul cu datele filtrate
  displayData(filteredData);
}

// Funcția care preia datele și le procesează
async function fetchAndProcessAll() {
  const [pibData, svData, popData] = await Promise.all([
    fetchData("sdg_08_10", paramsPIB),
    fetchData("demo_mlexpec", paramsSV),
    fetchData("demo_pjan", paramsPop),
  ]);

  if (!pibData || !svData || !popData) {
    console.error("Nu s-au putut prelua toate datele.");
    return null;
  }

  // Procesăm fiecare set de date
  const processedPIB = processData(pibData, "PIB");
  const processedSV = processData(svData, "SV");
  const processedPOP = processData(popData, "POP");

  // Combinăm toate datele
  return [...processedPIB, ...processedSV, ...processedPOP];
}
let allData;
// Apelăm funcția pentru popularea tabelului la încărcarea paginii
async function init() {
  allData = await fetchAndProcessAll();
  if (!allData) return;

  // Populăm tabelul cu datele preluate
  displayData(allData);

  // Apelăm funcția de filtrare atunci când se schimbă selectul
  document
    .getElementById("indicatorSelect")
    .addEventListener("change", () => filterData(allData));
  document
    .getElementById("countryInput")
    .addEventListener("input", () => filterData(allData));
  document
    .getElementById("yearInput")
    .addEventListener("input", () => filterData(allData));
}

// Apelăm funcția de inițializare
init();

//cerinte 2 -3

const countrySelect = document.getElementById("countrySelect");

countries.forEach((country) => {
  let option = document.createElement("option");
  option.value = country;
  option.innerText = country;
  countrySelect.appendChild(option);
});

const indicators = [
  "PIB", // Produsul Intern Brut
  "SV", // Speranța de viață
  "POP", // Populație
];

// Selectăm dropdown-ul pentru indicatori
const indicatorSelect = document.getElementById("indicatorSelectSVG");

// Populăm dropdown-ul cu indicatorii din lista `indicators`
indicators.forEach((indicator) => {
  let option = document.createElement("option");
  option.value = indicator;
  option.innerText = indicator;
  indicatorSelect.appendChild(option);
});

// daca apas pe svg button si nu am selectat ambele sa am un warning

function createGraph(data) {
  console.log("data" + JSON.stringify(data, null, 2));
  // Definirea dimensiunii graficului
  const margin = { top: 80, right: 30, bottom: 30, left: 150 };
  const width = 1000 - margin.left - margin.right;
  const height = 600 - margin.top - margin.bottom;

  // Definirea scalei pentru axele X și Y
  const x = d3.scale
    .linear()
    .domain([2008, 2023]) // Anii
    .range([0, width]);

  // Verificăm dacă datele au valori valide pentru Y și calculăm maximul
  const maxValue = d3.max(data, function (d) {
    return d.value;
  });

  const y = d3.scale
    .linear()
    .domain([0, maxValue]) // Valorile indicatorului, folosind maxValue pentru Y
    .range([height, 0]);

  // Crearea axe X și Y
  const xAxis = d3.svg.axis().scale(x).orient("bottom");
  const yAxis = d3.svg.axis().scale(y).orient("left");

  // Crearea graficului
  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Adăugarea axei X
  svg
    .append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  // Adăugarea axei Y
  svg.append("g").attr("class", "y axis").call(yAxis);

  const barWidth = 20; // Setează o lățime fixă a barelor pentru vizibilitate
  // Crearea barelor pentru grafic
  svg
  .selectAll(".bar")
  .data(data) // Legăm direct datele
  .enter()
  .append("rect")
  .attr("class", "bar")
  .attr("x", function (d) {
    return x(+d.year) - barWidth / 2; // Convertim `year` la număr pentru scală
  })
  .attr("y", function (d) {
    return y(d.value); // Poziționarea pe axa Y
  })
  .attr("width", barWidth) // Lățimea fiecărei bare
  .attr("height", function (d) {
    console.log(d.year); // Ar trebui să afișeze anul corect
    return height - y(d.value); // Înălțimea barei
  })
  .on("mouseover", function (event, d) { // Asigură-te că d este obiectul de date
    console.log(d); // Ar trebui să afișeze obiectul complet
    tooltip.transition().duration(200).style("opacity", 0.9);
    tooltip
      .html(
        `Țara: ${data[d].country}<br>An: ${data[d].year}<br>Indicator: ${data[d].indicator}<br>Valoare: ${data[d].value}` // Accesăm câmpurile JSON
      )
      .style("left", event.pageX + 5 + "px")
      .style("top", event.pageY - 28 + "px");
  })
  .on("mouseout", function () {
    tooltip.transition().duration(500).style("opacity", 0);
  });

  // Adăugarea tooltip-ului
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
}

document.getElementById("seeSvgButton").addEventListener("click", async () => {
  const indicator = document.getElementById("indicatorSelectSVG").value;
  const country = document.getElementById("countrySelect").value;

  if (!indicator || !country) {
    alert(
      "Te rog să selectezi atât un indicator, cât și o țară pentru a vizualiza graficul."
    );
    return;
  }

  const filteredData = allData.filter(
    (d) => d.country === country && d.indicator === indicator
  );

  if (filteredData.length === 0) {
    alert("Nu există date pentru combinația selectată.");
    return;
  }
  d3.select("#chart").selectAll("*").remove();
  console.log(filteredData);
  createGraph(filteredData);
});
