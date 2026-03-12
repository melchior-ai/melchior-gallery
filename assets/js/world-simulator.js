/**
 * World Simulator - Interactive Visualization
 * 
 * Multi-layer global simulation system with real-time visualization
 */

// ===============================
// Configuration & State
// ===============================

const CONFIG = {
    defaultSpeed: 500,
    maxSteps: 12,
    updateInterval: null,
};

let state = {
    isRunning: false,
    currentStep: 0,
    speed: CONFIG.defaultSpeed,
    scenario: 'middle_east_conflict',
    history: {
        oilPrices: [],
        tensionLevels: [],
        domainStates: {},
    },
    globalState: {
        commodities: {
            oil_brent: 75.0,
            oil_wti: 72.0,
            natural_gas: 2.8,
            gold: 2000,
            copper: 8500,
            wheat: 280,
        },
        financial: {
            us_interest_rate: 5.25,
            us_10y_yield: 4.5,
            dollar_index: 102,
            global_inflation: 4.2,
            sp500: 4800,
            vix: 15,
        },
        geopolitics: {
            global_tension: 0.45,
            nuclear_risk: 0.15,
            cyber_threat: 0.60,
        },
        environment: {
            global_temp: 1.2,
            extreme_events: 0.65,
        },
    },
    domains: {},
    events: [],
    agentResponses: [],
};

// Domain configurations
const DOMAIN_CONFIG = {
    economy: { emoji: '💰', name: '経済', color: '#4CAF50' },
    politics: { emoji: '🏛️', name: '政治', color: '#9C27B0' },
    military: { emoji: '⚔️', name: '軍事', color: '#F44336' },
    environment: { emoji: '🌍', name: '環境', color: '#2196F3' },
    technology: { emoji: '💻', name: '技術', color: '#00BCD4' },
    energy: { emoji: '⚡', name: 'エネルギー', color: '#FF9800' },
    society: { emoji: '👥', name: '社会', color: '#E91E63' },
    health: { emoji: '🏥', name: '健康', color: '#4CAF50' },
    food: { emoji: '🌾', name: '食料', color: '#8BC34A' },
    information: { emoji: '📡', name: '情報', color: '#3F51B5' },
};

// Region configurations
const REGION_CONFIG = {
    japan: { flag: '🇯🇵', name: '日本', baseImpact: 0 },
    usa: { flag: '🇺🇸', name: 'アメリカ', baseImpact: 0 },
    china: { flag: '🇨🇳', name: '中国', baseImpact: 0 },
    eu: { flag: '🇪🇺', name: '欧州連合', baseImpact: 0 },
    russia: { flag: '🇷🇺', name: 'ロシア', baseImpact: 0 },
    middle_east: { flag: '🛢️', name: '中東', baseImpact: 0 },
    india: { flag: '🇮🇳', name: 'インド', baseImpact: 0 },
    southeast_asia: { flag: '🌏', name: '東南アジア', baseImpact: 0 },
    africa: { flag: '🌍', name: 'アフリカ', baseImpact: 0 },
    latam: { flag: '🌎', name: '中南米', baseImpact: 0 },
};

// Scenario configurations
const SCENARIO_CONFIG = {
    middle_east_conflict: {
        name: '中東紛争シナリオ',
        description: '中東での軍事紛争が世界経済とエネルギー供給に与える影響',
        trigger: { type: 'military_conflict', region: 'middle_east' },
        steps: [
            { time: 0, event: '紛争勃発', effects: { oil: 1.4, tension: 0.15 } },
            { time: 1, event: '原油価格急騰', effects: { oil: 1.1, inflation: 0.5 } },
            { time: 2, event: '市場混乱', effects: { vix: 1.5, sp500: 0.95 } },
            { time: 3, event: '政策対応', effects: { interest: 0.25 } },
            { time: 4, event: '消費者不安', effects: { confidence: -0.1 } },
            { time: 5, event: '代替エネルギー注目', effects: { renewable: 0.1 } },
            { time: 6, event: '外交努力', effects: { tension: -0.05 } },
            { time: 7, event: '供給網適応', effects: { supply_chain: 0.05 } },
            { time: 8, event: '新均衡形成', effects: {} },
            { time: 9, event: '長期影響顕在化', effects: { structural: 0.1 } },
            { time: 10, event: '市場安定化', effects: { vix: 0.8 } },
            { time: 11, event: '新常態', effects: { new_normal: true } },
        ],
        regionImpacts: {
            japan: { energy: -0.15, inflation: 1.2, trade: -0.08 },
            usa: { inflation: 0.8, energy: 0.05, military: 0.1 },
            eu: { energy: -0.20, inflation: 1.5, manufacturing: -0.10 },
            china: { energy_costs: 0.25, influence: 0.05 },
            india: { energy_crisis: 0.30, growth: -1.5 },
        },
    },
    global_recession: {
        name: '世界恐慌シナリオ',
        description: '金融危機から始まる世界的な景気後退',
        trigger: { type: 'market_crash', region: 'usa' },
        steps: [
            { time: 0, event: '株式暴落', effects: { sp500: 0.7, vix: 3.0 } },
            { time: 1, event: '金融セクター危機', effects: { banking: -0.3 } },
            { time: 2, event: '失業急増', effects: { unemployment: 3.0 } },
            { time: 3, event: '社会不安', effects: { cohesion: -0.2 } },
            { time: 4, event: '政府介入', effects: { stimulus: true } },
            { time: 5, event: '国際協調', effects: { cooperation: 0.1 } },
        ],
        regionImpacts: {
            usa: { gdp: -3.0, unemployment: 5.0 },
            eu: { gdp: -2.5, unemployment: 4.0 },
            china: { gdp: -1.5, exports: -15 },
            japan: { gdp: -2.0, exports: -12 },
        },
    },
    climate_crisis: {
        name: '気候危機シナリオ',
        description: '気候変動の加速による極端な気象イベント',
        trigger: { type: 'natural_disaster', region: 'global' },
        steps: [
            { time: 0, event: '極端気象増加', effects: { extreme_events: 0.2 } },
            { time: 1, event: '食料危機', effects: { food_prices: 1.5 } },
            { time: 2, event: '気候移民', effects: { migration: 0.2 } },
            { time: 3, event: '経済被害', effects: { gdp: -1.0 } },
            { time: 4, event: '政策転換', effects: { green_policy: true } },
            { time: 5, event: '技術加速', effects: { renewable: 0.15 } },
        ],
        regionImpacts: {
            africa: { food_security: -0.30, water_stress: 0.20 },
            southeast_asia: { flood_damage: 0.5, agriculture: -0.20 },
            india: { heatwaves: 0.8, water_crisis: 0.5 },
        },
    },
};

// ===============================
// Initialization
// ===============================

document.addEventListener('DOMContentLoaded', () => {
    initializeUI();
    initializeCharts();
    initializeEventListeners();
    updateDisplay();
});

function initializeUI() {
    // Initialize domain grid
    const domainGrid = document.getElementById('domainGrid');
    domainGrid.innerHTML = '';
    
    for (const [id, config] of Object.entries(DOMAIN_CONFIG)) {
        state.domains[id] = {
            stability: 0.5 + Math.random() * 0.3,
            growth: Math.random() * 0.4 - 0.2,
            risk: Math.random() * 0.3,
        };
        
        const card = createDomainCard(id, config);
        domainGrid.appendChild(card);
    }
    
    // Initialize region grid
    const regionGrid = document.getElementById('regionGrid');
    regionGrid.innerHTML = '';
    
    for (const [id, config] of Object.entries(REGION_CONFIG)) {
        const card = createRegionCard(id, config);
        regionGrid.appendChild(card);
    }
}

function createDomainCard(id, config) {
    const card = document.createElement('div');
    card.className = 'domain-card';
    card.id = `domain-${id}`;
    card.innerHTML = `
        <div class="domain-header">
            <span class="domain-emoji">${config.emoji}</span>
            <span class="domain-name">${config.name}</span>
        </div>
        <div class="domain-indicators">
            <div class="indicator">
                <span>安定性</span>
                <div class="indicator-bar">
                    <div class="indicator-fill" id="${id}-stability" style="width: 50%"></div>
                </div>
            </div>
            <div class="indicator">
                <span>成長</span>
                <div class="indicator-bar">
                    <div class="indicator-fill" id="${id}-growth" style="width: 50%"></div>
                </div>
            </div>
        </div>
    `;
    return card;
}

function createRegionCard(id, config) {
    const card = document.createElement('div');
    card.className = 'region-card';
    card.id = `region-${id}`;
    card.innerHTML = `
        <div class="region-flag">${config.flag}</div>
        <div class="region-name">${config.name}</div>
        <div class="region-impact" id="${id}-impact">影響: なし</div>
    `;
    return card;
}

function initializeCharts() {
    // Oil price time series
    const oilCtx = document.getElementById('oilTimeSeries').getContext('2d');
    window.oilChart = new Chart(oilCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '原油価格 ($)',
                data: [],
                borderColor: '#4fc3f7',
                backgroundColor: 'rgba(79, 195, 247, 0.1)',
                fill: true,
                tension: 0.4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: '#a0a0a0' },
                },
                x: {
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: '#a0a0a0' },
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
    
    // Domain state time series
    const domainCtx = document.getElementById('domainTimeSeries').getContext('2d');
    window.domainChart = new Chart(domainCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: Object.entries(DOMAIN_CONFIG).map(([id, config]) => ({
                label: config.name,
                data: [],
                borderColor: config.color,
                backgroundColor: 'transparent',
                tension: 0.4,
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    min: 0,
                    max: 1,
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: '#a0a0a0' },
                },
                x: {
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: '#a0a0a0' },
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#a0a0a0', boxWidth: 12 }
                }
            }
        }
    });
}

function initializeEventListeners() {
    document.getElementById('startBtn').addEventListener('click', startSimulation);
    document.getElementById('pauseBtn').addEventListener('click', pauseSimulation);
    document.getElementById('resetBtn').addEventListener('click', resetSimulation);
    document.getElementById('stepBtn').addEventListener('click', stepSimulation);
    document.getElementById('scenario').addEventListener('change', (e) => {
        state.scenario = e.target.value;
        resetSimulation();
    });
    document.getElementById('speed').addEventListener('input', (e) => {
        state.speed = parseInt(e.target.value);
        document.getElementById('speedValue').textContent = `${state.speed}ms`;
        if (state.isRunning) {
            clearInterval(CONFIG.updateInterval);
            CONFIG.updateInterval = setInterval(simulationStep, state.speed);
        }
    });
}

// ===============================
// Simulation Control
// ===============================

function startSimulation() {
    if (state.isRunning) return;
    
    state.isRunning = true;
    document.getElementById('startBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
    
    CONFIG.updateInterval = setInterval(simulationStep, state.speed);
}

function pauseSimulation() {
    if (!state.isRunning) return;
    
    state.isRunning = false;
    clearInterval(CONFIG.updateInterval);
    
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
}

function resetSimulation() {
    pauseSimulation();
    
    state.currentStep = 0;
    state.events = [];
    state.agentResponses = [];
    state.history = {
        oilPrices: [],
        tensionLevels: [],
        domainStates: {},
    };
    
    // Reset global state
    state.globalState = {
        commodities: {
            oil_brent: 75.0,
            natural_gas: 2.8,
            gold: 2000,
        },
        financial: {
            global_inflation: 4.2,
            vix: 15,
        },
        geopolitics: {
            global_tension: 0.45,
            nuclear_risk: 0.15,
        },
    };
    
    // Reset charts
    window.oilChart.data.labels = [];
    window.oilChart.data.datasets[0].data = [];
    window.oilChart.update();
    
    window.domainChart.data.labels = [];
    window.domainChart.data.datasets.forEach(ds => ds.data = []);
    window.domainChart.update();
    
    // Clear timeline
    document.getElementById('eventTimeline').innerHTML = '<div class="timeline-empty">シミュレーションを開始してください</div>';
    
    // Clear agent responses
    document.getElementById('agentResponses').innerHTML = '<div class="agent-empty">エージェントの反応がここに表示されます</div>';
    
    updateDisplay();
}

function stepSimulation() {
    if (state.currentStep >= CONFIG.maxSteps) {
        pauseSimulation();
        return;
    }
    
    simulationStep();
}

function simulationStep() {
    state.currentStep++;
    document.getElementById('currentStep').textContent = state.currentStep;
    
    const scenario = SCENARIO_CONFIG[state.scenario];
    const stepData = scenario.steps[Math.min(state.currentStep - 1, scenario.steps.length - 1)];
    
    if (stepData) {
        // Apply effects
        applyEffects(stepData.effects);
        
        // Add event to timeline
        addEventToTimeline(state.currentStep, stepData.event, stepData.effects);
        
        // Generate agent responses
        generateAgentResponses(stepData);
        
        // Update region impacts
        updateRegionImpacts(scenario.regionImpacts, state.currentStep);
    }
    
    // Update charts
    updateCharts();
    
    // Update display
    updateDisplay();
}

// ===============================
// Effect Application
// ===============================

function applyEffects(effects) {
    if (!effects) return;
    
    // Oil price
    if (effects.oil) {
        const oldValue = state.globalState.commodities.oil_brent;
        state.globalState.commodities.oil_brent *= effects.oil;
        animateValue('oilBrent', oldValue, state.globalState.commodities.oil_brent);
    }
    
    // Tension
    if (effects.tension) {
        state.globalState.geopolitics.global_tension = Math.min(1, 
            state.globalState.geopolitics.global_tension + effects.tension);
    }
    
    // Inflation
    if (effects.inflation) {
        state.globalState.financial.global_inflation += effects.inflation;
        animateValue('globalInflation', 
            state.globalState.financial.global_inflation - effects.inflation,
            state.globalState.financial.global_inflation);
    }
    
    // VIX
    if (effects.vix) {
        state.globalState.financial.vix *= effects.vix;
    }
    
    // Update domain states
    for (const [domainId, domainState] of Object.entries(state.domains)) {
        // Add some random variation
        domainState.stability = Math.max(0, Math.min(1, 
            domainState.stability + (Math.random() - 0.5) * 0.1));
        domainState.growth = Math.max(-1, Math.min(1, 
            domainState.growth + (Math.random() - 0.5) * 0.15));
    }
}

function animateValue(elementId, oldValue, newValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const card = element.closest('.metric-card');
    if (card) {
        card.classList.add('updating');
        setTimeout(() => card.classList.remove('updating'), 500);
    }
    
    element.textContent = newValue.toFixed(2);
}

// ===============================
// Timeline & Events
// ===============================

function addEventToTimeline(step, eventName, effects) {
    const timeline = document.getElementById('eventTimeline');
    
    // Remove empty message if present
    const emptyMsg = timeline.querySelector('.timeline-empty');
    if (emptyMsg) emptyMsg.remove();
    
    const eventDiv = document.createElement('div');
    eventDiv.className = 'timeline-event';
    if (step <= 2) eventDiv.classList.add('major');
    
    const effectsList = Object.entries(effects || {})
        .map(([k, v]) => `${k}: ${typeof v === 'number' ? (v > 1 ? `×${v}` : `${(v * 100).toFixed(0)}%`) : v}`)
        .join(', ');
    
    eventDiv.innerHTML = `
        <div class="event-time">ステップ ${step}</div>
        <div class="event-name">${eventName}</div>
        <div class="event-effects">${effectsList || '影響なし'}</div>
    `;
    
    timeline.appendChild(eventDiv);
    timeline.scrollLeft = timeline.scrollWidth;
    
    state.events.push({ step, name: eventName, effects });
}

// ===============================
// Agent Responses
// ===============================

function generateAgentResponses(stepData) {
    const responses = [
        {
            role: '政府',
            icon: '🏛️',
            action: getGovernmentAction(stepData),
            reasoning: getGovernmentReasoning(stepData),
        },
        {
            role: '消費者',
            icon: '👥',
            action: getConsumerAction(stepData),
            reasoning: getConsumerReasoning(stepData),
        },
        {
            role: '投資家',
            icon: '💰',
            action: getInvestorAction(stepData),
            reasoning: getInvestorReasoning(stepData),
        },
    ];
    
    const container = document.getElementById('agentResponses');
    
    // Remove empty message
    const emptyMsg = container.querySelector('.agent-empty');
    if (emptyMsg) emptyMsg.remove();
    
    responses.forEach(response => {
        const card = document.createElement('div');
        card.className = 'agent-response-card fade-in';
        card.innerHTML = `
            <div class="agent-header">
                <span class="agent-icon">${response.icon}</span>
                <span class="agent-role">${response.role}</span>
            </div>
            <div class="agent-action">
                <div class="action-label">アクション</div>
                <div class="action-value">${response.action}</div>
            </div>
            <div class="agent-reasoning">"${response.reasoning}"</div>
        `;
        container.insertBefore(card, container.firstChild);
    });
    
    // Keep only last 6 responses
    while (container.children.length > 6) {
        container.removeChild(container.lastChild);
    }
}

function getGovernmentAction(stepData) {
    if (stepData.effects?.oil > 1.2) return '戦略備蓄放出を検討';
    if (stepData.effects?.vix > 2) return '市場安定化措置を実施';
    if (stepData.effects?.tension > 0.1) return '外交チャネルを通じて調整';
    return '状況を監視中';
}

function getGovernmentReasoning(stepData) {
    if (stepData.effects?.oil > 1.2) return 'エネルギー安全保障が優先事項';
    if (stepData.effects?.vix > 2) return '市場の信頼回復が必要';
    return '現時点では介入の必要なし';
}

function getConsumerAction(stepData) {
    if (stepData.effects?.oil > 1.2) return 'エネルギー消費を削減';
    if (stepData.effects?.inflation > 0.3) return '支出を見直し';
    return '通常の消費活動を継続';
}

function getConsumerReasoning(stepData) {
    if (stepData.effects?.oil > 1.2) return '光熱費の上昇が懸念';
    if (stepData.effects?.inflation > 0.3) return '物価上昇に備えて節約';
    return '大きな変化は感じない';
}

function getInvestorAction(stepData) {
    if (stepData.effects?.vix > 2) return '安全資産へシフト';
    if (stepData.effects?.sp500 < 1) return 'ポートフォリオを再調整';
    if (stepData.effects?.oil > 1.2) return 'エネルギー株に関心';
    return '現在のポジションを維持';
}

function getInvestorReasoning(stepData) {
    if (stepData.effects?.vix > 2) return 'ボラティリティが高すぎる';
    if (stepData.effects?.sp500 < 1) return 'リスク管理が優先';
    if (stepData.effects?.oil > 1.2) return 'セクターローテーションの機会';
    return '明確なシグナルなし';
}

// ===============================
// Region Impacts
// ===============================

function updateRegionImpacts(impacts, step) {
    const impactStrength = Math.min(1, step / 6);
    
    for (const [regionId, regionImpacts] of Object.entries(impacts)) {
        const card = document.getElementById(`region-${regionId}`);
        if (!card) continue;
        
        const impactElement = document.getElementById(`${regionId}-impact`);
        if (!impactElement) continue;
        
        const totalImpact = Object.values(regionImpacts).reduce((a, b) => Math.abs(a) + Math.abs(b), 0);
        const normalizedImpact = totalImpact * impactStrength;
        
        card.classList.remove('impact-high', 'impact-medium', 'impact-low');
        
        if (normalizedImpact > 1) {
            card.classList.add('impact-high');
            impactElement.textContent = `影響: 大きい`;
        } else if (normalizedImpact > 0.5) {
            card.classList.add('impact-medium');
            impactElement.textContent = `影響: 中程度`;
        } else if (normalizedImpact > 0) {
            card.classList.add('impact-low');
            impactElement.textContent = `影響: 小`;
        }
    }
}

// ===============================
// Charts Update
// ===============================

function updateCharts() {
    // Update oil chart
    window.oilChart.data.labels.push(`Step ${state.currentStep}`);
    window.oilChart.data.datasets[0].data.push(state.globalState.commodities.oil_brent);
    window.oilChart.update('none');
    
    // Update domain chart
    window.domainChart.data.labels.push(`Step ${state.currentStep}`);
    
    let i = 0;
    for (const [domainId, domainState] of Object.entries(state.domains)) {
        window.domainChart.data.datasets[i].data.push(domainState.stability);
        i++;
    }
    window.domainChart.update('none');
}

// ===============================
// Display Update
// ===============================

function updateDisplay() {
    // Update metrics
    document.getElementById('oilBrent').textContent = 
        state.globalState.commodities.oil_brent.toFixed(2);
    document.getElementById('naturalGas').textContent = 
        state.globalState.commodities.natural_gas.toFixed(2);
    document.getElementById('gold').textContent = 
        state.globalState.commodities.gold.toFixed(0);
    document.getElementById('globalInflation').textContent = 
        state.globalState.financial.global_inflation.toFixed(1);
    document.getElementById('vix').textContent = 
        state.globalState.financial.vix.toFixed(0);
    document.getElementById('usInterestRate').textContent = 
        state.globalState.financial.us_interest_rate.toFixed(2);
    
    // Update tension bars
    const tension = state.globalState.geopolitics.global_tension;
    document.getElementById('tensionBar').style.width = `${tension * 100}%`;
    document.getElementById('tensionValue').textContent = `${(tension * 100).toFixed(0)}%`;
    
    const nuclear = state.globalState.geopolitics.nuclear_risk;
    document.getElementById('nuclearBar').style.width = `${nuclear * 100}%`;
    document.getElementById('nuclearValue').textContent = `${(nuclear * 100).toFixed(0)}%`;
    
    // Update domain indicators
    for (const [domainId, domainState] of Object.entries(state.domains)) {
        const stabilityEl = document.getElementById(`${domainId}-stability`);
        const growthEl = document.getElementById(`${domainId}-growth`);
        
        if (stabilityEl) {
            stabilityEl.style.width = `${domainState.stability * 100}%`;
        }
        if (growthEl) {
            const growthWidth = 50 + domainState.growth * 50;
            growthEl.style.width = `${Math.max(0, Math.min(100, growthWidth))}%`;
        }
    }
    
    // Update metric changes
    updateMetricChanges();
}

function updateMetricChanges() {
    const oilChange = ((state.globalState.commodities.oil_brent / 75.0) - 1) * 100;
    const oilChangeEl = document.querySelector('#oil-brent .metric-change');
    if (oilChangeEl) {
        oilChangeEl.textContent = `${oilChange >= 0 ? '+' : ''}${oilChange.toFixed(1)}%`;
        oilChangeEl.className = `metric-change ${oilChange >= 0 ? 'positive' : 'negative'}`;
    }
}
