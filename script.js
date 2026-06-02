let fullData = [];
let years = [];
let dataByScenario = {
    ssp126: [],
    ssp245: [],
    ssp585: []
};
let currentScenario = "ssp245";
let currentYear = 2100;
let playInterval = null;
let dataLoaded = false;

const colors = { ssp126: "#27ae60", ssp245: "#f39c12", ssp585: "#e74c3c" };
const scenarioNames = { ssp126: "SSP1-2.6 (Low)", ssp245: "SSP2-4.5 (Medium)", ssp585: "SSP5-8.5 (High)" };
const ARCTIC_MULTIPLIER = 2.2;

const regionalMultipliers = {
    "Afghanistan": 1.1, "Albania": 1.15, "Algeria": 1.05, "Angola": 0.95, "Argentina": 0.9,
    "Armenia": 1.1, "Australia": 0.95, "Austria": 1.2, "Azerbaijan": 1.1, "Bahrain": 1.05,
    "Bangladesh": 1.0, "Belarus": 1.25, "Belgium": 1.2, "Benin": 0.95, "Bhutan": 1.05,
    "Bolivia": 0.85, "Bosnia and Herzegovina": 1.15, "Botswana": 0.95, "Brazil": 0.85,
    "Bulgaria": 1.15, "Burkina Faso": 0.95, "Burundi": 0.9, "Cambodia": 1.0, "Cameroon": 0.95,
    "Canada": 1.6, "Chile": 0.88, "China": 1.15, "Colombia": 0.85, "Congo": 0.95,
    "Costa Rica": 0.9, "Croatia": 1.15, "Cuba": 1.0, "Cyprus": 1.1, "Czech Republic": 1.2,
    "Denmark": 1.3, "Egypt": 1.05, "Estonia": 1.25, "Ethiopia": 0.88, "Finland": 1.4,
    "France": 1.2, "Germany": 1.2, "Ghana": 0.95, "Greece": 1.15, "Greenland": 2.0,
    "Guatemala": 1.0, "Haiti": 1.0, "Honduras": 1.0, "Hungary": 1.2, "Iceland": 1.5,
    "India": 1.05, "Indonesia": 0.95, "Iran": 1.15, "Iraq": 1.15, "Ireland": 1.2,
    "Israel": 1.1, "Italy": 1.15, "Jamaica": 1.0, "Japan": 1.08, "Jordan": 1.1,
    "Kazakhstan": 1.3, "Kenya": 0.85, "Kuwait": 1.1, "Laos": 1.0, "Latvia": 1.25,
    "Lebanon": 1.1, "Liberia": 0.95, "Libya": 1.05, "Lithuania": 1.25, "Luxembourg": 1.2,
    "Madagascar": 0.9, "Malawi": 0.9, "Malaysia": 0.95, "Mali": 0.95, "Malta": 1.15,
    "Mexico": 1.1, "Mongolia": 1.4, "Morocco": 1.05, "Mozambique": 0.9, "Myanmar": 1.0,
    "Namibia": 0.95, "Nepal": 1.05, "Netherlands": 1.2, "New Zealand": 0.9, "Nicaragua": 1.0,
    "Niger": 0.95, "Nigeria": 0.95, "North Korea": 1.1, "Norway": 1.5, "Oman": 1.1,
    "Pakistan": 1.1, "Panama": 0.9, "Papua New Guinea": 0.9, "Paraguay": 0.85, "Peru": 0.82,
    "Philippines": 1.0, "Poland": 1.2, "Portugal": 1.15, "Qatar": 1.1, "Romania": 1.15,
    "Russia": 1.8, "Rwanda": 0.9, "Saudi Arabia": 1.1, "Senegal": 0.95, "Serbia": 1.15,
    "Singapore": 0.95, "Slovakia": 1.2, "Slovenia": 1.15, "Somalia": 0.95, "South Africa": 0.95,
    "South Korea": 1.08, "South Sudan": 0.95, "Spain": 1.15, "Sri Lanka": 0.95, "Sudan": 0.95,
    "Sweden": 1.4, "Switzerland": 1.2, "Syria": 1.1, "Taiwan": 1.05, "Tajikistan": 1.15,
    "Tanzania": 0.85, "Thailand": 1.0, "Togo": 0.95, "Tunisia": 1.05, "Turkey": 1.2,
    "Turkmenistan": 1.2, "Uganda": 0.85, "Ukraine": 1.25, "United Arab Emirates": 1.1,
    "United Kingdom": 1.2, "United States": 1.3, "Uruguay": 0.9, "Uzbekistan": 1.2,
    "Venezuela": 0.85, "Vietnam": 1.0, "Yemen": 1.05, "Zambia": 0.9, "Zimbabwe": 0.95
};
const DEFAULT_MULTIPLIER = 1.0;

const storySteps = [
    {
        year: 2015,
        scenario: "ssp245",
        title: "📍 Where We Are Today",
        text: "In 2015, the Paris Agreement was signed. Global temperatures are already ~1.2°C above pre-industrial levels. The path we choose from here determines everything."
    },
    {
        year: 2040,
        scenario: "ssp585",
        title: "🔥 High Emissions: Early Warning Signs",
        text: "Under high emissions, the Arctic is warming 3× faster than the global average. Summer sea ice is disappearing. Extreme weather events are becoming the norm."
    },
    {
        year: 2060,
        scenario: "ssp585",
        title: "⚠️ The 2°C Threshold Is Crossed",
        text: "We've passed the critical 2°C threshold. Coral reefs are largely gone, coastal flooding displaces hundreds of millions, and deadly heatwaves strike annually."
    },
    {
        year: 2060,
        scenario: "ssp126",
        title: "🌱 Low Emissions: A Different 2060",
        text: "The same year, under low emissions, warming stays near 1.5°C. Renewable energy dominates. The worst impacts are avoided. The difference is stark — look at the map."
    },
    {
        year: 2100,
        scenario: "ssp585",
        title: "💀 High Emissions End of Century",
        text: "4–5°C of warming. Large parts of the tropics are uninhabitable in summer. Sea levels have risen over a meter. This is the world we leave to future generations."
    },
    {
        year: 2100,
        scenario: "ssp126",
        title: "✅ Low Emissions End of Century",
        text: "~1.5°C of warming. A livable planet. The difference between this and the previous step is entirely determined by choices made in the next 10–20 years."
    }
];

let currentStoryStep = 0;

function showStoryStep(index) {
    const step = storySteps[index];
    currentScenario = step.scenario;
    currentYear = step.year;

    // Update UI controls to match
    d3.select("#year-slider").property("value", currentYear);
    d3.select("#year-value").text(currentYear);
    d3.selectAll(".scenario-btn").classed("active", false);
    d3.select(`[data-scenario="${currentScenario}"]`).classed("active", true);

    // Update story panel text
    const scenarioLabel = { ssp126: "🌱 Low Emissions", ssp245: "⚠️ Medium Emissions", ssp585: "🔥 High Emissions" };
    const scenarioClass = { ssp126: "low", ssp245: "medium", ssp585: "high" };
    
    document.getElementById("story-year").textContent = step.year;
    document.getElementById("story-title").innerHTML = `${step.title} <span class="story-scenario-tag ${scenarioClass[step.scenario]}">${scenarioLabel[step.scenario]}</span>`;
    document.getElementById("story-text").textContent = step.text;
    document.getElementById("story-counter").textContent = `${index + 1} / ${storySteps.length}`;

    // Disable prev/next buttons at boundaries
    document.getElementById("story-prev").disabled = index === 0;
    document.getElementById("story-next").disabled = index === storySteps.length - 1;

    loadWorldMap();
    updateInsights();
}
async function loadData() {
    try {
        const response = await fetch('cmip6_real_data.csv');
        if (!response.ok) {
            throw new Error('CSV file not found');
        }
        
        const csvText = await response.text();
        const parsed = d3.csvParse(csvText);
        
        let globalData = parsed;
        if (parsed[0] && parsed[0].hasOwnProperty('region')) {
            globalData = parsed.filter(d => d.region === 'Global' || d.region === 'global');
        }
        
        if (globalData.length === 0) {
            globalData = parsed;
        }
        
        years = [...new Set(globalData.map(d => +d.year))].sort((a, b) => a - b);
        
        const lowAnomalies = {};
        globalData.forEach(d => {
            if (d.scenario === 'ssp126' || d.scenario === 'SSP1-2.6 (Low)') {
                lowAnomalies[+d.year] = +d.anomaly;
            }
        });
        
        if (Object.keys(lowAnomalies).length === 0) {
            throw new Error('No SSP1-2.6 data found');
        }
        
        for (let year of years) {
            const lowAnom = lowAnomalies[year] !== undefined ? lowAnomalies[year] : 0;
            dataByScenario.ssp126.push(lowAnom);
            dataByScenario.ssp245.push(lowAnom * 1.8);
            dataByScenario.ssp585.push(lowAnom * 3.0);
        }
        
        dataLoaded = true;
        loadWorldMap();
        
    } catch (error) {
        console.error("ERROR:", error.message);
        document.getElementById("chart").innerHTML = `
            <div style="text-align: center; padding: 50px; color: #e74c3c;">
                <strong>Error Loading Data</strong><br>
                ${error.message}<br><br>
                Make sure cmip6_real_data.csv is in the same folder.
            </div>
        `;
    }
}

// function setupLanding() {
//     document.getElementById("landing-story").addEventListener("click", () => {
//         dismissLanding();
//         // turn on story mode after landing fades
//         setTimeout(() => {
//             document.getElementById("story-panel").style.display = "block";
//             currentStoryStep = 0;
//             showStoryStep(0);
//             document.getElementById("story-panel")
//                 .scrollIntoView({ behavior: "smooth" });
//         }, 800);
//     });

//     document.getElementById("landing-explore").addEventListener("click", () => {
//         dismissLanding();
//         setTimeout(() => {
//             document.querySelector(".controls")
//                 .scrollIntoView({ behavior: "smooth" });
//         }, 800);
//     });

//     // also dismiss on scroll
//     window.addEventListener("scroll", () => dismissLanding(), { once: true });
// }

// function dismissLanding() {
//     const screen = document.getElementById("landing-screen");
//     if (!screen.classList.contains("fade-out")) {
//         screen.classList.add("fade-out");
//         setTimeout(() => screen.style.display = "none", 800);
//     }
// }
let currentSlide = 1;

function goToSlide(n) {
    const prev = document.getElementById(`slide-${currentSlide}`);
    const next = document.getElementById(`slide-${n}`);
    const dots = document.querySelectorAll(".dot");

    prev.classList.add("exit");
    setTimeout(() => {
        prev.classList.remove("active", "exit");
    }, 600);

    setTimeout(() => {
        next.classList.add("active");
    }, 300);

    dots.forEach((d, i) => d.classList.toggle("active", i === n - 1));
    currentSlide = n;
}

function dismissLanding() {
    const screen = document.getElementById("landing-screen");
    if (!screen.classList.contains("fade-out")) {
        screen.classList.add("fade-out");
        setTimeout(() => screen.style.display = "none", 800);
    }
}

function setupLanding() {
    document.getElementById("landing-story").addEventListener("click", () => {
        dismissLanding();
        setTimeout(() => {
            document.getElementById("story-panel").style.display = "block";
            currentStoryStep = 0;
            showStoryStep(0);
            document.getElementById("story-panel").scrollIntoView({ behavior: "smooth" });
        }, 800);
    });

    document.getElementById("landing-explore").addEventListener("click", () => {
        dismissLanding();
        setTimeout(() => {
            document.querySelector(".controls").scrollIntoView({ behavior: "smooth" });
        }, 800);
    });
}
async function loadWorldMap() {
    try {
        const world = await d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json");
        
        const width = document.getElementById('chart').clientWidth;
        const height = 550;
        
        d3.select("#chart").html("");
        
        document.querySelectorAll(".fs-btn").forEach(b => b.remove());
        // Add fullscreen button
        const fsBtn = document.createElement("button");
        fsBtn.className = "fs-btn";
        fsBtn.innerHTML = "⛶ Fullscreen";
        fsBtn.style.cssText = `
            position: absolute; top: 10px; right: 10px;
            padding: 6px 14px; border-radius: 20px; border: none;
            background: rgba(100,181,246,0.2); color: #64b5f6;
            cursor: pointer; font-size: 0.75rem; font-weight: 600;
            backdrop-filter: blur(4px); z-index: 10;
            border: 1px solid rgba(100,181,246,0.3);
        `;
        fsBtn.onclick = () => {
            const chartEl = document.getElementById("chart");
            if (!document.fullscreenElement) {
                chartEl.requestFullscreen();
                fsBtn.innerHTML = "✕ Exit Fullscreen";
            } else {
                document.exitFullscreen();
                fsBtn.innerHTML = "⛶ Fullscreen";
            }
        };

        document.getElementById("chart").style.position = "relative";
        document.getElementById("chart").appendChild(fsBtn);
        // const svg = d3.select("#chart")
        //     .append("svg")
        //     .attr("width", width)
        //     .attr("height", height)
        //     .append("g");

        const projection = d3.geoMercator()
            .scale(width / (2.2 * Math.PI))
            .translate([width / 2, height / 1.3]);
        
        const pathGenerator = d3.geoPath().projection(projection);
        // Replace lines 112–124 with this:

        const svgEl = d3.select("#chart")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        // const svg = svgEl.append("g");  // this is what paths get drawn into

        const g = svgEl.append("g");
        const zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        svgEl.call(zoom);  // zoom goes on the real SVG element

        g.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "#0a1628");
        
        const countries = topojson.feature(world, world.objects.countries);
        
        g.selectAll(".country")
            .data(countries.features)
            .enter()
            .append("path")
            .attr("class", "country")
            .attr("d", pathGenerator)
            .attr("fill", d => getCountryColor(d.properties.name))
            .attr("stroke", "#1a2a4a")
            .attr("stroke-width", 0.5)
            .attr("cursor", "pointer")
            .on("mouseover", function(event, d) {
                d3.select(this).attr("stroke-width", 2).attr("stroke", "#64b5f6");
                showCountryTooltip(event, d.properties.name);
            })
            .on("mouseout", function() {
                d3.select(this).attr("stroke-width", 0.5).attr("stroke", "#1a2a4a");
                hideTooltip();
            });

        // Grid Lines
        // const graticule = d3.geoGraticule();
        // g.append("path")
        //     .datum(graticule)
        //     .attr("class", "graticule")
        //     .attr("d", pathGenerator)
        //     .attr("fill", "none")
        //     .attr("stroke", "#1a2a4a")
        //     .attr("stroke-width", 0.3);
        
        updateThermometer();
        updateArcticMeter();
        updateWarmingStripes();
        updateInsights();
        
        // Add horizontal legend to warming stripes card
        const meterCard = document.querySelector('.meter-card:last-child');
        if (meterCard && !document.querySelector('.stripes-legend-horizontal')) {
            const existingContainer = meterCard.querySelector('.stripes-container');
            if (existingContainer) {
                const wrapper = document.createElement('div');
                wrapper.className = 'stripes-with-legend';
                existingContainer.parentNode.insertBefore(wrapper, existingContainer);
                wrapper.appendChild(existingContainer);
                
                const legendDiv = document.createElement('div');
                legendDiv.className = 'stripes-legend-horizontal';
                legendDiv.innerHTML = `
                    <div class="stripes-legend-item">
                        <div class="stripes-legend-color" style="background: #2ecc71;"></div>
                        <span>0-1°C</span>
                    </div>
                    <div class="stripes-legend-item">
                        <div class="stripes-legend-color" style="background: #93c5fd;"></div>
                        <span>1-2°C</span>
                    </div>
                    <div class="stripes-legend-item">
                        <div class="stripes-legend-color" style="background: #f1c40f;"></div>
                        <span>2-3°C</span>
                    </div>
                    <div class="stripes-legend-item">
                        <div class="stripes-legend-color" style="background: #f39c12;"></div>
                        <span>3-4°C</span>
                    </div>
                    <div class="stripes-legend-item">
                        <div class="stripes-legend-color" style="background: #e74c3c;"></div>
                        <span>4-5°C</span>
                    </div>
                    <div class="stripes-legend-item">
                        <div class="stripes-legend-color" style="background: #8e44ad;"></div>
                        <span>>5°C</span>
                    </div>
                `;
                wrapper.appendChild(legendDiv);
            }
        }
        
    } catch (error) {
        console.error("Error loading map:", error);
    }
}

function getCountryColor(countryName) {
    const yearIndex = years.indexOf(currentYear);
    if (yearIndex === -1) return "#2a3a5a";
    
    const globalAnomaly = dataByScenario[currentScenario][yearIndex];
    const multiplier = regionalMultipliers[countryName] || DEFAULT_MULTIPLIER;
    const anomaly = globalAnomaly * multiplier;
    
    if (anomaly > 5) return "#8e44ad";
    if (anomaly > 4) return "#e74c3c";
    if (anomaly > 3) return "#f39c12";
    if (anomaly > 2) return "#f1c40f";
    if (anomaly > 1) return "#93c5fd";
    return "#2ecc71";
}

function showCountryTooltip(event, countryName) {
    const yearIndex = years.indexOf(currentYear);
    if (yearIndex === -1) return;
    
    const globalAnomaly = dataByScenario[currentScenario][yearIndex];
    const multiplier = regionalMultipliers[countryName] || DEFAULT_MULTIPLIER;
    const anomaly = globalAnomaly * multiplier;
    
    let color;
    if (anomaly > 5) color = "#8e44ad";
    else if (anomaly > 4) color = "#e74c3c";
    else if (anomaly > 3) color = "#f39c12";
    else if (anomaly > 2) color = "#f1c40f";
    else if (anomaly > 1) color = "#93c5fd";
    else color = "#2ecc71";
    
    let tooltip = d3.select(".map-tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select("body").append("div")
            .attr("class", "map-tooltip")
            .style("position", "absolute")
            .style("background", "#1e293b")
            .style("padding", "10px 15px")
            .style("border-radius", "8px")
            .style("font-size", "12px")
            .style("pointer-events", "none")
            .style("border", `2px solid ${color}`)
            .style("z-index", "100")
            .style("box-shadow", "0 4px 15px rgba(0,0,0,0.3)");
    }
    
    tooltip
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 20) + "px")
        .html(`
            <strong>${countryName}</strong><br>
            Temperature Anomaly: ${anomaly.toFixed(2)}°C<br>
            Scenario: ${scenarioNames[currentScenario]}<br>
            Year: ${currentYear}
        `);
}

function hideTooltip() {
    d3.selectAll(".map-tooltip").remove();
}

function updateThermometer() {
    const yearIndex = years.indexOf(currentYear);
    if (yearIndex === -1) return;
    
    const anomaly = dataByScenario[currentScenario][yearIndex];
    const fillPercent = Math.min(100, (anomaly / 5.5) * 100);
    
    let color;
    if (anomaly > 5) color = "#8e44ad";
    else if (anomaly > 4) color = "#e74c3c";
    else if (anomaly > 3) color = "#f39c12";
    else if (anomaly > 2) color = "#f1c40f";
    else if (anomaly > 1) color = "#93c5fd";
    else color = "#2ecc71";
    
    d3.select("#thermometer-fill")
        .transition()
        .duration(500)
        .style("height", `${fillPercent}%`)
        .style("background", color);
    
    d3.select("#temp-label").text(`${anomaly.toFixed(2)}°C`);
}

function updateArcticMeter() {
    const yearIndex = years.indexOf(currentYear);
    if (yearIndex === -1) return;
    
    const anomaly = dataByScenario[currentScenario][yearIndex];
    const arcticAnomaly = anomaly * ARCTIC_MULTIPLIER;
    const icePercent = Math.max(0, 100 - (arcticAnomaly / 6) * 100);
    
    d3.select("#ice-fill")
        .transition()
        .duration(500)
        .style("height", `${icePercent}%`);
    
    d3.select("#ice-percent").text(`${Math.round(icePercent)}%`);
}

function updateWarmingStripes() {
    const container = d3.select("#stripes-container");
    if (container.empty()) return;
    
    container.html("");
    
    const currentYearIndex = years.indexOf(currentYear);
    if (currentYearIndex === -1) return;
    
    for (let i = 0; i <= currentYearIndex; i++) {
        const anomaly = dataByScenario[currentScenario][i];
        let color;
        if (anomaly > 5) color = "#8e44ad";
        else if (anomaly > 4) color = "#e74c3c";
        else if (anomaly > 3) color = "#f39c12";
        else if (anomaly > 2) color = "#f1c40f";
        else if (anomaly > 1) color = "#93c5fd";
        else color = "#2ecc71";
        
        container.append("div")
            .style("width", "8px")
            .style("height", "60px")
            .style("background", color)
            .style("display", "inline-block");
    }
}

function updateInsights() {
    if (!dataLoaded) return;
    
    const yearIndex = years.indexOf(currentYear);
    if (yearIndex === -1) return;
    
    const globalAnomaly = dataByScenario[currentScenario][yearIndex];
    const arcticAnomaly = globalAnomaly * ARCTIC_MULTIPLIER;
    
    let crossingYear = "After 2100";
    for (let i = 0; i < years.length; i++) {
        if (dataByScenario[currentScenario][i] >= 2.0) {
            crossingYear = years[i];
            break;
        }
    }
    
    document.getElementById("global-warming").innerHTML = `${globalAnomaly.toFixed(2)}°C`;
    document.getElementById("arctic-warming").innerHTML = `${arcticAnomaly.toFixed(2)}°C`;
    document.getElementById("crossing-year").innerHTML = crossingYear;
    
    let insightText = "";
    if (currentScenario === "ssp126") {
        insightText = "Under low emissions, warming is limited to about 1.5 degrees Celsius by 2100, meeting the Paris Agreement goal. The Arctic still warms 2 to 3 times faster, but many catastrophic impacts are avoided. This pathway requires global carbon neutrality by 2050.";
    } else if (currentScenario === "ssp245") {
        insightText = "Under medium emissions, we reach about 2.7 degrees Celsius warming by 2100. This causes severe impacts on agriculture, water resources, and coastal communities. The Arctic warms 2 to 3 times faster, leading to ice-free summers by 2050.";
    } else {
        insightText = "Under high emissions, catastrophic 4 to 5 degrees Celsius warming occurs by 2100. Arctic ice-free summers arrive by 2040, sea levels rise 1 to 2 meters, and deadly heatwaves become annual events. This highlights the urgency of emission reductions.";
    }
    
    document.getElementById("insight-text").innerHTML = insightText;
}

function setupEventListeners() {
    setupLanding();
    d3.selectAll(".scenario-btn").on("click", function() {
        d3.selectAll(".scenario-btn").classed("active", false);
        d3.select(this).classed("active", true);
        currentScenario = d3.select(this).attr("data-scenario");
        if (dataLoaded) {
            loadWorldMap();
            updateInsights();
        }
    });
    
    d3.select("#year-slider").on("input", function() {
        if (playInterval) {
            clearInterval(playInterval);
            playInterval = null;
            d3.select("#play-btn").text("Play");
        }
        currentYear = +d3.select(this).property("value");
        d3.select("#year-value").text(currentYear);
        if (dataLoaded) {
            loadWorldMap();
            updateInsights();
        }
    });
    
    d3.select("#play-btn").on("click", function() {
        if (playInterval) {
            clearInterval(playInterval);
            playInterval = null;
            d3.select(this).text("Play");
        } else {
            const currentIdx = years.indexOf(currentYear);
            if (currentIdx >= years.length - 1) {
                currentYear = years[0];
                d3.select("#year-slider").property("value", currentYear);
                d3.select("#year-value").text(currentYear);
                if (dataLoaded) {
                    loadWorldMap();
                    updateInsights();
                }
            }
            
            playInterval = setInterval(() => {
                const idx = years.indexOf(currentYear);
                if (idx < years.length - 1) {
                    currentYear = years[idx + 1];
                    d3.select("#year-slider").property("value", currentYear);
                    d3.select("#year-value").text(currentYear);
                    if (dataLoaded) {
                        loadWorldMap();
                        updateInsights();
                    }
                } else {
                    clearInterval(playInterval);
                    playInterval = null;
                    d3.select("#play-btn").text("Play");
                }
            }, 200);
            d3.select(this).text("Pause");
        }
    });
    document.getElementById("story-mode-btn").addEventListener("click", () => {
        const panel = document.getElementById("story-panel");
        const isHidden = panel.style.display === "none" || panel.style.display === "";
        panel.style.display = isHidden ? "block" : "none";
        if (isHidden) showStoryStep(0);
    });
    
    document.getElementById("story-prev").addEventListener("click", () => {
        if (currentStoryStep > 0) showStoryStep(--currentStoryStep);
    });
    
    document.getElementById("story-next").addEventListener("click", () => {
        if (currentStoryStep < storySteps.length - 1) showStoryStep(++currentStoryStep);
    });
}

window.addEventListener("resize", () => {
    if (dataLoaded) loadWorldMap();
});

setupEventListeners();
loadData();