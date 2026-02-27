// Game State
const state = {
    cookies: 0,
    totalCookies: 0,
    cps: 0,
    items: [
        { id: 'cursor', name: 'Auto-Clicker', cost: 15, baseCps: 0.1, count: 0, icon: '🖱️', description: 'Clicks once every 10 seconds.' },
        { id: 'grandma', name: 'Cookie Grandma', cost: 100, baseCps: 1, count: 0, icon: '👵', description: 'A nice grandma to bake more cookies.' },
        { id: 'farm', name: 'Cookie Farm', cost: 1100, baseCps: 8, count: 0, icon: '🌾', description: 'Grows cookie plants from cookie seeds.' },
        { id: 'mine', name: 'Cookie Mine', cost: 12000, baseCps: 47, count: 0, icon: '⛏️', description: 'Mines out cookie dough and chocolate chips.' },
        { id: 'factory', name: 'Cookie Factory', cost: 130000, baseCps: 260, count: 0, icon: '🏭', description: 'Mass produces high-quality cookies.' },
        { id: 'bank', name: 'Cookie Bank', cost: 1400000, baseCps: 1400, count: 0, icon: '🏦', description: 'Invests in cookie futures.' },
    ],
    upgrades: [
        { id: 'up_cursor', name: 'Reinforced Index Finger', cost: 100, multiplier: 2, target: 'cursor', owned: false, description: 'Cursors are twice as efficient.' },
        { id: 'up_grandma', name: 'Foraging Grandmas', cost: 500, multiplier: 2, target: 'grandma', owned: false, description: 'Grandmas bake twice as much.' },
    ]
};

// DOM Elements
const cookieCountEl = document.getElementById('cookie-count');
const cpsDisplayEl = document.getElementById('cps-display');
const mainCookieBtn = document.getElementById('main-cookie');
const particleContainer = document.getElementById('particle-container');
const shopContainer = document.getElementById('shop-items');
const upgradesContainer = document.getElementById('upgrades-items');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Initial Load
function init() {
    loadGame();
    renderShop();
    renderUpgrades();
    updateDisplay();
    startGameLoop();
    setupEventListeners();
}

function setupEventListeners() {
    mainCookieBtn.addEventListener('mousedown', (e) => {
        // Button 0 is the left mouse button
        if (e.button === 0) {
            state.cookies += 1;
            state.totalCookies += 1;
            createParticle(e.clientX, e.clientY, '+1');
            updateDisplay();
            saveGame();
        }
    });

    // Prevent context menu (right click) on the cookie to keep it clean
    mainCookieBtn.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.tab;
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.add('hidden'));
            btn.classList.add('active');
            document.getElementById(`${target}-tab`).classList.remove('hidden');
        });
    });
}

function updateDisplay() {
    // Animate cookie count
    cookieCountEl.textContent = Math.floor(state.cookies).toLocaleString();
    cpsDisplayEl.textContent = `${state.cps.toFixed(1)} CPS`;

    // Update shop buttons availability - only target items in the shop container
    const shopItems = shopContainer.querySelectorAll('.shop-item');
    shopItems.forEach((itemEl, index) => {
        const item = state.items[index];
        if (item && state.cookies < item.cost) {
            itemEl.classList.add('locked');
        } else if (item) {
            itemEl.classList.remove('locked');
        }
    });

    // Update upgrades availability
    const upgradeItems = upgradesContainer.querySelectorAll('.shop-item');
    upgradeItems.forEach((itemEl, index) => {
        const availableUpgrades = state.upgrades.filter(u => !u.owned);
        const upgrade = availableUpgrades[index];
        if (upgrade && state.cookies < upgrade.cost) {
            itemEl.classList.add('locked');
        } else if (upgrade) {
            itemEl.classList.remove('locked');
        }
    });
}

function renderShop() {
    shopContainer.innerHTML = '';
    state.items.forEach((item, index) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'shop-item';
        itemEl.innerHTML = `
            <div class="item-icon">${item.icon}</div>
            <div class="item-info">
                <h3>${item.name}</h3>
                <p>${item.description}</p>
            </div>
            <div class="item-cost">
                <span class="price">${Math.ceil(item.cost).toLocaleString()} 🍪</span>
                <span class="count">${item.count}</span>
            </div>
        `;
        itemEl.addEventListener('click', () => buyItem(index));
        shopContainer.appendChild(itemEl);
    });
}

function renderUpgrades() {
    upgradesContainer.innerHTML = '';
    state.upgrades.forEach((upgrade, index) => {
        if (upgrade.owned) return;

        const upgradeEl = document.createElement('div');
        upgradeEl.className = 'shop-item'; // Reuse same styles
        upgradeEl.innerHTML = `
            <div class="item-icon">✨</div>
            <div class="item-info">
                <h3>${upgrade.name}</h3>
                <p>${upgrade.description}</p>
            </div>
            <div class="item-cost">
                <span class="price">${upgrade.cost.toLocaleString()} 🍪</span>
            </div>
        `;
        upgradeEl.addEventListener('click', () => buyUpgrade(index));
        upgradesContainer.appendChild(upgradeEl);
    });
}

function buyItem(index) {
    const item = state.items[index];
    if (state.cookies >= item.cost) {
        state.cookies -= item.cost;
        item.count++;
        item.cost = item.cost * 1.15; // Standard price scaling
        calculateCPS();
        renderShop();
        updateDisplay();
        saveGame();
        showToast(`Purchased ${item.name}!`);
    } else {
        showToast(`Not enough cookies!`, 'warning');
    }
}

function buyUpgrade(index) {
    const upgrade = state.upgrades[index];
    if (state.cookies >= upgrade.cost) {
        state.cookies -= upgrade.cost;
        upgrade.owned = true;
        calculateCPS();
        renderUpgrades();
        updateDisplay();
        saveGame();
        showToast(`Level up: ${upgrade.name}!`);
    } else {
        showToast(`Not enough cookies!`, 'warning');
    }
}

function calculateCPS() {
    let totalCps = 0;
    state.items.forEach(item => {
        let itemCps = item.baseCps * item.count;
        // Apply upgrades
        state.upgrades.forEach(up => {
            if (up.owned && up.target === item.id) {
                itemCps *= up.multiplier;
            }
        });
        totalCps += itemCps;
    });
    state.cps = totalCps;
}

function startGameLoop() {
    setInterval(() => {
        if (state.cps > 0) {
            const gainPerTick = state.cps / 10;
            state.cookies += gainPerTick;
            state.totalCookies += gainPerTick;
            updateDisplay();
        }
    }, 100); // 10 ticks per second for smoothness
}

function createParticle(x, y, text) {
    const particle = document.createElement('div');
    particle.className = 'click-particle';
    particle.textContent = text;
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;

    particleContainer.appendChild(particle);

    setTimeout(() => {
        particle.remove();
    }, 800);
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.getElementById('toast-container').appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// Persistence
function saveGame() {
    localStorage.setItem('cookieUniverseSave', JSON.stringify(state));
}

function loadGame() {
    const saved = localStorage.getItem('cookieUniverseSave');
    if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(state, parsed);
        calculateCPS();
    }
}

// Start the game
init();
