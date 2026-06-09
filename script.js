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
let worldData = null;

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

// Story step configs: [year, scenario]
const storyStepConfigs = [
    [2015, "ssp245"],   // 0: baseline
    [2015, "ssp245"],   // 1: three paths (no map update needed, shows chart)
    [2030, "ssp245"],   // 2: early divergence
    [2040, "ssp585"],   // 3: arctic ice focus
    [2060, "ssp585"],   // 4: 2°C crossed
    [2060, "ssp126"],   // 5: low 2060 contrast
    [2080, "ssp245"],   // 6: regional inequality
    [2080, "ssp245"],   // 7: thermometer compare
    [2100, "ssp585"],   // 8: high emissions end
    [2100, "ssp126"],   // 9: low emissions end
];

let currentStoryStep = 0;
let storyModeActive = false;

// ---- Mini-map rendering for story sections ----
function getAnomalyColor(anom) {
    if (anom > 5) return "#8e44ad";
    if (anom > 4) return "#e74c3c";
    if (anom > 3) return "#f39c12";
    if (anom > 2) return "#f1c40f";
    if (anom > 1) return "#93c5fd";
    return "#2ecc71";
}

function renderStoryMiniMap(containerId, year, scenario) {
    const container = document.getElementById(containerId);
    if (!container || !worldData || !dataLoaded) return;

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 280;

    container.innerHTML = "";

    const projection = d3.geoNaturalEarth1()
        .scale((width / 630) * 100)
        .translate([width / 2, height / 2]);

    const pathGen = d3.geoPath().projection(projection);

    const svg = d3.select(container).append("svg")
        .attr("width", width).attr("height", height)
        .style("background", "transparent");

    // Ocean
    svg.append("rect").attr("width", width).attr("height", height)
        .attr("fill", "#0a1a30").attr("rx", 0);

    const countries = topojson.feature(worldData, worldData.objects.countries);
    const yearIndex = years.indexOf(year);

    svg.append("g").selectAll("path")
        .data(countries.features)
        .enter().append("path")
        .attr("d", pathGen)
        .attr("fill", d => {
            if (yearIndex === -1) return "#1e3a5a";
            const globalAnom = dataByScenario[scenario][yearIndex];
            const mult = regionalMultipliers[d.properties.name] || DEFAULT_MULTIPLIER;
            return getAnomalyColor(globalAnom * mult);
        })
        .attr("stroke", "#0a1628").attr("stroke-width", 0.4);

    // Subtle color legend
    const legendColors = ["#2ecc71","#93c5fd","#f1c40f","#f39c12","#e74c3c","#8e44ad"];
    const legendLabels = ["<1°","1–2°","2–3°","3–4°","4–5°",">5°"];
    const lg = svg.append("g").attr("transform", `translate(8, ${height - 20})`);
    legendColors.forEach((c, i) => {
        lg.append("rect").attr("x", i * 30).attr("width", 26).attr("height", 7).attr("fill", c).attr("rx", 2);
        lg.append("text").attr("x", i * 30 + 13).attr("y", 17).attr("text-anchor", "middle")
            .attr("fill", "#64748b").attr("font-size", "8px").text(legendLabels[i]);
    });

    // Click to expand
    container.addEventListener("click", () => openMapModal(containerId, year, scenario));
}

// ---- Full-screen interactive map modal ----
function openMapModal(sourceId, year, scenario) {
    const modal = document.getElementById("map-modal");
    const body = document.getElementById("map-modal-body");
    const title = document.getElementById("map-modal-title");

    // Get label from the viz-label sibling element
    const container = document.getElementById(sourceId);
    const vizLabel = container ? container.closest(".story-viz-frame")?.querySelector(".story-viz-label") : null;
    title.textContent = vizLabel ? vizLabel.textContent : `🗺️ ${year} · ${scenario.toUpperCase()}`;

    body.innerHTML = "";
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => renderModalMap(body, year, scenario));
}

function renderModalMap(container, year, scenario) {
    const width = container.clientWidth || 900;
    const height = container.clientHeight || 560;

    const projection = d3.geoNaturalEarth1()
        .scale((width / 630) * 100)
        .translate([width / 2, height / 2]);

    const pathGen = d3.geoPath().projection(projection);

    const svg = d3.select(container).append("svg")
        .attr("width", width).attr("height", height);

    const g = svg.append("g");

    // Ocean bg
    g.append("rect").attr("width", width).attr("height", height)
        .attr("fill", "#0a1a30");

    const countries = topojson.feature(worldData, worldData.objects.countries);
    const yearIndex = years.indexOf(year);

    const tooltip = document.getElementById("modal-tooltip");

    g.selectAll("path")
        .data(countries.features)
        .enter().append("path")
        .attr("d", pathGen)
        .attr("fill", d => {
            if (yearIndex === -1) return "#1e3a5a";
            const globalAnom = dataByScenario[scenario][yearIndex];
            const mult = regionalMultipliers[d.properties.name] || DEFAULT_MULTIPLIER;
            return getAnomalyColor(globalAnom * mult);
        })
        .attr("stroke", "#0a1628")
        .attr("stroke-width", 0.5)
        .attr("cursor", "pointer")
        .on("mousemove", function(event, d) {
            d3.select(this).attr("stroke", "#64b5f6").attr("stroke-width", 2);
            if (yearIndex === -1) return;
            const globalAnom = dataByScenario[scenario][yearIndex];
            const mult = regionalMultipliers[d.properties.name] || DEFAULT_MULTIPLIER;
            const anom = globalAnom * mult;
            const color = getAnomalyColor(anom);
            tooltip.style.display = "block";
            tooltip.style.left = (event.clientX + 16) + "px";
            tooltip.style.top  = (event.clientY - 20) + "px";
            tooltip.style.border = `2px solid ${color}`;
            tooltip.innerHTML = `
                <strong style="color:#e2e8f0">${d.properties.name}</strong><br>
                <span style="color:#94a3b8">Temperature Anomaly:</span> <span style="color:${color};font-weight:700">${anom.toFixed(2)}°C</span><br>
                <span style="color:#94a3b8">Scenario:</span> <span style="color:#cbd5e1">${scenarioNames[scenario]}</span><br>
                <span style="color:#94a3b8">Year:</span> <span style="color:#cbd5e1">${year}</span>
            `;
        })
        .on("mouseleave", function() {
            d3.select(this).attr("stroke", "#0a1628").attr("stroke-width", 0.5);
            tooltip.style.display = "none";
        });

    // Legend
    const legendColors = ["#2ecc71","#93c5fd","#f1c40f","#f39c12","#e74c3c","#8e44ad"];
    const legendLabels = ["<1°","1–2°","2–3°","3–4°","4–5°",">5°"];
    const lg = svg.append("g").attr("transform", `translate(16, ${height - 24})`);
    legendColors.forEach((c, i) => {
        lg.append("rect").attr("x", i * 38).attr("width", 34).attr("height", 8).attr("fill", c).attr("rx", 2);
        lg.append("text").attr("x", i * 38 + 17).attr("y", 20).attr("text-anchor", "middle")
            .attr("fill", "#64748b").attr("font-size", "9px").text(legendLabels[i]);
    });

    // Zoom
    const zoom = d3.zoom()
        .scaleExtent([0.8, 10])
        .on("zoom", (event) => g.attr("transform", event.transform));

    svg.call(zoom);

    // Touch pinch-zoom support is handled natively by D3 zoom
}

function closeMapModal() {
    const modal = document.getElementById("map-modal");
    modal.style.display = "none";
    document.getElementById("modal-tooltip").style.display = "none";
    document.getElementById("map-modal-body").innerHTML = "";
    // Only restore scroll if story overlay is also closed
    if (!storyModeActive) document.body.style.overflow = "";
}

function renderScenarioChart() {
    const container = document.getElementById("story-chart-scenarios");
    if (!container) return;
    container.innerHTML = `
        <div class="scenario-chart-row">
            <div class="scenario-chart-label">
                <span style="color:#27ae60">🌱 SSP1-2.6 (Low)</span>
                <span style="color:#27ae60">~1.5°C by 2100</span>
            </div>
            <div class="scenario-chart-track">
                <div class="scenario-chart-fill low" style="width:30%"></div>
            </div>
        </div>
        <div class="scenario-chart-row">
            <div class="scenario-chart-label">
                <span style="color:#f39c12">⚠️ SSP2-4.5 (Medium)</span>
                <span style="color:#f39c12">~2.7°C by 2100</span>
            </div>
            <div class="scenario-chart-track">
                <div class="scenario-chart-fill medium" style="width:54%"></div>
            </div>
        </div>
        <div class="scenario-chart-row">
            <div class="scenario-chart-label">
                <span style="color:#e74c3c">🔥 SSP5-8.5 (High)</span>
                <span style="color:#e74c3c">~4–5°C by 2100</span>
            </div>
            <div class="scenario-chart-track">
                <div class="scenario-chart-fill high" style="width:90%"></div>
            </div>
        </div>
        <p class="scenario-chart-note">Projected global warming above pre-industrial baseline by 2100 · CMIP6</p>
    `;
}

function renderStoryVisuals() {
    if (!worldData || !dataLoaded) return;

    const mapSteps = [
        { id: "story-map-0",  year: 2015, scenario: "ssp245" },
        { id: "story-map-2",  year: 2030, scenario: "ssp245" },
        { id: "story-map-4",  year: 2060, scenario: "ssp585" },
        { id: "story-map-5",  year: 2060, scenario: "ssp126" },
        { id: "story-map-6",  year: 2080, scenario: "ssp245" },
        { id: "story-map-8",  year: 2100, scenario: "ssp585" },
        { id: "story-map-9",  year: 2100, scenario: "ssp126" },
    ];

    mapSteps.forEach(s => renderStoryMiniMap(s.id, s.year, s.scenario));
    renderScenarioChart();
}

function openStoryOverlay() {
    const overlay = document.getElementById("story-overlay");
    overlay.style.display = "flex";
    overlay.classList.add("visible");
    storyModeActive = true;

    // Show step nav
    document.querySelector(".story-step-nav").style.display = "flex";

    // Render visuals after layout
    requestAnimationFrame(() => {
        setTimeout(() => {
            renderStoryVisuals();
            setupStoryScroll();
            revealSection(0);
        }, 100);
    });

    document.body.style.overflow = "hidden";
}

function closeStoryOverlay() {
    const overlay = document.getElementById("story-overlay");
    overlay.style.display = "none";
    overlay.classList.remove("visible");
    storyModeActive = false;
    document.body.style.overflow = "";
    document.querySelector(".story-step-nav").style.display = "none";
}

function revealSection(index) {
    const sections = document.querySelectorAll(".story-section");
    sections.forEach((s, i) => {
        if (i <= index) s.classList.add("revealed");
    });
    updateStoryProgress(index);
    updateStepDots(index);
}

function updateStoryProgress(stepIndex) {
    const pct = ((stepIndex + 1) / 10) * 100;
    document.getElementById("story-progress-fill").style.width = pct + "%";
    document.getElementById("story-progress-label").textContent = `Step ${stepIndex + 1} of 10`;
}

function updateStepDots(activeIndex) {
    document.querySelectorAll(".story-step-dot").forEach((dot, i) => {
        dot.classList.toggle("active", i === activeIndex);
    });
}

function setupStoryScroll() {
    const container = document.getElementById("story-scroll-container");
    const sections = document.querySelectorAll(".story-section");

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const step = parseInt(entry.target.dataset.step);
                revealSection(step);
            }
        });
    }, { root: container, threshold: 0.3 });

    sections.forEach(s => observer.observe(s));

    // Step dot click
    document.querySelectorAll(".story-step-dot").forEach(dot => {
        dot.addEventListener("click", () => {
            const step = parseInt(dot.dataset.step);
            sections[step].scrollIntoView({ behavior: "smooth" });
        });
    });
}

// Legacy stub so old event listener refs don't break
function showStoryStep(index) { /* replaced by scrollable story */ }

function recolorMap() {
    d3.selectAll(".country")
        .attr("fill", d => getCountryColor(d.properties.name));
}

async function loadData() {
    try {
        const response = await fetch('cmip6_real_data.csv');
        if (!response.ok) throw new Error('CSV file not found');

        const csvText = await response.text();
        const parsed = d3.csvParse(csvText);

        let globalData = parsed;
        if (parsed[0] && parsed[0].hasOwnProperty('region')) {
            globalData = parsed.filter(d => d.region === 'Global' || d.region === 'global');
        }
        if (globalData.length === 0) globalData = parsed;

        years = [...new Set(globalData.map(d => +d.year))].sort((a, b) => a - b);

        const lowAnomalies = {};
        globalData.forEach(d => {
            if (d.scenario === 'ssp126' || d.scenario === 'SSP1-2.6 (Low)') {
                lowAnomalies[+d.year] = +d.anomaly;
            }
        });

        if (Object.keys(lowAnomalies).length === 0) throw new Error('No SSP1-2.6 data found');

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

function updateSidebar() {
    const yearIndex = years.indexOf(currentYear);
    if (yearIndex === -1) return;

    const anomaly = dataByScenario[currentScenario][yearIndex];
    const arcticAnomaly = anomaly * ARCTIC_MULTIPLIER;
    const icePercent = Math.max(0, 100 - (arcticAnomaly / 6) * 100);
    const fillPercent = Math.min(100, (anomaly / 5.5) * 100);

    let tempColor;
    if (anomaly > 5) tempColor = "#8e44ad";
    else if (anomaly > 4) tempColor = "#e74c3c";
    else if (anomaly > 3) tempColor = "#f39c12";
    else if (anomaly > 2) tempColor = "#f1c40f";
    else if (anomaly > 1) tempColor = "#93c5fd";
    else tempColor = "#2ecc71";

    document.getElementById("sidebar-temp").textContent = `${anomaly.toFixed(2)}°C`;
    document.getElementById("sidebar-temp").style.color = tempColor;
    document.getElementById("sidebar-thermo-fill").style.height = `${fillPercent}%`;
    document.getElementById("sidebar-thermo-fill").style.background = tempColor;
    document.getElementById("sidebar-ice").textContent = `${Math.round(icePercent)}%`;
    document.getElementById("sidebar-ice-fill").style.width = `${icePercent}%`;
}

let currentSlide = 1;

function goToSlide(n) {
    const prev = document.getElementById(`slide-${currentSlide}`);
    const next = document.getElementById(`slide-${n}`);
    const dots = document.querySelectorAll(".dot");

    prev.classList.add("exit");
    setTimeout(() => { prev.classList.remove("active", "exit"); }, 600);
    setTimeout(() => { next.classList.add("active"); }, 300);

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
            openStoryOverlay();
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
        if (!worldData) {
            worldData = await d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json");
        }
        const world = worldData;

        const width = document.getElementById('chart').clientWidth;
        const height = 550;

        d3.select("#chart").html("");
        document.querySelectorAll(".fs-btn").forEach(b => b.remove());

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

        const projection = d3.geoMercator()
            .scale(width / (2.2 * Math.PI))
            .translate([width / 2, height / 1.3]);

        const pathGenerator = d3.geoPath().projection(projection);

        const svgEl = d3.select("#chart")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        const g = svgEl.append("g");
        const zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on("zoom", (event) => { g.attr("transform", event.transform); });

        svgEl.call(zoom);

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

        updateSidebar();
        updateInsights();
        if (storyModeActive) renderStoryVisuals();

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
                if (dataLoaded) { loadWorldMap(); updateInsights(); }
            }

            playInterval = setInterval(() => {
                const idx = years.indexOf(currentYear);
                if (idx < years.length - 1) {
                    currentYear = years[idx + 1];
                    d3.select("#year-slider").property("value", currentYear);
                    d3.select("#year-value").text(currentYear);
                    if (dataLoaded) { loadWorldMap(); updateInsights(); }
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
        openStoryOverlay();
    });

    document.getElementById("story-exit-btn").addEventListener("click", () => {
        closeStoryOverlay();
    });

    document.getElementById("story-explore-cta").addEventListener("click", () => {
        closeStoryOverlay();
        setTimeout(() => {
            document.querySelector(".controls").scrollIntoView({ behavior: "smooth" });
        }, 200);
    });

    // Map modal close
    document.getElementById("map-modal-close").addEventListener("click", closeMapModal);
    document.getElementById("map-modal-backdrop").addEventListener("click", closeMapModal);
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            const modal = document.getElementById("map-modal");
            if (modal.style.display !== "none") closeMapModal();
        }
    });
}

window.addEventListener("resize", () => {
    if (dataLoaded) loadWorldMap();
});

setupEventListeners();
loadData();