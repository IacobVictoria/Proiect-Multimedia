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
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  const width = 800 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  // Definirea scalei pentru axele X și Y
  const x = d3.scale
    .linear()
    .domain(d3.extent(data, (d) => +d.year)) // Anii
    .range([0, width]);

  const y = d3.scale
    .linear()
    .domain([
      0,
      d3.max(data, function (d) {
        return d.value;
      }),
    ]) // Valorile indicatorului, folosind maxValue pentru Y
    .range([height, 0]);

  // Crearea axe X și Y
  const xAxis = d3.svg.axis().scale(x).orient("bottom");
  const yAxis = d3.svg.axis().scale(y).orient("left");

  // Crearea graficului SVG
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
    .call(xAxis)
    .append("text")
    .attr("x", width / 2) // Poziționează textul la mijlocul axei X
    .attr("y", 30) // Poziționare sub axa X
    .style("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Anii (2008 - 2023)");

  // Adăugarea axei Y
  svg
    .append("g")
    .attr("class", "y axis")
    .call(yAxis)
    .append("text")
    .attr("transform", "rotate(-90)") // Rotire text pentru axa Y
    .attr("x", -height / 2) // Centrat vertical
    .attr("y", -40) // Poziționare lateral stânga
    .style("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Valori Indicator");

  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("padding", "6px")
    .style("background", "steelblue")
    .style("color", "white")
    .style("border", "1px solid #ddd")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("opacity", 0);

  const line = d3.svg
    .line()
    .x(function (d) {
      return x(+d.year);
    })
    .y(function (d) {
      return y(d.value);
    });

  // Adăugarea liniei în grafic
  svg
    .append("path")
    .datum(data)
    .attr("class", "line")
    .attr("d", line)
    .style("fill", "none")
    .style("stroke", "steelblue")
    .style("stroke-width", "2px")
    .on("mouseover", function () {
      tooltip.transition().duration(200).style("opacity", 0.9);
    })
    .on("mousemove", function (event) {
      // Determinăm poziția mouse-ului
      const mouseX = d3.mouse(this)[0];
      const yearScale = x.invert(mouseX);

      // Găsim cel mai apropiat punct
      const closest = data.reduce((prev, curr) => {
        return Math.abs(curr.year - yearScale) < Math.abs(prev.year - yearScale)
          ? curr
          : prev;
      });

      // Actualizăm tooltip-ul
      tooltip
        .html(`An: ${closest.year}<br>Valoare: ${closest.value}`)
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", function () {
      tooltip.transition().duration(500).style("opacity", 0);
    });
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
