/**
 * World Simulator - Agent-Mediated Interactive Visualization
 * 
 * True multi-agent system where world state emerges from agent interactions
 * No random events - all changes come from agent decisions
 */

// ===============================
// Configuration
// ===============================

const CONFIG = {
    defaultSpeed: 800,
    maxSteps: 9999,
};

// ===============================
// Agent Base Class
// ===============================

class Agent {
    constructor(id, name, type) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.beliefs = {};
        this.history = [];
    }
    
    perceive(worldState) {}
    
    decide(worldState) {
        return { action: 'observe', params: {} };
    }
    
    act(decision, worldState) {}
    
    updateBelief(key, value) {
        this.beliefs[key] = { value, updatedAt: Date.now() };
    }
    
    getBelief(key) {
        return this.beliefs[key]?.value ?? null;
    }
    
    addToHistory(event) {
        this.history.push({ ...event, timestamp: Date.now() });
        if (this.history.length > 30) this.history.shift();
    }
}

// ===============================
// Government Agent
// ===============================

class GovernmentAgent extends Agent {
    constructor(region) {
        super(`gov_${region}`, `${region}政府`, 'government');
        this.region = region;
        this.resources = { political_capital: 0.7, reserves: 0.5 };
        this.pressure = 0;
    }
    
    perceive(worldState) {
        const g = worldState.global;
        this.updateBelief('inflation', g.financial.global_inflation / 10);
        this.updateBelief('tension', g.geopolitics.global_tension);
        this.updateBelief('oil_price', g.commodities.oil_brent / 150);
        
        this.pressure = 0;
        if (this.getBelief('inflation') > 0.05) this.pressure += 0.15;
        if (this.getBelief('oil_price') > 0.8) this.pressure += 0.2;
        if (this.getBelief('tension') > 0.6) this.pressure += 0.1;
    }
    
    decide(worldState) {
        const inflation = this.getBelief('inflation');
        const tension = this.getBelief('tension');
        const oilPrice = this.getBelief('oil_price');
        
        if (inflation > 0.06 && this.resources.political_capital > 0.3) {
            return { action: 'raise_rates', params: { amount: 0.0025 }, reason: 'インフレ抑制のため金利引き上げ' };
        }
        if (oilPrice > 0.85 && this.resources.reserves > 0.2) {
            return { action: 'release_reserves', params: { amount: 0.1 }, reason: 'エネルギー価格安定化のため備蓄放出' };
        }
        if (tension > 0.65 && this.resources.political_capital > 0.4) {
            return { action: 'diplomacy', params: {}, reason: '緊張緩和のため外交イニシアチブ' };
        }
        if (this.pressure > 0.4 && this.resources.political_capital > 0.5) {
            return { action: 'stimulus', params: {}, reason: '国内圧力緩和のため経済対策' };
        }
        if (this.resources.political_capital < 0.3) {
            return { action: 'consolidate', params: {}, reason: '政治基盤強化のため静観' };
        }
        return { action: 'observe', params: {}, reason: '現状維持、状況監視中' };
    }
    
    act(decision, worldState) {
        const effects = [];
        switch (decision.action) {
            case 'raise_rates':
                worldState.global.financial.us_interest_rate += decision.params.amount;
                this.resources.political_capital -= 0.05;
                this.pressure -= 0.05;
                effects.push({ type: 'rate_hike', value: decision.params.amount * 100 });
                break;
            case 'release_reserves':
                worldState.global.commodities.oil_brent *= 0.97;
                this.resources.reserves -= decision.params.amount;
                effects.push({ type: 'oil_drop', value: -3 });
                break;
            case 'diplomacy':
                worldState.global.geopolitics.global_tension *= 0.94;
                this.resources.political_capital += 0.02;
                effects.push({ type: 'tension_down', value: -6 });
                break;
            case 'stimulus':
                worldState.economy.growth += 0.01;
                this.resources.political_capital -= 0.1;
                this.pressure -= 0.1;
                effects.push({ type: 'growth_boost', value: 1 });
                break;
            case 'consolidate':
                this.resources.political_capital += 0.03;
                break;
        }
        this.addToHistory(decision);
        return effects;
    }
}

// ===============================
// Investor Agent
// ===============================

class InvestorAgent extends Agent {
    constructor(id, name, riskTolerance = 0.5) {
        super(id, name, 'investor');
        this.riskTolerance = riskTolerance;
        this.portfolio = { stocks: 0.4, bonds: 0.3, commodities: 0.2, cash: 0.1 };
        this.sentiment = 0.5;
    }
    
    perceive(worldState) {
        const g = worldState.global;
        const vix = g.financial.vix;
        const tension = g.geopolitics.global_tension;
        
        this.updateBelief('risk_level', (vix / 40 + tension) / 2);
        this.updateBelief('inflation_pressure', g.financial.global_inflation / 10);
        
        const riskLevel = this.getBelief('risk_level');
        this.sentiment = Math.max(0.1, Math.min(0.9, 
            this.sentiment + (riskLevel > 0.6 ? -0.05 : 0.02)));
    }
    
    decide(worldState) {
        const riskLevel = this.getBelief('risk_level');
        const inflationPressure = this.getBelief('inflation_pressure');
        
        if (riskLevel > 0.7 && this.portfolio.stocks > 0.2) {
            return { action: 'flight_to_safety', params: { amount: 0.1 }, reason: 'リスク回避のため債券へシフト' };
        }
        if (this.sentiment < 0.3 && this.portfolio.cash > 0.1) {
            return { action: 'buy_dip', params: { amount: 0.1 }, reason: '底値での買い場と判断' };
        }
        if (inflationPressure > 0.05 && this.portfolio.commodities < 0.3) {
            return { action: 'inflation_hedge', params: { amount: 0.05 }, reason: 'インフレヘッジでコモディティ購入' };
        }
        if (Math.abs(this.portfolio.stocks - 0.4) > 0.15) {
            return { action: 'rebalance', params: {}, reason: 'ポートフォリオリバランス' };
        }
        return { action: 'hold', params: {}, reason: '現在のポジション維持' };
    }
    
    act(decision, worldState) {
        const effects = [];
        switch (decision.action) {
            case 'flight_to_safety':
                this.portfolio.stocks -= decision.params.amount;
                this.portfolio.bonds += decision.params.amount;
                worldState.global.financial.vix += 3;
                worldState.global.financial.sp500 *= 0.97;
                effects.push({ type: 'market_drop', value: -3 });
                break;
            case 'buy_dip':
                this.portfolio.cash -= decision.params.amount;
                this.portfolio.stocks += decision.params.amount;
                worldState.global.financial.sp500 *= 1.015;
                this.sentiment += 0.05;
                effects.push({ type: 'market_up', value: 1.5 });
                break;
            case 'inflation_hedge':
                this.portfolio.cash -= decision.params.amount;
                this.portfolio.commodities += decision.params.amount;
                worldState.global.commodities.gold *= 1.008;
                effects.push({ type: 'gold_up', value: 0.8 });
                break;
            case 'rebalance':
                const stockDiff = 0.4 - this.portfolio.stocks;
                this.portfolio.stocks += stockDiff * 0.1;
                effects.push({ type: 'rebalance', value: stockDiff > 0 ? 'buying' : 'selling' });
                break;
        }
        this.addToHistory(decision);
        return effects;
    }
}

// ===============================
// Consumer Agent
// ===============================

class ConsumerAgent extends Agent {
    constructor(region) {
        super(`consumer_${region}`, `${region}消費者`, 'consumer');
        this.region = region;
        this.confidence = 0.5;
        this.spending = 0.5;
    }
    
    perceive(worldState) {
        const g = worldState.global;
        const inflation = g.financial.global_inflation / 10;
        const oilPrice = g.commodities.oil_brent / 100;
        
        this.updateBelief('cost_of_living', (inflation + oilPrice * 0.3) / 1.3);
        this.updateBelief('job_security', 0.8);
        
        const costOfLiving = this.getBelief('cost_of_living');
        this.confidence = Math.max(0.1, Math.min(0.9, 0.8 - costOfLiving * 0.3));
    }
    
    decide(worldState) {
        const costOfLiving = this.getBelief('cost_of_living');
        const jobSecurity = this.getBelief('job_security');
        
        if (costOfLiving > 0.6 && this.spending > 0.3) {
            return { action: 'reduce_spending', params: { amount: 0.05 }, reason: '生活費上昇のため支出削減' };
        }
        if (jobSecurity < 0.5 && this.spending > 0.3) {
            return { action: 'save_more', params: { amount: 0.05 }, reason: '雇用不安のため貯蓄増加' };
        }
        if (this.confidence > 0.7 && this.spending < 0.7) {
            return { action: 'increase_spending', params: { amount: 0.03 }, reason: '楽観的見通しで消費拡大' };
        }
        return { action: 'maintain', params: {}, reason: '通常の消費パターン維持' };
    }
    
    act(decision, worldState) {
        const effects = [];
        switch (decision.action) {
            case 'reduce_spending':
                this.spending -= decision.params.amount;
                worldState.economy.consumption -= 0.01;
                this.confidence -= 0.02;
                effects.push({ type: 'consumption_down', value: -1 });
                break;
            case 'save_more':
                this.spending -= decision.params.amount;
                worldState.economy.savings_rate += 0.005;
                effects.push({ type: 'savings_up', value: 0.5 });
                break;
            case 'increase_spending':
                this.spending += decision.params.amount;
                worldState.economy.consumption += 0.01;
                this.confidence += 0.01;
                effects.push({ type: 'consumption_up', value: 1 });
                break;
        }
        this.addToHistory(decision);
        return effects;
    }
}

// ===============================
// Central Bank Agent
// ===============================

class CentralBankAgent extends Agent {
    constructor() {
        super('central_bank', '連邦準備制度', 'central_bank');
        this.rate = 0.0525;
        this.stance = 'neutral';
    }
    
    perceive(worldState) {
        const g = worldState.global;
        const inflation = g.financial.global_inflation / 100;
        const vix = g.financial.vix / 30;
        
        this.updateBelief('inflation_gap', inflation - 0.02);
        this.updateBelief('financial_stress', vix);
        
        const gap = this.getBelief('inflation_gap');
        this.stance = gap > 0.02 ? 'hawkish' : gap < -0.01 ? 'dovish' : 'neutral';
    }
    
    decide(worldState) {
        const gap = this.getBelief('inflation_gap');
        const stress = this.getBelief('financial_stress');
        
        if (this.stance === 'hawkish' && this.rate < 0.07) {
            return { action: 'hike', params: { amount: 0.0025 }, reason: 'インフレ抑制のため利上げ' };
        }
        if (stress > 0.8 && this.rate > 0.02) {
            return { action: 'cut', params: { amount: 0.0025 }, reason: '金融安定化のため利下げ' };
        }
        if (this.stance === 'dovish' && this.rate > 0.02) {
            return { action: 'cut', params: { amount: 0.0025 }, reason: '物価下支えのため緩和' };
        }
        return { action: 'hold', params: {}, reason: '現在の金融政策維持' };
    }
    
    act(decision, worldState) {
        const effects = [];
        switch (decision.action) {
            case 'hike':
                this.rate += decision.params.amount;
                worldState.global.financial.us_interest_rate = this.rate;
                worldState.global.financial.global_inflation *= 0.97;
                worldState.economy.growth -= 0.005;
                effects.push({ type: 'rate_hike', value: decision.params.amount * 100 });
                break;
            case 'cut':
                this.rate -= decision.params.amount;
                worldState.global.financial.us_interest_rate = this.rate;
                worldState.global.financial.global_inflation *= 1.03;
                worldState.economy.growth += 0.005;
                worldState.global.financial.vix *= 0.93;
                effects.push({ type: 'rate_cut', value: -decision.params.amount * 100 });
                break;
        }
        this.addToHistory(decision);
        return effects;
    }
}

// ===============================
// Energy Producer Agent
// ===============================

class EnergyProducerAgent extends Agent {
    constructor(name, capacity) {
        super(`energy_${name}`, name, 'energy_producer');
        this.capacity = capacity;
        this.production = capacity * 0.8;
        this.priceTarget = 75;
    }
    
    perceive(worldState) {
        const oilPrice = worldState.global.commodities.oil_brent;
        const tension = worldState.global.geopolitics.global_tension;
        
        this.updateBelief('price_gap', (oilPrice - this.priceTarget) / this.priceTarget);
        this.updateBelief('supply_risk', tension);
    }
    
    decide(worldState) {
        const priceGap = this.getBelief('price_gap');
        const supplyRisk = this.getBelief('supply_risk');
        
        if (priceGap > 0.3 && this.production < this.capacity) {
            return { action: 'increase_production', params: { amount: 0.05 }, reason: '高価格による生産増加' };
        }
        if (priceGap < -0.2 && this.production > this.capacity * 0.5) {
            return { action: 'decrease_production', params: { amount: 0.05 }, reason: '価格維持のため生産調整' };
        }
        if (supplyRisk > 0.6) {
            return { action: 'hold_inventory', params: {}, reason: '供給リスクのため在庫維持' };
        }
        return { action: 'maintain', params: {}, reason: '現在の生産水準維持' };
    }
    
    act(decision, worldState) {
        const effects = [];
        switch (decision.action) {
            case 'increase_production':
                this.production += this.capacity * decision.params.amount;
                worldState.global.commodities.oil_brent *= 0.97;
                effects.push({ type: 'supply_up', value: 3 });
                break;
            case 'decrease_production':
                this.production -= this.capacity * decision.params.amount;
                worldState.global.commodities.oil_brent *= 1.03;
                effects.push({ type: 'supply_down', value: -3 });
                break;
        }
        this.addToHistory(decision);
        return effects;
    }
}

// ===============================
// Simulation Engine
// ===============================

class WorldSimulator {
    constructor() {
        this.state = {
            global: {
                commodities: { oil_brent: 75.0, natural_gas: 2.8, gold: 2000 },
                financial: { us_interest_rate: 0.0525, global_inflation: 4.2, sp500: 4800, vix: 15 },
                geopolitics: { global_tension: 0.45, nuclear_risk: 0.15 },
            },
            economy: { growth: 0.025, consumption: 0.5, savings_rate: 0.05 },
            domains: {},
        };
        this.agents = [];
        this.step = 0;
        this.history = { oilPrices: [], tensionLevels: [] };
        this.events = [];
        
        this.initAgents();
        this.initDomains();
    }
    
    initAgents() {
        this.agents.push(new GovernmentAgent('usa'));
        this.agents.push(new GovernmentAgent('eu'));
        this.agents.push(new GovernmentAgent('japan'));
        this.agents.push(new CentralBankAgent());
        this.agents.push(new InvestorAgent('inv_hedge', 'ヘッジファンド', 0.8));
        this.agents.push(new InvestorAgent('inv_retail', '個人投資家', 0.4));
        this.agents.push(new ConsumerAgent('usa'));
        this.agents.push(new ConsumerAgent('eu'));
        this.agents.push(new EnergyProducerAgent('opec', 1.0));
        this.agents.push(new EnergyProducerAgent('shale', 0.5));
    }
    
    initDomains() {
        const domains = ['economy', 'politics', 'military', 'environment', 'technology', 'energy', 'society', 'health', 'food', 'information'];
        domains.forEach(d => {
            this.state.domains[d] = { stability: 0.5 + Math.random() * 0.2, growth: Math.random() * 0.3 - 0.1 };
        });
    }
    
    applyShock(scenario) {
        switch (scenario) {
            case 'middle_east_conflict':
                this.state.global.commodities.oil_brent *= 1.4;
                this.state.global.commodities.natural_gas *= 1.3;
                this.state.global.geopolitics.global_tension += 0.2;
                this.state.global.financial.vix *= 2;
                this.addEvent('中東紛争勃発', { oil: '+40%', tension: '+20%' });
                break;
            case 'global_recession':
                this.state.global.financial.sp500 *= 0.7;
                this.state.global.financial.vix *= 3;
                this.state.economy.growth = -0.03;
                this.addEvent('世界恐慌開始', { sp500: '-30%', vix: '+200%' });
                break;
            case 'climate_crisis':
                this.state.global.commodities.oil_brent *= 0.9;
                this.state.domains.food.stability -= 0.2;
                this.addEvent('気候危機発生', { oil: '-10%', food: '不安定化' });
                break;
        }
    }
    
    simulateStep() {
        this.step++;
        
        // All agents perceive
        this.agents.forEach(a => a.perceive(this.state));
        
        // All agents decide and act
        const actions = [];
        this.agents.forEach(a => {
            const decision = a.decide(this.state);
            const effects = a.act(decision, this.state);
            if (!['observe', 'hold', 'maintain'].includes(decision.action)) {
                actions.push({ agent: a.name, action: decision.action, reason: decision.reason, effects });
            }
        });
        
        // Process interactions
        this.processInteractions(actions);
        
        // Natural dynamics
        this.applyDynamics();
        this.updateDomains();
        this.recordHistory();
        
        // Record significant event
        if (actions.length > 0) {
            const top = actions.sort((a, b) => b.effects.length - a.effects.length)[0];
            this.addEvent(top.agent, { action: top.action });
        }
        
        return actions;
    }
    
    processInteractions(actions) {
        const counts = {};
        actions.forEach(a => counts[a.action] = (counts[a.action] || 0) + 1);
        
        if ((counts.hike || 0) >= 2) {
            this.state.global.financial.global_inflation *= 0.94;
        }
        if ((counts.flight_to_safety || 0) >= 2) {
            this.state.global.financial.sp500 *= 0.94;
            this.state.global.financial.vix *= 1.25;
        }
        if ((counts.reduce_spending || 0) >= 2) {
            this.state.economy.consumption *= 0.93;
        }
    }
    
    applyDynamics() {
        const g = this.state.global;
        
        // Mean reversion
        if (g.commodities.oil_brent > 100) g.commodities.oil_brent *= 0.997;
        else if (g.commodities.oil_brent < 60) g.commodities.oil_brent *= 1.003;
        
        if (g.financial.vix > 25) g.financial.vix *= 0.994;
        else if (g.financial.vix < 12) g.financial.vix *= 1.006;
        
        g.geopolitics.global_tension *= 0.997;
        if (g.financial.global_inflation > 3) g.financial.global_inflation *= 0.998;
    }
    
    updateDomains() {
        const g = this.state.global;
        this.state.domains.economy.stability = 0.5 - g.financial.vix / 100;
        this.state.domains.energy.stability = 0.7 - (g.commodities.oil_brent - 75) / 200;
        this.state.domains.politics.stability = 0.6 - g.geopolitics.global_tension * 0.3;
        
        for (const [d, s] of Object.entries(this.state.domains)) {
            if (!['economy', 'energy', 'politics'].includes(d)) {
                s.stability = Math.max(0.2, Math.min(0.8, s.stability + (Math.random() - 0.5) * 0.015));
                s.growth = Math.max(-0.3, Math.min(0.3, s.growth + (Math.random() - 0.5) * 0.015));
            }
        }
    }
    
    addEvent(name, data) {
        this.events.push({ step: this.step, name, data });
        if (this.events.length > 30) this.events.shift();
    }
    
    recordHistory() {
        this.history.oilPrices.push(this.state.global.commodities.oil_brent);
        this.history.tensionLevels.push(this.state.global.geopolitics.global_tension);
        if (this.history.oilPrices.length > 100) {
            this.history.oilPrices.shift();
            this.history.tensionLevels.shift();
        }
    }
}

// ===============================
// UI Integration
// ===============================

let simulator = null;
let isRunning = false;
let updateInterval = null;
let currentScenario = 'middle_east_conflict';

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

const REGION_CONFIG = {
    japan: { flag: '🇯🇵', name: '日本' },
    usa: { flag: '🇺🇸', name: 'アメリカ' },
    china: { flag: '🇨🇳', name: '中国' },
    eu: { flag: '🇪🇺', name: '欧州連合' },
    russia: { flag: '🇷🇺', name: 'ロシア' },
    middle_east: { flag: '🛢️', name: '中東' },
    india: { flag: '🇮🇳', name: 'インド' },
    southeast_asia: { flag: '🌏', name: '東南アジア' },
    africa: { flag: '🌍', name: 'アフリカ' },
    latam: { flag: '🌎', name: '中南米' },
};

document.addEventListener('DOMContentLoaded', () => {
    initUI();
    initCharts();
    initEvents();
    resetSimulation();
});

function initUI() {
    const domainGrid = document.getElementById('domainGrid');
    domainGrid.innerHTML = '';
    for (const [id, c] of Object.entries(DOMAIN_CONFIG)) {
        const card = document.createElement('div');
        card.className = 'domain-card';
        card.id = `domain-${id}`;
        card.innerHTML = `
            <div class="domain-header"><span class="domain-emoji">${c.emoji}</span><span class="domain-name">${c.name}</span></div>
            <div class="domain-indicators">
                <div class="indicator"><span>安定性</span><div class="indicator-bar"><div class="indicator-fill" id="${id}-stability" style="width:50%"></div></div></div>
                <div class="indicator"><span>成長</span><div class="indicator-bar"><div class="indicator-fill" id="${id}-growth" style="width:50%"></div></div></div>
            </div>`;
        domainGrid.appendChild(card);
    }
    
    const regionGrid = document.getElementById('regionGrid');
    regionGrid.innerHTML = '';
    for (const [id, c] of Object.entries(REGION_CONFIG)) {
        const card = document.createElement('div');
        card.className = 'region-card';
        card.id = `region-${id}`;
        card.innerHTML = `<div class="region-flag">${c.flag}</div><div class="region-name">${c.name}</div><div class="region-impact" id="${id}-impact">影響:なし</div>`;
        regionGrid.appendChild(card);
    }
}

function initCharts() {
    const oilCtx = document.getElementById('oilTimeSeries').getContext('2d');
    window.oilChart = new Chart(oilCtx, {
        type: 'line',
        data: { labels: [], datasets: [{ label: '原油価格 ($)', data: [], borderColor: '#4fc3f7', backgroundColor: 'rgba(79, 195, 247, 0.1)', fill: true, tension: 0.4 }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: false, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#a0a0a0' } }, x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#a0a0a0' } } }, plugins: { legend: { display: false } } }
    });
    
    const domainCtx = document.getElementById('domainTimeSeries').getContext('2d');
    window.domainChart = new Chart(domainCtx, {
        type: 'line',
        data: { labels: [], datasets: Object.entries(DOMAIN_CONFIG).map(([id, c]) => ({ label: c.name, data: [], borderColor: c.color, backgroundColor: 'transparent', tension: 0.4 })) },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 1, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#a0a0a0' } }, x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#a0a0a0' } } }, plugins: { legend: { position: 'bottom', labels: { color: '#a0a0a0', boxWidth: 12 } } } }
    });
}

function initEvents() {
    document.getElementById('startBtn').addEventListener('click', startSimulation);
    document.getElementById('pauseBtn').addEventListener('click', pauseSimulation);
    document.getElementById('resetBtn').addEventListener('click', resetSimulation);
    document.getElementById('stepBtn').addEventListener('click', () => runStep());
    document.getElementById('scenario').addEventListener('change', e => { currentScenario = e.target.value; resetSimulation(); });
    document.getElementById('speed').addEventListener('input', e => {
        document.getElementById('speedValue').textContent = `${e.target.value}ms`;
        if (isRunning) { clearInterval(updateInterval); updateInterval = setInterval(runStep, parseInt(e.target.value)); }
    });
}

function resetSimulation() {
    pauseSimulation();
    simulator = new WorldSimulator();
    simulator.applyShock(currentScenario);
    document.getElementById('currentStep').textContent = '0';
    document.getElementById('eventTimeline').innerHTML = '<div class="timeline-empty">シミュレーションを開始してください</div>';
    document.getElementById('agentResponses').innerHTML = '<div class="agent-empty">エージェントの反応がここに表示されます</div>';
    window.oilChart.data.labels = []; window.oilChart.data.datasets[0].data = []; window.oilChart.update();
    window.domainChart.data.labels = []; window.domainChart.data.datasets.forEach(ds => ds.data = []); window.domainChart.update();
    updateDisplay();
}

function startSimulation() {
    if (isRunning) return;
    isRunning = true;
    document.getElementById('startBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
    updateInterval = setInterval(runStep, parseInt(document.getElementById('speed').value));
}

function pauseSimulation() {
    isRunning = false;
    clearInterval(updateInterval);
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
}

function runStep() {
    simulator.simulateStep();
    document.getElementById('currentStep').textContent = simulator.step;
    updateCharts();
    updateDisplay();
    updateTimeline();
    updateAgents();
}

function updateCharts() {
    window.oilChart.data.labels.push(simulator.step);
    window.oilChart.data.datasets[0].data.push(simulator.state.global.commodities.oil_brent);
    if (window.oilChart.data.labels.length > 50) { window.oilChart.data.labels.shift(); window.oilChart.data.datasets[0].data.shift(); }
    window.oilChart.update('none');
    
    window.domainChart.data.labels.push(simulator.step);
    let i = 0;
    for (const s of Object.values(simulator.state.domains)) {
        window.domainChart.data.datasets[i].data.push(s.stability);
        if (window.domainChart.data.datasets[i].data.length > 50) window.domainChart.data.datasets[i].data.shift();
        i++;
    }
    if (window.domainChart.data.labels.length > 50) window.domainChart.data.labels.shift();
    window.domainChart.update('none');
}

function updateDisplay() {
    const g = simulator.state.global;
    document.getElementById('oilBrent').textContent = g.commodities.oil_brent.toFixed(2);
    document.getElementById('naturalGas').textContent = g.commodities.natural_gas.toFixed(2);
    document.getElementById('gold').textContent = g.commodities.gold.toFixed(0);
    document.getElementById('globalInflation').textContent = g.financial.global_inflation.toFixed(1);
    document.getElementById('vix').textContent = g.financial.vix.toFixed(0);
    document.getElementById('usInterestRate').textContent = (g.financial.us_interest_rate * 100).toFixed(2);
    
    const t = g.geopolitics.global_tension;
    document.getElementById('tensionBar').style.width = `${t * 100}%`;
    document.getElementById('tensionValue').textContent = `${(t * 100).toFixed(0)}%`;
    
    const n = g.geopolitics.nuclear_risk;
    document.getElementById('nuclearBar').style.width = `${n * 100}%`;
    document.getElementById('nuclearValue').textContent = `${(n * 100).toFixed(0)}%`;
    
    for (const [id, s] of Object.entries(simulator.state.domains)) {
        const st = document.getElementById(`${id}-stability`);
        const gr = document.getElementById(`${id}-growth`);
        if (st) st.style.width = `${s.stability * 100}%`;
        if (gr) gr.style.width = `${Math.max(0, Math.min(100, 50 + s.growth * 100))}%`;
    }
}

function updateTimeline() {
    const tl = document.getElementById('eventTimeline');
    tl.innerHTML = '';
    simulator.events.slice(-8).forEach(e => {
        const d = document.createElement('div');
        d.className = 'timeline-event';
        if (e.step <= 3) d.classList.add('major');
        d.innerHTML = `<div class="event-time">ステップ ${e.step}</div><div class="event-name">${e.name}</div><div class="event-effects">${Object.entries(e.data || {}).map(([k, v]) => `${k}:${v}`).join(', ') || '—'}</div>`;
        tl.appendChild(d);
    });
    tl.scrollLeft = tl.scrollWidth;
}

function updateAgents() {
    const c = document.getElementById('agentResponses');
    c.innerHTML = '';
    const icons = { government: '🏛️', central_bank: '🏦', investor: '💰', consumer: '👥', energy_producer: '🛢️' };
    const recent = [];
    simulator.agents.forEach(a => {
        if (a.history.length > 0) {
            const last = a.history[a.history.length - 1];
            if (last && !['observe', 'hold', 'maintain'].includes(last.action)) {
                recent.push({ name: a.name, type: a.type, action: last });
            }
        }
    });
    recent.slice(0, 3).forEach(a => {
        const card = document.createElement('div');
        card.className = 'agent-response-card fade-in';
        card.innerHTML = `<div class="agent-header"><span class="agent-icon">${icons[a.type] || '🤖'}</span><span class="agent-role">${a.name}</span></div><div class="agent-action"><div class="action-label">アクション</div><div class="action-value">${a.action.reason || a.action.action}</div></div>`;
        c.appendChild(card);
    });
}
