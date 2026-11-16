//=====================
//CONFIGURAÇÃO INICIAL
//=====================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const spaceGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
spaceGradient.addColorStop(0, "#260e09");
spaceGradient.addColorStop(0.45, "#120806");
spaceGradient.addColorStop(1, "#080504");
const HUD_FONT = '"Courier New", "Lucida Console", monospace';
const TITLE_FONT = '"Impact", "Arial Black", "Franklin Gothic Bold", sans-serif';
const PALETTE = {
    accent: "#e0532f",
    accentBright: "#ffcf8f",
    amber: "#a3502e",
    violet: "#8c2a1a",
    pink: "#7d1f14",
    text: "#e6d5b3",
    muted: "#8f7c63",
    panel: "rgba(14, 10, 9, 0.97)",
    panelLight: "rgba(28, 16, 13, 0.98)",
    line: "rgba(143, 92, 62, 0.65)",
};

const keys = {};

let score = 0;
let soundEnabled = true;
let audioContext = null;
let gameOver = false;
let gameWon = false;
let paused = false;
let gameStarted = false;
let shopOpen = false;
let catalogOpen = false;
let wave = 1;
let lives = 3;
let playerInvulnerableUntil = 0;
let nextPlayerShotAt = 0;
let nextEnemyShotAt = 0;
let rapidFireLevel = 0;
let spreadShotLevel = 0;
let speedLevel = 0;
let creditLevel = 0;
let pulseLevel = 0;
let missileLevel = 0;
let shieldCharges = 0;
let frameScale = 1;
const pickups = [];
const particles = [];
const popups = [];
let combo = 0;
let comboExpiresAt = 0;
let shakeUntil = 0;
let hurtFlashUntil = 0;
let waveBanner = null;
let nextObstacleRegenAt = 0;
const PODIUM_KEY = "voidFrontierPodium";
let podiumScores = [];
let podiumOpen = false;
let podiumReturn = "menu";
let playerName = [];
let scoreSaved = false;
let lastEntryId = 0;
let previousFrameTime = 0;
const MAX_LIVES = 5;
const MAX_PLAYER_BULLETS = 90;
const MAX_ENEMY_BULLETS = 60;
const MAX_OBSTACLE_HEALTH = 12;
const stars = Array.from({ length: 64 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 0.5,
    speed: Math.random() * 1.2 + 0.3,
    opacity: Math.random() * 0.7 + 0.3,
}));

//=====================
//JOGADOR
//=====================

const player = {
    width: 58,
    height: 34,
    speed: 5,
    x: canvas.width / 2 - 25,
    y: canvas.height - 70,
};
const playerSkins = {
    default: {
        name: "MARINE",
        style: "fighter",
        hull: "#7a8a4a",
        trim: "#e6d5b3",
        wing: "#4a4536",
        engine: "#e0532f",
        perk: "EQUILIBRADA: desempenho estável em tudo",
        speedBonus: 0,
        speedPenalty: 0,
        hitScale: 1,
        maxHits: 1,
        creditBonus: 1,
        dropBonus: 0,
        fireFloor: 0,
    },
    neon: {
        name: "FANTASMA",
        style: "sleek",
        hull: "#4fae9e",
        trim: "#dffce9",
        wing: "#2c5a52",
        engine: "#4fae9e",
        perk: "ÁGIL: +velocidade, hitbox 40% menor",
        speedBonus: 1.1,
        speedPenalty: 0,
        hitScale: 0.6,
        maxHits: 1,
        creditBonus: 1,
        dropBonus: 0,
        fireFloor: 35,
    },
    crimson: {
        name: "MARAUDER",
        style: "heavy",
        hull: "#c23a26",
        trim: "#ffd9a0",
        wing: "#5c1a12",
        engine: "#e8662a",
        perk: "DEMOLIDORA: perfura 2 alvos, mas é lenta",
        speedBonus: 0,
        speedPenalty: 1.1,
        hitScale: 1.15,
        maxHits: 2,
        creditBonus: 1,
        dropBonus: 0,
        fireFloor: 0,
    },
    gold: {
        name: "SERAFIM",
        style: "royal",
        hull: "#cf9a3f",
        trim: "#ffe9b0",
        wing: "#6b4a1e",
        engine: "#ffcf8f",
        perk: "OPULENTE: +25% créditos e +25% de itens",
        speedBonus: 0,
        speedPenalty: 0,
        hitScale: 0.9,
        maxHits: 1,
        creditBonus: 1.25,
        dropBonus: 0.25,
        fireFloor: 0,
    },
};
const ownedSkins = new Set(["default"]);
let selectedSkin = "default";
const PLAYER_TOP_BOUNDARY = 86;

//=====================
//TIROS
//=====================

const bullets = [];
const enemyBullets = [];
const obstacles = [];
const bulletSpeed = 10;
let shotSequence = 0;
const shopItems = [
    { id: "rapid", title: "TIRO RÁPIDO", description: "Dispara 85ms mais rápido por nível (4)", baseCost: 100, group: "ARSENAL", color: "#e0532f" },
    { id: "spread", title: "TIRO TRIPLO", description: "Nível 1: 3 tiros · Nível 2: 5 tiros", baseCost: 150, group: "ARSENAL", color: "#e0532f" },
    { id: "pulse", title: "CANHÃO DE PULSO", description: "Tiro perfurante extra (3 níveis)", baseCost: 240, group: "ARSENAL", color: "#e0532f" },
    { id: "missile", title: "MÍSSIL GUIADO", description: "A cada 3 tiros, um míssil teleguiado", baseCost: 280, group: "ARSENAL", color: "#e0532f" },
    { id: "shield", title: "ESCUDO", description: "Absorve 1 impacto · empilha até 3", baseCost: 160, group: "SOBREVIVÊNCIA", color: "#4f9e63" },
    { id: "life", title: "VIDA EXTRA", description: "Restaura 1 vida (máximo de 5)", baseCost: 200, group: "SOBREVIVÊNCIA", color: "#4f9e63" },
    { id: "speed", title: "BOTAS DE FÚRIA", description: "+0,8 de velocidade por nível (3)", baseCost: 130, group: "MELHORIAS", color: "#7f93a8" },
    { id: "credits", title: "BÔNUS DE CRÉDITOS", description: "+25% de créditos por inimigo (3)", baseCost: 180, group: "MELHORIAS", color: "#7f93a8" },
    { id: "skin-neon", title: "SKIN FANTASMA", description: "+velocidade, hitbox 40% menor, tiros mais rápidos", baseCost: 220, group: "NAVES", color: "#d9a44a" },
    { id: "skin-crimson", title: "SKIN MARAUDER", description: "Tiro perfura 2 inimigos, mas a nave é lenta", baseCost: 260, group: "NAVES", color: "#d9a44a" },
    { id: "skin-gold", title: "SKIN SERAFIM", description: "+25% créditos e +25% de itens caídos", baseCost: 300, group: "NAVES", color: "#d9a44a" },
];

//=====================
//INIMIGOS
//=====================

const enemies = [];
const ENEMY_ROWS = 3;
const ENEMY_COLS = 8;
const ENEMY_WIDTH = 40;
const ENEMY_TYPES = ["scout", "bomber", "drone", "striker"];
const ENEMY_STYLES = {
    scout: { color: "#c96a3a", core: "#ffd9a0" },
    bomber: { color: "#d43a26", core: "#ffe9c0" },
    drone: { color: "#79c473", core: "#eaffdd" },
    striker: { color: "#cfc3ae", core: "#fff2d4" },
};
const playerSprites = {};
const enemySprites = {};
const spriteSources = {
    player: "assets/player.svg",
    neon: "assets/player-neon.svg",
    crimson: "assets/player-crimson.svg",
    gold: "assets/player-gold.svg",
    scout: "assets/scout.svg",
    bomber: "assets/bomber.svg",
    drone: "assets/drone.svg",
    striker: "assets/striker.svg",
};
Object.entries(spriteSources).forEach(([name, source]) => {
    const image = new Image();
    image.src = source;
    if (name === "player" || name === "neon" || name === "crimson" || name === "gold") {
        playerSprites[name] = image;
    } else {
        enemySprites[name] = image;
    }
});

let enemyDirection = 1;
let enemySpeed = 1;

//=====================
// ÁUDIO E ACESSIBILIDADE
//=====================
function playTone(frequency = 440, duration = 0.07, type = "square", volume = 0.035) {
    if (!soundEnabled) return;
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        audioContext = audioContext || new AudioContextClass();
        if (audioContext.state === "suspended") audioContext.resume();
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        gain.gain.setValueAtTime(volume, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
        oscillator.connect(gain); gain.connect(audioContext.destination);
        oscillator.start(); oscillator.stop(audioContext.currentTime + duration);
    } catch (error) { /* O jogo permanece funcional sem áudio. */ }
}

function updateAccessibility() {
    const brightness = document.getElementById("brightnessControl");
    const contrast = document.getElementById("contrastControl");
    if (brightness) canvas.style.filter = `brightness(${brightness.value}%) contrast(${contrast ? contrast.value : 100}%)`;
}

document.getElementById("soundToggle")?.addEventListener("click", (event) => {
    soundEnabled = !soundEnabled;
    event.currentTarget.setAttribute("aria-pressed", String(soundEnabled));
    event.currentTarget.textContent = soundEnabled ? "ÁUDIO: ON" : "ÁUDIO: OFF";
    if (soundEnabled) playTone(660, 0.08);
});
document.getElementById("brightnessControl")?.addEventListener("input", updateAccessibility);
document.getElementById("contrastControl")?.addEventListener("input", updateAccessibility);

//=====================
//EVENTOS TECLADO
//=====================

window.addEventListener("keydown", (event) => {
    keys[event.code] = true;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(event.code)) {
        event.preventDefault();
    }

    if (podiumOpen) {
        if (["Escape", "KeyP", "KeyR", "Enter"].includes(event.code)) {
            podiumOpen = false;
            if (event.code === "KeyR" && podiumReturn === "gameover") {
                resetGame();
            }
            return;
        }
        event.preventDefault();
        return;
    }

    if (gameStarted && gameOver && !scoreSaved) {
        if (/^Key[A-Z]$/.test(event.code) && playerName.length < 3) {
            playerName.push(event.code.slice(3));
        } else if (event.code === "Backspace") {
            playerName.pop();
        } else if (event.code === "Enter") {
            savePodiumScore();
        } else if (event.code === "Escape") {
            scoreSaved = true;
        }
        event.preventDefault();
        return;
    }

    if (event.code === "KeyP" && gameStarted && !gameOver && !shopOpen) {
        paused = !paused; keys.Space = false; return;
    }
    if (event.code === "KeyM") {
        soundEnabled = !soundEnabled;
        const soundButton = document.getElementById("soundToggle");
        if (soundButton) { soundButton.textContent = soundEnabled ? "ÁUDIO: ON" : "ÁUDIO: OFF"; soundButton.setAttribute("aria-pressed", String(soundEnabled)); }
        if (soundEnabled) playTone(660, 0.08);
        return;
    }
    if (event.code === "Space" && gameStarted && !gameOver && !shopOpen && !paused) {
        keys.Space = true;
    }

    if (event.code === "KeyR" && gameOver) {
        resetGame();
    }

    if (event.code === "KeyP" && gameOver && scoreSaved) {
        podiumOpen = true;
        podiumReturn = "gameover";
    }

    if (event.code === "Enter" && shopOpen) {
        startNextWave();
    }
    if (event.code === "Escape" && catalogOpen) {
        catalogOpen = false;
    } else if (event.code === "Escape" && gameStarted) {
        returnToMenu();
    }
});

window.addEventListener("keyup", (event) => {
    keys[event.code] = false;
});

canvas.addEventListener("click", (event) => {
    const bounds = canvas.getBoundingClientRect();
    const scaleX = canvas.width / bounds.width;
    const scaleY = canvas.height / bounds.height;
    const clickX = (event.clientX - bounds.left) * scaleX;
    const clickY = (event.clientY - bounds.top) * scaleY;

    if (podiumOpen) {
        const closeButton = getPodiumCloseBounds();
        if (
            clickX >= closeButton.x &&
            clickX <= closeButton.x + closeButton.width &&
            clickY >= closeButton.y &&
            clickY <= closeButton.y + closeButton.height
        ) {
            podiumOpen = false;
        }
        return;
    }

    if (gameStarted) {
        const homeButton = getHomeButtonBounds();
        if (
            clickX >= homeButton.x &&
            clickX <= homeButton.x + homeButton.width &&
            clickY >= homeButton.y &&
            clickY <= homeButton.y + homeButton.height
        ) {
            returnToMenu();
            return;
        }
    }

    if (catalogOpen) {
        const closeButton = getCatalogCloseBounds();
        if (
            clickX >= closeButton.x &&
            clickX <= closeButton.x + closeButton.width &&
            clickY >= closeButton.y &&
            clickY <= closeButton.y + closeButton.height
        ) {
            catalogOpen = false;
        }
        return;
    }

    if (shopOpen) {
        for (let index = 0; index < shopItems.length; index++) {
            const card = getShopCardBounds(index);
            if (
                clickX >= card.x &&
                clickX <= card.x + card.width &&
                clickY >= card.y &&
                clickY <= card.y + card.height
            ) {
                if (event.shiftKey) sellPowerUp(shopItems[index]);
                else purchasePowerUp(shopItems[index]);
                return;
            }
        }

        const continueButton = getContinueButtonBounds();
        if (
            clickX >= continueButton.x &&
            clickX <= continueButton.x + continueButton.width &&
            clickY >= continueButton.y &&
            clickY <= continueButton.y + continueButton.height
        ) {
            startNextWave();
        }
        return;
    }

    if (gameStarted && !gameOver) return;
    if (!gameOver) {
        const catalogButton = getCatalogButtonBounds();
        if (
            clickX >= catalogButton.x &&
            clickX <= catalogButton.x + catalogButton.width &&
            clickY >= catalogButton.y &&
            clickY <= catalogButton.y + catalogButton.height
        ) {
            catalogOpen = true;
            return;
        }
        const podiumButton = getPodiumButtonBounds();
        if (
            clickX >= podiumButton.x &&
            clickX <= podiumButton.x + podiumButton.width &&
            clickY >= podiumButton.y &&
            clickY <= podiumButton.y + podiumButton.height
        ) {
            podiumOpen = true;
            podiumReturn = "menu";
            return;
        }
    }

    if (gameOver && scoreSaved) {
        const gameOverPodium = getGameOverPodiumButtonBounds();
        if (
            clickX >= gameOverPodium.x &&
            clickX <= gameOverPodium.x + gameOverPodium.width &&
            clickY >= gameOverPodium.y &&
            clickY <= gameOverPodium.y + gameOverPodium.height
        ) {
            podiumOpen = true;
            podiumReturn = "gameover";
            return;
        }
    }
    const button = gameOver ? getRestartButtonBounds() : getStartButtonBounds();

    if (
        clickX >= button.x &&
        clickX <= button.x + button.width &&
        clickY >= button.y &&
        clickY <= button.y + button.height
    ) {
        if (gameOver) {
            resetGame();
        } else {
            resetGame();
        }
    }
});

function getStartButtonBounds() {
    return {
        x: canvas.width / 2 - 230,
        y: canvas.height / 2 + 54,
        width: 210,
        height: 56,
    };
}

function getRestartButtonBounds() {
    return {
        x: canvas.width / 2 - 110,
        y: canvas.height / 2 + 54,
        width: 220,
        height: 56,
    };
}

function getHomeButtonBounds() {
    return {
        x: canvas.width - 96,
        y: 23,
        width: 72,
        height: 40,
    };
}

function getCatalogButtonBounds() {
    return {
        x: canvas.width / 2 + 20,
        y: canvas.height / 2 + 54,
        width: 210,
        height: 56,
    };
}

function getCatalogCloseBounds() {
    return {
        x: canvas.width / 2 - 110,
        y: canvas.height - 72,
        width: 220,
        height: 50,
    };
}

function getPodiumButtonBounds() {
    return {
        x: canvas.width / 2 - 110,
        y: 424,
        width: 220,
        height: 48,
    };
}

function getPodiumCloseBounds() {
    return {
        x: canvas.width / 2 - 110,
        y: 472,
        width: 220,
        height: 44,
    };
}

function getGameOverPodiumButtonBounds() {
    return {
        x: canvas.width / 2 - 110,
        y: 420,
        width: 220,
        height: 46,
    };
}

function getShopCardBounds(index) {
    const width = 220;
    const gap = 15;
    const col = index % 3;
    const row = Math.floor(index / 3);
    return {
        x: canvas.width / 2 - (width * 3 + gap * 2) / 2 + col * (width + gap),
        y: 145 + row * 91,
        width,
        height: 82,
    };
}

function getContinueButtonBounds() {
    return {
        x: canvas.width / 2 - 120,
        y: 523,
        width: 240,
        height: 48,
    };
}

function getPowerUpCost(item) {
    const levels = {
        rapid: rapidFireLevel,
        spread: spreadShotLevel,
        speed: speedLevel,
        credits: creditLevel,
        pulse: pulseLevel,
        missile: missileLevel,
    };
    return item.baseCost * ((item.id in levels) ? levels[item.id] + 1 : 1);
}

function isItemMaxed(item) {
    const skinId = item.id.startsWith("skin-") ? item.id.slice(5) : null;
    if (skinId) return ownedSkins.has(skinId);
    return (
        (item.id === "life" && lives >= MAX_LIVES) ||
        (item.id === "rapid" && rapidFireLevel >= 4) ||
        (item.id === "spread" && spreadShotLevel >= 2) ||
        (item.id === "shield" && shieldCharges >= 3) ||
        (item.id === "speed" && speedLevel >= 3) ||
        (item.id === "credits" && creditLevel >= 3) ||
        (item.id === "pulse" && pulseLevel >= 3) ||
        (item.id === "missile" && missileLevel >= 1)
    );
}

const LEVELS_MAX = { rapid: 4, spread: 2, shield: 3, speed: 3, credits: 3, pulse: 3, missile: 1 };

function drawLevelPips(x, y, item) {
    const max = LEVELS_MAX[item.id];
    if (!max) return;
    const levels = {
        rapid: rapidFireLevel,
        spread: spreadShotLevel,
        shield: shieldCharges,
        speed: speedLevel,
        credits: creditLevel,
        pulse: pulseLevel,
        missile: missileLevel,
    };
    const current = levels[item.id] || 0;
    for (let i = 0; i < max; i++) {
        ctx.fillStyle = i < current ? item.color : "rgba(143, 124, 99, 0.22)";
        ctx.fillRect(x + i * 12, y, 8, 8);
    }
}

function purchasePowerUp(item) {
    const skinId = item.id.startsWith("skin-") ? item.id.slice(5) : null;
    if (skinId && ownedSkins.has(skinId)) {
        selectedSkin = skinId;
        applySkinStats();
        return;
    }

    const atLimit = (
        (item.id === "life" && lives >= MAX_LIVES) ||
        (item.id === "rapid" && rapidFireLevel >= 4) ||
        (item.id === "spread" && spreadShotLevel >= 2) ||
        (item.id === "shield" && shieldCharges >= 3) ||
        (item.id === "speed" && speedLevel >= 3) ||
        (item.id === "credits" && creditLevel >= 3) ||
        (item.id === "pulse" && pulseLevel >= 3) ||
        (item.id === "missile" && missileLevel >= 1)
    );
    if (atLimit) return;

    const cost = getPowerUpCost(item);
    if (score < cost) return;

    score -= cost;
    if (item.id === "rapid") {
        rapidFireLevel++;
    } else if (item.id === "spread") {
        spreadShotLevel++;
    } else if (item.id === "life") {
        lives++;
    } else if (item.id === "shield") {
        shieldCharges++;
    } else if (item.id === "speed") {
        speedLevel++;
        player.speed = 5 + speedLevel * 0.8;
    } else if (item.id === "credits") {
        creditLevel++;
    } else if (item.id === "pulse") {
        pulseLevel++;
    } else if (item.id === "missile") {
        missileLevel++;
    } else if (skinId) {
        ownedSkins.add(skinId);
        selectedSkin = skinId;
    }
    applySkinStats();
}

function sellPowerUp(item) {
    const refundRate = 0.5;
    let owned = false;
    if (item.id === "rapid" && rapidFireLevel > 0) { rapidFireLevel--; owned = true; }
    else if (item.id === "spread" && spreadShotLevel > 0) { spreadShotLevel--; owned = true; }
    else if (item.id === "shield" && shieldCharges > 0) { shieldCharges--; owned = true; }
    else if (item.id === "speed" && speedLevel > 0) { speedLevel--; owned = true; }
    else if (item.id === "credits" && creditLevel > 0) { creditLevel--; owned = true; }
    else if (item.id === "pulse" && pulseLevel > 0) { pulseLevel--; owned = true; }
    else if (item.id === "missile" && missileLevel > 0) { missileLevel--; owned = true; }
    else if (item.id === "life" && lives > 1) { lives--; owned = true; }
    if (!owned) return;
    score += Math.floor(getPowerUpCost(item) * refundRate);
    applySkinStats();
    addPopup(canvas.width / 2, 112, "ITEM VENDIDO · 50% DE REEMBOLSO", "#ffcf8f");
}

function startNextWave() {
    shopOpen = false;
    createEnemies();
    createObstacles();
    nextEnemyShotAt = Date.now() + 900;
    waveBanner = { text: `SETOR ${String(wave).padStart(2, "0")}`, sub: "Elimine o bestiário antes que chegue até você", until: Date.now() + 2000 };
}

function returnToMenu() {
    gameStarted = false;
    gameOver = false;
    gameWon = false; paused = false;
    shopOpen = false;
    catalogOpen = false;
    podiumOpen = false;
    scoreSaved = false;
    playerName = [];
    keys.Space = false;
    bullets.length = 0;
    enemyBullets.length = 0;
    shotSequence = 0;
    obstacles.length = 0;
    pickups.length = 0;
    particles.length = 0;
    popups.length = 0;
    combo = 0;
    comboExpiresAt = 0;
    waveBanner = null;
}

function applySkinStats() {
    const skin = playerSkins[selectedSkin];
    player.speed = 5 + speedLevel * 0.8 + (skin.speedBonus || 0) - (skin.speedPenalty || 0);
}

function playerHitbox() {
    const skin = playerSkins[selectedSkin];
    const scale = skin.hitScale || 1;
    const width = player.width * scale;
    const height = player.height * scale;
    return {
        x: player.x + (player.width - width) / 2,
        y: player.y + (player.height - height) / 2,
        width,
        height,
    };
}

//=====================
//CRIA INIMIGOS
//=====================

function createEnemies() {
    enemies.length = 0;

    const spacingX = Math.min(60, (canvas.width - 100) / (ENEMY_COLS - 1));
    const startX = (canvas.width - spacingX * (ENEMY_COLS - 1) - ENEMY_WIDTH) / 2;
    const startY = 105;
    const spacingY = 43;

    const rowCount = Math.min(ENEMY_ROWS + Math.floor((wave - 1) / 3), 5);
    for (let row = 0; row < rowCount; row++) {
        for (let col = 0; col < ENEMY_COLS; col++) {
            const homeX = startX + col * spacingX;
            const homeY = startY + row * spacingY;
            const type = ENEMY_TYPES[(col + row * 2 + wave - 1) % ENEMY_TYPES.length];
            const entryType = (col + row + wave - 1) % 4;
            let spawnX = homeX;
            let spawnY = -ENEMY_WIDTH - col * 13;

            if (entryType === 1) {
                spawnX = col < ENEMY_COLS / 2 ? -ENEMY_WIDTH - row * 22 : canvas.width + row * 22;
                spawnY = homeY - 55;
            } else if (entryType === 2) {
                spawnX = col < ENEMY_COLS / 2 ? -ENEMY_WIDTH : canvas.width + ENEMY_WIDTH;
                spawnY = -25 - row * 18;
            } else if (entryType === 3) {
                spawnX = col % 2 === 0 ? -ENEMY_WIDTH : canvas.width + ENEMY_WIDTH;
                spawnY = homeY - 90;
            }

            const enemy = {
                x: spawnX,
                y: spawnY,
                homeX,
                homeY,
                type,
                entryType,
                phase: Math.random() * Math.PI * 2,
                nextDiveAt: Date.now() + 1800 + Math.random() * 2400,
                entering: true,
                row,
                width: ENEMY_WIDTH,
                height: 30,
                alive: true,
            };
            enemies.push(enemy);
        }
    }
}

function createObstacles() {
    obstacles.length = 0;
    const positions = [
        { x: 96, y: 320 },
        { x: 268, y: 354 },
        { x: 442, y: 320 },
        { x: 614, y: 354 },
    ];
    positions.forEach((position, index) => {
        obstacles.push({
            x: position.x,
            y: position.y,
            width: 90,
            height: 30,
            health: MAX_OBSTACLE_HEALTH,
            variant: index,
        });
    });
}

//=====================
//ATIRAR
//=====================

function shoot() {
    playTone(520, 0.045, "square", 0.018);
    shotSequence++;
    const shotOffsets = spreadShotLevel >= 2
        ? [-20, -10, 0, 10, 20]
        : spreadShotLevel === 1
            ? [-13, 0, 13]
            : [0];
    const skin = playerSkins[selectedSkin];
    for (const offset of shotOffsets) {
        if (bullets.length >= MAX_PLAYER_BULLETS) break;
        bullets.push({
            x: player.x + player.width / 2 - 2.5 + offset,
            y: player.y,
            width: selectedSkin === "crimson" ? 7 : 5,
            height: 12,
            color: skin.hull,
            speed: bulletSpeed * (selectedSkin === "crimson" ? 1.2 : selectedSkin === "neon" ? 1.15 : 1),
            hits: 0,
            maxHits: skin.maxHits || 1,
        });
    }

    if (pulseLevel > 0 && bullets.length < MAX_PLAYER_BULLETS) {
        bullets.push({
            x: player.x + player.width / 2 - 4,
            y: player.y - 2,
            width: 8,
            height: 23,
            color: "#9affea",
            speed: 11 + pulseLevel * 0.8,
            hits: 0,
            maxHits: 1 + pulseLevel + (selectedSkin === "crimson" ? 1 : 0),
            kind: "pulse",
        });
    }

    if (missileLevel > 0 && shotSequence % 3 === 0 && bullets.length < MAX_PLAYER_BULLETS) {
        bullets.push({
            x: player.x + player.width / 2 - 5,
            y: player.y - 6,
            width: 10,
            height: 15,
            color: "#ffc879",
            vx: 0,
            vy: -5.4,
            speed: 5.4,
            hits: 0,
            maxHits: 1,
            kind: "missile",
        });
    }
}

//=====================
//MOVIMENTO JOGADOR
//=====================

function updatePlayer() {
    const previousX = player.x;
    const previousY = player.y;
    if ((keys["ArrowLeft"] || keys["KeyA"]) && player.x > 0) {
        player.x -= player.speed * frameScale;
    }
    if ((keys["ArrowRight"] || keys["KeyD"]) && player.x < canvas.width - player.width) {
        player.x += player.speed * frameScale;
    }
    if ((keys["ArrowUp"] || keys["KeyW"]) && player.y > PLAYER_TOP_BOUNDARY) {
        player.y -= player.speed * frameScale;
    }
    if ((keys["ArrowDown"] || keys["KeyS"]) && player.y < canvas.height - player.height - 16) {
        player.y += player.speed * frameScale;
    }
    if (player.x < 0) player.x = 0;
    if (player.y < PLAYER_TOP_BOUNDARY) player.y = PLAYER_TOP_BOUNDARY;

    if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;
    if (player.y > canvas.height - player.height - 16) player.y = canvas.height - player.height - 16;

    if (obstacles.some(obstacle => isColliding(player, obstacle))) {
        player.x = previousX;
        player.y = previousY;
    }
}

//=====================
//MOVIMENTO TIROS
//=====================

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        if (bullet.kind === "missile") {
            const target = enemies.find(enemy => enemy.alive);
            if (target) {
                const targetX = target.x + target.width / 2;
                const bulletX = bullet.x + bullet.width / 2;
                bullet.vx += Math.max(-0.22, Math.min(0.22, (targetX - bulletX) * 0.003));
                bullet.vx = Math.max(-3.2, Math.min(3.2, bullet.vx));
                bullet.vy = -Math.max(3.8, bullet.speed - Math.abs(bullet.vx) * 0.28);
            }
        }
        bullet.x += (bullet.vx || 0) * frameScale;
        bullet.y += bullet.vy !== undefined
            ? bullet.vy * frameScale
            : -(bullet.speed || bulletSpeed) * frameScale;

        if (bullet.y + bullet.height < 0 || bullet.x < -20 || bullet.x > canvas.width + 20) {
            bullets.splice(i, 1);
        }
    }

    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        if (bullet.type === "rocket") {
            const hitbox = playerHitbox();
            const tx = hitbox.x + hitbox.width / 2 - (bullet.x + bullet.width / 2);
            const ty = hitbox.y + hitbox.height / 2 - (bullet.y + bullet.height / 2);
            const desired = Math.atan2(ty, tx);
            const current = Math.atan2(bullet.vy, bullet.vx);
            let diff = desired - current;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            const turn = Math.max(-0.05, Math.min(0.05, diff * 0.02)) * 2.2;
            const speed = Math.hypot(bullet.vx, bullet.vy);
            bullet.angle = current + turn * frameScale;
            bullet.vx = Math.cos(bullet.angle) * speed;
            bullet.vy = Math.sin(bullet.angle) * speed;
        }
        bullet.x += bullet.vx * frameScale;
        bullet.y += bullet.vy * frameScale;
        bullet.angle = (bullet.angle || 0) + (bullet.spin || 0.08);
        if (bullet.y > canvas.height || bullet.x < -20 || bullet.x > canvas.width + 20) {
            enemyBullets.splice(i, 1);
        } else {
            const obstacle = obstacles.find(candidate => candidate.health > 0 && isColliding(bullet, candidate));
            if (obstacle) {
                obstacle.health--;
                enemyBullets.splice(i, 1);
                continue;
            }
            if (
                Date.now() >= playerInvulnerableUntil &&
                isColliding(bullet, playerHitbox())
            ) {
                enemyBullets.splice(i, 1);
                damagePlayer();
                return;
            }
        }
    }
    removeDestroyedObstacles();
}

//=====================
//MOVIMENTO INIMIGOS
//=====================

function updateEnemies() {
    let shouldChangeDirection = false;
    const now = Date.now();
    const enteringEnemies = enemies.filter(enemy => enemy.alive && enemy.entering);

    if (enteringEnemies.length > 0) {
        const entrySpeed = 2.4 + Math.min(wave * 0.12, 2);
        for (const enemy of enteringEnemies) {
            const dx = enemy.homeX - enemy.x;
            const dy = enemy.homeY - enemy.y;
            const distance = Math.hypot(dx, dy);
            if (distance <= entrySpeed) {
                enemy.x = enemy.homeX;
                enemy.y = enemy.homeY;
                enemy.entering = false;
            } else {
                const speed = entrySpeed * (enemy.type === "striker" ? 1.45 : 1);
                enemy.x += (dx / distance) * speed * frameScale;
                enemy.y += (dy / distance) * speed * frameScale;
            }
        }
    }

    for (const enemy of enemies) {
        if (!enemy.alive || enemy.entering) continue;
        const typeSpeed = enemy.type === "bomber" ? 0.6 : enemy.type === "striker" ? 1.45 : 1;
        if (!enemy.diving && !enemy.lunging) {
            enemy.x += enemySpeed * typeSpeed * enemyDirection * frameScale;
        }
        // CACODEMON: flutua oscilando acima da formação
        if (enemy.type === "bomber") {
            enemy.y = enemy.homeY + Math.sin(now / 460 + enemy.phase) * 7;
        }

        if (enemy.x <= 0 || enemy.x + enemy.width >= canvas.width) {
            shouldChangeDirection = true;
        }

        // IMP: periodicamente avanca na direção do jogador atirando agulhas
        if (enemy.type === "scout") {
            if (!enemy.lunging && now >= enemy.nextDiveAt) {
                enemy.lunging = true;
                enemy.lungeShotFired = false;
                enemy.lungeTargetX = player.x + player.width / 2 - enemy.width / 2;
                fireEnemyWeapon(enemy, now);
            }
            if (enemy.lunging) {
                const dx = enemy.lungeTargetX - enemy.x;
                enemy.x += Math.max(-2.8, Math.min(2.8, dx * 0.08)) * frameScale;
                enemy.y += 1.5 * frameScale;
                if (!enemy.lungeShotFired && enemy.y > enemy.homeY + 30) {
                    enemy.lungeShotFired = true;
                    fireEnemyWeapon(enemy, now);
                }
                if (enemy.y > enemy.homeY + 82) {
                    enemy.lunging = false;
                    enemy.nextDiveAt = now + 3200 + Math.random() * 1800;
                }
            } else if (enemy.y > enemy.homeY) {
                enemy.y = Math.max(enemy.homeY, enemy.y - 1.2 * frameScale);
            }
        }

        // ALMA PERDIDA: mergulho kamikaze na posição do jogador
        if (enemy.type === "drone") {
            if (!enemy.diving && now >= enemy.nextDiveAt) {
                enemy.diving = true;
                fireEnemyWeapon(enemy, now);
            }
            if (enemy.diving) {
                enemy.y += (2.7 + wave * 0.12) * frameScale;
                const dx = player.x + player.width / 2 - (enemy.x + enemy.width / 2);
                enemy.x += Math.max(-1.8, Math.min(1.8, dx * 0.04)) * frameScale;
                if (enemy.y > player.y - 26 || enemy.y > enemy.homeY + 160) {
                    enemy.diving = false;
                    enemy.nextDiveAt = now + 2600 + Math.random() * 2000;
                }
            } else if (enemy.y > enemy.homeY) {
                enemy.y = Math.max(enemy.homeY, enemy.y - 1.1 * frameScale);
            }
        }
    }

    if (shouldChangeDirection) {
        enemyDirection *= -1;
        for (const enemy of enemies) {
            if (enemy.alive && !enemy.entering) {
                enemy.y += 20 * frameScale;
                if (
                    enemy.y + enemy.height >= player.y &&
                    now >= playerInvulnerableUntil
                ) {
                    damagePlayer();
                    if (!gameOver) {
                        createEnemies();
                    }
                    return;
                }
            }
        }
    }

    const fireInterval = Math.max(440, 1450 - (wave - 1) * 90);
    if (now >= nextEnemyShotAt) {
        const shooters = enemies.filter(enemy => enemy.alive && !enemy.entering);
        if (shooters.length > 0 && enemyBullets.length < MAX_ENEMY_BULLETS) {
            const shooter = shooters[Math.floor(Math.random() * shooters.length)];
            fireEnemyWeapon(shooter, now);
        }
        nextEnemyShotAt = now + fireInterval;
    }
}

function fireEnemyWeapon(enemy, now) {
    const originX = enemy.x + enemy.width / 2;
    const originY = enemy.y + enemy.height;
    const targetX = player.x + player.width / 2;
    const targetY = player.y + player.height / 2;
    const aimAngle = Math.atan2(targetY - originY, targetX - originX);
    const waveBonus = Math.min(wave * 0.18, 2.5);

    function addProjectile(type, angle, speed, size, spin = 0.04) {
        if (enemyBullets.length >= MAX_ENEMY_BULLETS) return;
        enemyBullets.push({
            x: originX - size / 2,
            y: originY,
            width: size,
            height: size,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            type,
            angle,
            spin,
        });
    }

    enemy.volley = (enemy.volley || 0) + 1;

    if (enemy.type === "bomber") {
        const count = wave >= 3 ? 5 : 3;
        const offsets = count === 5 ? [-0.6, -0.3, 0, 0.3, 0.6] : [-0.34, 0, 0.34];
        for (const offset of offsets) {
            addProjectile("orb", aimAngle + offset, 3.1 + waveBonus, 13);
        }
    } else if (enemy.type === "drone") {
        addProjectile("mine", Math.PI / 2, 2.2 + waveBonus * 0.5, 15, 0.12);
    } else if (enemy.type === "striker") {
        if (enemy.volley % 3 === 0) {
            addProjectile("rocket", Math.PI * 0.62, 2.8 + waveBonus * 0.4, 9, 0);
            addProjectile("rocket", Math.PI * 0.38, 2.8 + waveBonus * 0.4, 9, 0);
        }
        addProjectile("bolt", aimAngle - 0.12, 6 + waveBonus, 6);
        addProjectile("bolt", aimAngle + 0.12, 6 + waveBonus, 6);
    } else {
        addProjectile("needle", aimAngle, 4.6 + waveBonus, 7);
    }
}

function spawnParticles(x, y, count, color, speedScale = 1) {
    for (let i = 0; i < count; i++) {
        if (particles.length > 220) return;
        const angle = Math.random() * Math.PI * 2;
        const speed = (Math.random() * 2.4 + 0.6) * speedScale;
        particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1.2,
            life: 420 + Math.random() * 260,
            born: Date.now(),
            color,
            size: Math.random() * 2.4 + 1.2,
        });
    }
}

function addPopup(x, y, text, color) {
    popups.push({ x, y, text, color: color || PALETTE.accentBright, born: Date.now(), life: 850 });
}

function killEnemy(enemy) {
    enemy.alive = false;
    const now = Date.now();
    if (now < comboExpiresAt) combo++;
    else combo = 1;
    comboExpiresAt = now + 2400;
    const multiplier = Math.min(5, 1 + Math.floor(combo / 5));
    const skin = playerSkins[selectedSkin];
    const reward = { scout: 20, bomber: 45, drone: 35, striker: 50 }[enemy.type] || 20;
    const gained = Math.round(reward * multiplier * (1 + creditLevel * 0.25) * (skin.creditBonus || 1));
    score += gained;
    const centerX = enemy.x + enemy.width / 2;
    const centerY = enemy.y + enemy.height / 2;
    spawnParticles(centerX, centerY, 10, ENEMY_STYLES[enemy.type].color);
    addPopup(centerX, centerY - 12, `+${gained}`, multiplier > 1 ? "#ffcf8f" : "#e6d5b3");
    if (multiplier > 1 && combo % 10 === 0) {
        addPopup(centerX, centerY - 26, `COMBO x${multiplier}!`, "#e0532f");
    }
    dropPickup(enemy);
}

function dropPickup(enemy) {
    const skin = playerSkins[selectedSkin];
    const chance = 0.12 + (skin.dropBonus || 0);
    if (Math.random() >= chance) return;
    let kind = "credit";
    const roll = Math.random();
    if (shieldCharges < 3 && roll < 0.42) kind = "shield";
    else if (lives < MAX_LIVES && roll < 0.64) kind = "medkit";
    pickups.push({
        x: enemy.x + enemy.width / 2 - 8,
        y: enemy.y,
        width: 16,
        height: 16,
        kind,
        sway: Math.random() * Math.PI * 2,
    });
}

function updatePickups() {
    for (let i = pickups.length - 1; i >= 0; i--) {
        const pickup = pickups[i];
        pickup.y += 0.55 * frameScale;
        if (pickup.y > canvas.height) {
            pickups.splice(i, 1);
            continue;
        }
        if (isColliding(pickup, player)) {
            pickups.splice(i, 1);
            if (pickup.kind === "credit") {
                score += 45;
                addPopup(pickup.x + 8, pickup.y, "+45 CRÉDITOS", "#ffcf8f");
            } else if (pickup.kind === "shield") {
                shieldCharges = Math.min(3, shieldCharges + 1);
                addPopup(pickup.x + 8, pickup.y, "ESCUDO +1", "#79c473");
            } else {
                lives = Math.min(MAX_LIVES, lives + 1);
                addPopup(pickup.x + 8, pickup.y, "VIDA +1", "#79c473");
            }
            spawnParticles(pickup.x + 8, pickup.y + 8, 6, pickup.kind === "credit" ? "#ffcf8f" : "#79c473");
        }
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.x += particle.vx * frameScale;
        particle.y += particle.vy * frameScale;
        particle.vy += 0.05 * frameScale;
        if (Date.now() - particle.born > particle.life) {
            particles.splice(i, 1);
        }
    }
}

function damagePlayer() {
    playTone(115, 0.18, "sawtooth", 0.05);
    const now = Date.now();
    spawnParticles(player.x + player.width / 2, player.y + player.height / 2, 8, "#d43a26");
    shakeUntil = now + 260;
    hurtFlashUntil = now + 420;
    if (shieldCharges > 0) {
        shieldCharges--;
        addPopup(player.x + player.width / 2, player.y - 12, "ESCUDO!", "#79c473");
        playerInvulnerableUntil = now + 900;
        enemyBullets.length = 0;
        return;
    }
    combo = 0;
    comboExpiresAt = 0;
    lives--;
    playerInvulnerableUntil = now + 1400;
    enemyBullets.length = 0;
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 70;
    if (lives <= 0) {
        gameOver = true;
    }
}

//=====================
//COLISÃO RETANGULO
//=====================

function isColliding(a,b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

//=====================
//DETECTA ACERTOS
//=====================

function detectCollisions() {
    for (let b = bullets.length - 1; b >= 0; b--) {
        const bullet = bullets[b];
        const obstacle = obstacles.find(candidate => candidate.health > 0 && isColliding(bullet, candidate));
        if (obstacle) {
            obstacle.health -= bullet.kind === "pulse" ? 2 : 1;
            bullets.splice(b, 1);
            continue;
        }

        for (const enemy of enemies) {
            if (enemy.alive && isColliding(bullet, enemy)) {
                killEnemy(enemy);
                bullet.hits++;
                if (bullet.hits >= bullet.maxHits) {
                    bullets.splice(b, 1);
                    break;
                }
                break;
            }
        }
    }

    removeDestroyedObstacles();
    const remainingEnemies = enemies.filter(enemy => enemy.alive);
    if (remainingEnemies.length === 0 && !shopOpen && !gameWon) {
        wave++; enemySpeed = Math.min(enemySpeed + 0.5, 6); enemyBullets.length = 0;
        if (wave > 10) { gameWon = true; gameOver = true; paused = false; playTone(880, 0.35, "triangle", 0.06); }
        else shopOpen = true;
    }
}

function removeDestroyedObstacles() {
    for (let index = obstacles.length - 1; index >= 0; index--) {
        if (obstacles[index].health <= 0) {
            obstacles.splice(index, 1);
        }
    }
}

//=====================
//DESENHO JOGADOR
//=====================

function drawPlayer() {
    const sprite = playerSprites[selectedSkin] || playerSprites.player;
    const spriteReady = sprite && sprite.complete && sprite.naturalWidth > 0;
    if (spriteReady) {
        ctx.save();
        ctx.filter = "saturate(1.15) contrast(1.2)";
        ctx.shadowColor = PALETTE.accent;
        ctx.shadowBlur = 5;
        ctx.drawImage(sprite, player.x - 4, player.y - 7, player.width + 8, player.height + 16);
        ctx.restore();
    } else {
    ctx.save();
    ctx.translate(player.x, player.y);

    const centerX = player.width / 2;
    const centerY = player.height / 2;
    const skin = playerSkins[selectedSkin];
    const flameLength = 8 + Math.sin(Date.now() / 85) * 3;

    ctx.shadowColor = skin.hull;
    ctx.shadowBlur = 10;
    ctx.fillStyle = skin.hull;
    ctx.beginPath();
    if (skin.style === "heavy") {
        ctx.moveTo(centerX, -4);
        ctx.lineTo(player.width - 3, 5);
        ctx.lineTo(player.width - 8, player.height - 1);
        ctx.lineTo(centerX + 10, player.height - 4);
        ctx.lineTo(centerX, player.height + 1);
        ctx.lineTo(centerX - 10, player.height - 4);
        ctx.lineTo(8, player.height - 1);
        ctx.lineTo(3, 5);
    } else if (skin.style === "royal") {
        ctx.moveTo(centerX, -10);
        ctx.lineTo(centerX + 8, 2);
        ctx.lineTo(player.width - 1, player.height - 3);
        ctx.lineTo(centerX + 7, player.height - 7);
        ctx.lineTo(centerX, player.height + 1);
        ctx.lineTo(centerX - 7, player.height - 7);
        ctx.lineTo(1, player.height - 3);
        ctx.lineTo(centerX - 8, 2);
    } else if (skin.style === "sleek") {
        ctx.moveTo(centerX, -11);
        ctx.lineTo(centerX + 6, 5);
        ctx.lineTo(player.width - 3, player.height - 1);
        ctx.lineTo(centerX, player.height - 9);
        ctx.lineTo(3, player.height - 1);
        ctx.lineTo(centerX - 6, 5);
    } else {
        ctx.moveTo(centerX, -10);
        ctx.lineTo(centerX + 8, 5);
        ctx.lineTo(player.width - 2, player.height - 2);
        ctx.lineTo(centerX + 6, player.height - 7);
        ctx.lineTo(centerX, player.height - 3);
        ctx.lineTo(centerX - 6, player.height - 7);
        ctx.lineTo(2, player.height - 2);
        ctx.lineTo(centerX - 8, 5);
    }
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = skin.trim;
    ctx.beginPath();
    ctx.moveTo(centerX, -5);
    ctx.lineTo(centerX + 3, 5);
    ctx.lineTo(player.width - 13, player.height - 5);
    ctx.lineTo(centerX, player.height - 11);
    ctx.lineTo(13, player.height - 5);
    ctx.lineTo(centerX - 3, 5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = skin.wing;
    ctx.beginPath();
    ctx.moveTo(8, player.height - 7);
    ctx.lineTo(1, player.height + 2);
    ctx.lineTo(19, player.height - 8);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(player.width - 8, player.height - 7);
    ctx.lineTo(player.width - 1, player.height + 2);
    ctx.lineTo(player.width - 19, player.height - 8);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(238, 255, 250, 0.72)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX, -5);
    ctx.lineTo(centerX, player.height - 9);
    ctx.moveTo(centerX - 13, 16);
    ctx.lineTo(centerX - 7, 19);
    ctx.lineTo(centerX - 2, 16);
    ctx.moveTo(centerX + 13, 16);
    ctx.lineTo(centerX + 7, 19);
    ctx.lineTo(centerX + 2, 16);
    ctx.stroke();

    ctx.fillStyle = "#142c31";
    ctx.beginPath();
    ctx.ellipse(centerX, 7, 3.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = skin.trim;
    ctx.beginPath();
    ctx.ellipse(centerX, 6, 1.5, 2.8, 0, 0, Math.PI * 2);
    ctx.fill();

    for (const engineX of [centerX - 14, centerX + 14]) {
        ctx.fillStyle = "#142c31";
        ctx.beginPath();
        ctx.roundRect(engineX - 3, player.height - 5, 6, 8, 2);
        ctx.fill();
        ctx.fillStyle = skin.engine;
        ctx.beginPath();
        ctx.moveTo(engineX - 2, player.height + 1);
        ctx.lineTo(engineX + 2, player.height + 1);
        ctx.lineTo(engineX, player.height + flameLength);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
    }

    if (shieldCharges > 0 || Date.now() < playerInvulnerableUntil) {
        ctx.save();
        ctx.strokeStyle = shieldCharges > 0 ? "rgba(84, 160, 255, 0.8)" : "rgba(70, 229, 207, 0.45)";
        ctx.lineWidth = 2;
        ctx.shadowColor = "#54a0ff";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(
            player.x + player.width / 2,
            player.y + player.height / 2,
            player.width * 0.72,
            player.height * 1.05,
            0,
            0,
            Math.PI * 2
        );
        ctx.stroke();
        ctx.restore();
    }
}

//=====================
//DESENHO TIROS
//=====================

function drawObstacles() {
    obstacles.forEach((obstacle) => {
        const integrity = obstacle.health / MAX_OBSTACLE_HEALTH;
        const hot = integrity < 0.34;
        const worn = integrity < 0.67;
        ctx.save();
        ctx.translate(obstacle.x, obstacle.y);
        ctx.shadowColor = hot ? "#e0532f" : "#b0a486";
        ctx.shadowBlur = 6;
        // corpo de placas
        ctx.fillStyle = hot ? "#2a120c" : worn ? "#2e2419" : "#33291f";
        ctx.fillRect(0, 6, obstacle.width, obstacle.height - 6);
        // topo chanfrado
        ctx.fillStyle = hot ? "#38150d" : worn ? "#3a2c1c" : "#453622";
        ctx.beginPath();
        ctx.moveTo(0, 6);
        ctx.lineTo(6, 0);
        ctx.lineTo(obstacle.width - 6, 0);
        ctx.lineTo(obstacle.width, 6);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        // bisel + treliça diagonal
        ctx.strokeStyle = "rgba(233, 199, 150, 0.2)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(1, 7, obstacle.width - 2, obstacle.height - 8);
        ctx.strokeStyle = "rgba(200, 176, 144, 0.35)";
        ctx.beginPath();
        ctx.moveTo(6, obstacle.height - 8);
        ctx.lineTo(obstacle.width - 6, 10);
        ctx.moveTo(obstacle.width - 6, obstacle.height - 8);
        ctx.lineTo(6, 10);
        ctx.stroke();
        // rachaduras quando bem danificado
        if (worn) {
            ctx.strokeStyle = "rgba(6, 3, 2, 0.9)";
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(obstacle.width * 0.3, 8);
            ctx.lineTo(obstacle.width * 0.38, 16);
            ctx.lineTo(obstacle.width * 0.32, 24);
            ctx.moveTo(obstacle.width * 0.62, 10);
            ctx.lineTo(obstacle.width * 0.56, 18);
            ctx.stroke();
        }
        // buracos brilhando quando quase destruído
        if (hot) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.beginPath();
            ctx.arc(obstacle.width * 0.5, 16, 7, 0, Math.PI * 2);
            ctx.arc(obstacle.width * 0.18, 21, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#e0532f";
            ctx.strokeRect(0, 6, obstacle.width, obstacle.height - 6);
        }
        // medidor de integridade
        ctx.fillStyle = "#241a10";
        ctx.fillRect(6, obstacle.height + 4, obstacle.width - 12, 3);
        ctx.fillStyle = hot ? "#e0532f" : "#c8b090";
        ctx.fillRect(6, obstacle.height + 4, (obstacle.width - 12) * integrity, 3);
        ctx.restore();
    });
}

function drawBullets() {
    bullets.forEach((bullet) => {
        ctx.save();
        ctx.translate(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2);
        ctx.shadowColor = bullet.color || playerSkins[selectedSkin].hull;
        ctx.shadowBlur = 10;
        ctx.fillStyle = bullet.color || PALETTE.accentBright;
        if (bullet.kind === "pulse") {
            ctx.beginPath();
            ctx.roundRect(-bullet.width / 2, -bullet.height / 2, bullet.width, bullet.height, 3);
            ctx.fill();
            ctx.fillStyle = "#effff8";
            ctx.fillRect(-1.2, -bullet.height / 2 + 3, 2.4, bullet.height - 6);
        } else if (bullet.kind === "missile") {
            ctx.rotate(Math.atan2(bullet.vy, bullet.vx) + Math.PI / 2);
            ctx.beginPath();
            ctx.moveTo(0, -bullet.height / 2);
            ctx.lineTo(bullet.width / 2, 2);
            ctx.lineTo(2, bullet.height / 2);
            ctx.lineTo(-2, bullet.height / 2);
            ctx.lineTo(-bullet.width / 2, 2);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = "#fff1d2";
            ctx.fillRect(-1, -2, 2, 6);
        } else {
            ctx.beginPath();
            ctx.moveTo(0, -bullet.height / 2);
            ctx.lineTo(bullet.width / 2, -bullet.height / 5);
            ctx.lineTo(bullet.width / 2, bullet.height / 2);
            ctx.lineTo(-bullet.width / 2, bullet.height / 2);
            ctx.lineTo(-bullet.width / 2, -bullet.height / 5);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = "#f3fff9";
            ctx.fillRect(-0.8, -bullet.height / 3, 1.6, bullet.height / 2);
        }
        ctx.restore();
    });

    enemyBullets.forEach((bullet) => {
        const centerX = bullet.x + bullet.width / 2;
        const centerY = bullet.y + bullet.height / 2;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(bullet.angle || 0);

        if (bullet.type === "orb") {
            ctx.shadowColor = PALETTE.amber;
            ctx.shadowBlur = 9;
            ctx.fillStyle = "#ad654e";
            ctx.beginPath();
            ctx.arc(0, 0, bullet.width / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#e6a86d";
            ctx.beginPath();
            ctx.arc(-1, -1, bullet.width / 3.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#fff0c8";
            ctx.beginPath();
            ctx.arc(-2, -3, bullet.width / 7, 0, Math.PI * 2);
            ctx.fill();
        } else if (bullet.type === "rocket") {
            ctx.shadowColor = "#e0532f";
            ctx.shadowBlur = 10;
            ctx.fillStyle = "#b03020";
            ctx.beginPath();
            ctx.moveTo(0, -bullet.height);
            ctx.lineTo(bullet.width / 2, 2);
            ctx.lineTo(2, bullet.height);
            ctx.lineTo(-2, bullet.height);
            ctx.lineTo(-bullet.width / 2, 2);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#ffcf8f";
            ctx.fillRect(-1.2, 2, 2.4, 5);
        } else if (bullet.type === "mine") {
            ctx.shadowColor = "#83d9d0";
            ctx.shadowBlur = 15;
            ctx.fillStyle = "#4ca99d";
            ctx.beginPath();
            for (let point = 0; point < 8; point++) {
                const radius = point % 2 === 0 ? bullet.width / 2 : bullet.width / 3.1;
                const angle = point * Math.PI / 4;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                if (point === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = "#d7fff3";
            ctx.beginPath();
            ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
            ctx.fill();
        } else if (bullet.type === "bolt") {
            ctx.shadowColor = "#df816d";
            ctx.shadowBlur = 12;
            ctx.fillStyle = "#df816d";
            ctx.beginPath();
            ctx.moveTo(0, -bullet.height);
            ctx.lineTo(bullet.width / 2, 0);
            ctx.lineTo(0, bullet.height);
            ctx.lineTo(-bullet.width / 2, 0);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = "#fff0dc";
            ctx.fillRect(-1, -bullet.height / 2, 2, bullet.height);
        } else {
            ctx.shadowColor = "#f2d390";
            ctx.shadowBlur = 10;
            ctx.fillStyle = "#f2d390";
            ctx.beginPath();
            ctx.moveTo(0, -bullet.height);
            ctx.lineTo(bullet.width / 2, 0);
            ctx.lineTo(0, bullet.height);
            ctx.lineTo(-bullet.width / 2, 0);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    });
}

//=====================
//DESENHO INIMIGOS
//=====================

function drawBackground() {
    ctx.fillStyle = spaceGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const star of stars) {
        star.y += star.speed * frameScale;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }

        ctx.globalAlpha = star.opacity * (0.75 + Math.sin(Date.now() / 500 + star.x) * 0.25);
        ctx.fillStyle = ["#ff9a4a", "#d43a26", "#e6d5b3"][Math.floor(star.x) % 3];
        ctx.fillRect(star.x, star.y, star.size, star.size);
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = "rgba(150, 66, 38, 0.12)";
    ctx.lineWidth = 1;
    for (let y = 96; y < canvas.height; y += 48) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    for (let x = 16; x < canvas.width; x += 48) {
        ctx.beginPath();
        ctx.moveTo(x, 86);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    ctx.fillStyle = "rgba(224, 83, 47, 0.05)";
    ctx.fillRect(0, 86, canvas.width, 2);
    ctx.fillStyle = "rgba(255, 190, 140, 0.03)";
    for (let y = 0; y < canvas.height; y += 5) {
        ctx.fillRect(0, y, canvas.width, 1);
    }
}

function drawEnemies() {
    enemies.forEach((enemy) => {
        if (!enemy.alive) return;

        ctx.save();
        ctx.translate(enemy.x, enemy.y);

        const centerX = enemy.width / 2;
        const centerY = enemy.height / 2;
        const style = ENEMY_STYLES[enemy.type];
        const sprite = enemySprites[enemy.type];
        if (sprite && sprite.complete && sprite.naturalWidth > 0) {
            ctx.filter = "saturate(1.1) contrast(1.2)";
            ctx.shadowColor = style.color;
            ctx.shadowBlur = 5;
            ctx.drawImage(sprite, -4, -7, enemy.width + 8, enemy.height + 14);
            ctx.restore();
            return;
        }

        ctx.shadowColor = style.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = style.color;
        ctx.strokeStyle = style.color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        if (enemy.type === "bomber") {
            ctx.moveTo(centerX, 2);
            ctx.lineTo(enemy.width - 3, 8);
            ctx.lineTo(enemy.width - 1, centerY + 3);
            ctx.lineTo(enemy.width - 8, enemy.height - 1);
            ctx.lineTo(8, enemy.height - 1);
            ctx.lineTo(1, centerY + 3);
            ctx.lineTo(3, 8);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#70493b";
            ctx.beginPath();
            ctx.ellipse(centerX, centerY + 1, 7, 9, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = style.core;
            ctx.beginPath();
            ctx.arc(centerX, centerY + 1, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ffd166";
            ctx.fillRect(5, 5, 5, 3);
            ctx.fillRect(enemy.width - 10, 5, 5, 3);
        } else if (enemy.type === "drone") {
            ctx.moveTo(centerX, 1);
            ctx.lineTo(enemy.width - 2, centerY - 2);
            ctx.lineTo(centerX + 9, centerY + 2);
            ctx.lineTo(centerX, enemy.height - 1);
            ctx.lineTo(centerX - 9, centerY + 2);
            ctx.lineTo(2, centerY - 2);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#17443f";
            ctx.beginPath();
            ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = style.core;
            ctx.beginPath();
            ctx.arc(centerX, centerY, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = style.color;
            ctx.beginPath();
            ctx.moveTo(8, centerY);
            ctx.lineTo(3, enemy.height - 1);
            ctx.moveTo(enemy.width - 8, centerY);
            ctx.lineTo(enemy.width - 3, enemy.height - 1);
            ctx.stroke();
        } else if (enemy.type === "striker") {
            ctx.moveTo(centerX, 1);
            ctx.lineTo(enemy.width - 2, enemy.height - 2);
            ctx.lineTo(centerX, enemy.height - 8);
            ctx.lineTo(2, enemy.height - 2);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#373747";
            ctx.beginPath();
            ctx.moveTo(centerX, 7);
            ctx.lineTo(centerX + 6, centerY);
            ctx.lineTo(centerX, enemy.height - 4);
            ctx.lineTo(centerX - 6, centerY);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = style.core;
            ctx.fillRect(centerX - 2, centerY - 2, 4, 4);
            ctx.strokeStyle = style.color;
            ctx.beginPath();
            ctx.moveTo(8, 8);
            ctx.lineTo(2, 3);
            ctx.moveTo(enemy.width - 8, 8);
            ctx.lineTo(enemy.width - 2, 3);
            ctx.stroke();
        } else {
            ctx.moveTo(centerX, 1);
            ctx.lineTo(enemy.width - 5, 7);
            ctx.lineTo(enemy.width - 1, centerY);
            ctx.lineTo(enemy.width - 7, enemy.height - 2);
            ctx.lineTo(centerX + 5, enemy.height - 5);
            ctx.lineTo(centerX, enemy.height - 1);
            ctx.lineTo(centerX - 5, enemy.height - 5);
            ctx.lineTo(7, enemy.height - 2);
            ctx.lineTo(1, centerY);
            ctx.lineTo(5, 7);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#243538";
            ctx.beginPath();
            ctx.moveTo(centerX - 10, centerY - 1);
            ctx.lineTo(centerX - 6, centerY - 6);
            ctx.lineTo(centerX + 6, centerY - 6);
            ctx.lineTo(centerX + 10, centerY - 1);
            ctx.lineTo(centerX + 6, centerY + 5);
            ctx.lineTo(centerX - 6, centerY + 5);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = style.core;
            ctx.fillRect(centerX - 6, centerY - 1, 12, 2);
            ctx.fillStyle = style.color;
            ctx.fillRect(centerX - 2, centerY - 2, 4, 4);
            ctx.strokeStyle = style.color;
            ctx.beginPath();
            ctx.moveTo(8, 9);
            ctx.lineTo(3, 3);
            ctx.lineTo(11, 6);
            ctx.moveTo(enemy.width - 8, 9);
            ctx.lineTo(enemy.width - 3, 3);
            ctx.lineTo(enemy.width - 11, 6);
            ctx.moveTo(7, enemy.height - 3);
            ctx.lineTo(12, enemy.height - 7);
            ctx.moveTo(enemy.width - 7, enemy.height - 3);
            ctx.lineTo(enemy.width - 12, enemy.height - 7);
            ctx.stroke();
        }

        ctx.restore();
    });
}

//=====================
//HUD
//=====================

function drawHUD() {
    ctx.save();
    drawTechPanel(14, 12, canvas.width - 28, 72, PALETTE.violet, "rgba(35, 22, 19, 0.98)");

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = `bold 10px ${HUD_FONT}`;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText("CRÉDITOS", 31, 29);
    ctx.fillText("ONDA", canvas.width / 2 - 42, 29);
    ctx.fillText("VIDAS", canvas.width - 205, 29);

    ctx.font = `bold 21px ${TITLE_FONT}`;
    ctx.fillStyle = PALETTE.accentBright;
    ctx.fillText(String(score).padStart(6, "0"), 31, 57);
    ctx.fillText(String(wave).padStart(2, "0"), canvas.width / 2 - 27, 57);
    if (combo >= 3) {
        const multiplier = Math.min(5, 1 + Math.floor(combo / 5));
        ctx.textAlign = "center";
        ctx.font = `bold 10px ${HUD_FONT}`;
        ctx.fillStyle = Date.now() < comboExpiresAt ? "#e0532f" : "rgba(143, 124, 99, 0.5)";
        ctx.fillText(`COMBO ${combo}${multiplier > 1 ? " x" + multiplier : ""}`, canvas.width / 2, 73);
        ctx.textAlign = "left";
    }

    for (let i = 0; i < MAX_LIVES; i++) {
        const x = canvas.width - 205 + i * 22;
        ctx.fillStyle = i < lives ? PALETTE.accent : "rgba(143, 124, 99, 0.2)";
        ctx.shadowColor = i < lives ? PALETTE.accent : "transparent";
        ctx.shadowBlur = i < lives ? 8 : 0;
        ctx.beginPath();
        ctx.arc(x + 10, 55, 8, Math.PI, 0);
        ctx.lineTo(x + 18, 63);
        ctx.lineTo(x + 2, 63);
        ctx.closePath();
        ctx.fill();
        if (i < lives) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#180805";
            ctx.fillRect(x + 4, 54, 12, 3.5);
        }
    }
    ctx.shadowBlur = 0;
    ctx.textAlign = "center";
    ctx.font = `10px ${HUD_FONT}`;
    ctx.fillStyle = shieldCharges > 0 ? PALETTE.accent : PALETTE.muted;
    ctx.fillText(`BLINDAGEM ${shieldCharges}`, canvas.width - 282, 57);
    ctx.textAlign = "left";
    ctx.restore();
}

function drawHomeButton() {
    drawTechButton(getHomeButtonBounds(), "MENU", false);
}

function roundedRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
}

function drawTechPanel(x, y, width, height, accent = PALETTE.accent, fill = PALETTE.panel) {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, width, height);

    // bisel de metal: borda clara em cima/esquerda, sombra embaixo/direita
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(233, 199, 150, 0.16)";
    ctx.beginPath();
    ctx.moveTo(x + 1, y + height - 2);
    ctx.lineTo(x + 1, y + 1);
    ctx.lineTo(x + width - 2, y + 1);
    ctx.stroke();
    ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
    ctx.beginPath();
    ctx.moveTo(x + width - 2, y + 2);
    ctx.lineTo(x + width - 2, y + height - 2);
    ctx.lineTo(x + 2, y + height - 2);
    ctx.stroke();

    // traço de destaque no canto
    ctx.strokeStyle = accent;
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 5);
    ctx.lineTo(x + Math.min(56, width * 0.2), y + 5);
    ctx.moveTo(x + 5, y + 5);
    ctx.lineTo(x + 5, y + Math.min(32, height * 0.4));
    ctx.stroke();

    // rebites nos cantos
    ctx.fillStyle = accent;
    const rivets = [
        [11, 11],
        [width - 16, 11],
        [11, height - 16],
        [width - 16, height - 16],
    ];
    for (const [rx, ry] of rivets) {
        if (height < 24) break;
        ctx.fillRect(x + rx, y + ry, 5, 5);
    }
}

function drawTechButton(bounds, label, primary = true) {
    ctx.save();
    drawTechPanel(
        bounds.x,
        bounds.y,
        bounds.width,
        bounds.height,
        primary ? PALETTE.accent : PALETTE.amber,
        primary ? "rgba(64, 17, 10, 0.98)" : "rgba(18, 12, 10, 0.98)"
    );
    if (primary) {
        ctx.fillStyle = "rgba(255, 241, 189, 0.08)";
        ctx.fillRect(bounds.x + 4, bounds.y + 4, bounds.width - 8, bounds.height - 8);
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = primary ? PALETTE.accentBright : PALETTE.text;
    ctx.font = `bold 14px ${HUD_FONT}`;
    ctx.fillText(label, bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    ctx.restore();
}

function drawSkull(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.shadowColor = "rgba(201, 51, 31, 0.55)";
    ctx.shadowBlur = 16;
    ctx.fillStyle = "#ded0ae";
    ctx.beginPath();
    ctx.moveTo(-11, 2);
    ctx.arc(0, 2, 11, Math.PI, 0);
    ctx.lineTo(10, 7);
    ctx.lineTo(6, 8);
    ctx.lineTo(5, 13);
    ctx.lineTo(-5, 13);
    ctx.lineTo(-6, 8);
    ctx.lineTo(-10, 7);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#180805";
    ctx.beginPath();
    ctx.arc(-4.5, 1, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(4.5, 1, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.lineTo(2, 8.5);
    ctx.lineTo(-2, 8.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-3.4, 10, 1.7, 3.5);
    ctx.fillRect(-0.9, 10, 1.7, 3.5);
    ctx.fillRect(1.6, 10, 1.7, 3.5);
    ctx.restore();
}

function drawStartScreen() {
    ctx.fillStyle = "rgba(5, 3, 3, 0.82)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const glow = ctx.createRadialGradient(canvas.width / 2, 240, 30, canvas.width / 2, 240, 430);
    glow.addColorStop(0, "rgba(201, 51, 31, 0.35)");
    glow.addColorStop(1, "rgba(201, 51, 31, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    drawTechPanel(90, 102, 620, 395, "#7d1f14", "rgba(9, 6, 5, 0.92)");

    drawSkull(canvas.width / 2, 162, 1.4);

    ctx.font = `bold 11px ${HUD_FONT}`;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText("UAC // BASE DE FOGO: HELLGATE — SETOR 07", canvas.width / 2, 206);

    ctx.shadowColor = "#2a0705";
    ctx.shadowBlur = 26;
    ctx.fillStyle = "#c9331f";
    ctx.font = `bold 52px ${TITLE_FONT}`;
    ctx.fillText("VOID FRONTIER", canvas.width / 2, 256);
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#7d1f14";
    ctx.fillRect(canvas.width / 2 - 82, 288, 164, 3);

    ctx.fillStyle = PALETTE.text;
    ctx.font = `16px ${HUD_FONT}`;
    ctx.fillText("Mate os demônios. Sobreviva à invasão.", canvas.width / 2, 312);
    ctx.font = `13px ${HUD_FONT}`;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText("Mova: setas ou W A S D     Atire: ESPAÇO", canvas.width / 2, 336);

    const button = getStartButtonBounds();
    drawTechButton(button, "INICIAR MISSÃO");
    const catalogButton = getCatalogButtonBounds();
    drawTechButton(catalogButton, "MANUAL DE COMBATE", false);
    const podiumButton = getPodiumButtonBounds();
    drawTechButton(podiumButton, "PÓDIO DA FÚRIA", false);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
}

function drawCatalog() {
    ctx.fillStyle = "rgba(3, 12, 16, 0.94)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = PALETTE.text;
    ctx.shadowColor = PALETTE.accent;
    ctx.shadowBlur = 16;
    ctx.font = `bold 31px ${HUD_FONT}`;
    ctx.fillText("MANUAL DE COMBATE", canvas.width / 2, 63);
    ctx.shadowBlur = 0;
    ctx.font = `13px ${HUD_FONT}`;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText("Arsenal, bestiário infernal e naves disponíveis", canvas.width / 2, 94);

    const columns = [
        { x: 24, title: "ARSENAL", color: "#e0532f" },
        { x: 280, title: "BESTIÁRIO", color: "#d43a26" },
        { x: 536, title: "NAVES", color: "#d9a44a" },
    ];
    for (const column of columns) {
        drawTechPanel(column.x, 120, 240, 376, column.color, "rgba(12, 8, 6, 0.96)");
        ctx.fillStyle = column.color;
        ctx.font = `bold 13px ${HUD_FONT}`;
        ctx.fillText(column.title, column.x + 120, 145);
    }

    ctx.textAlign = "left";
    ctx.font = `bold 10px ${HUD_FONT}`;
    shopItems.forEach((item, index) => {
        const y = 172 + index * 29;
        ctx.fillStyle = item.color;
        ctx.font = `bold 10px ${HUD_FONT}`;
        ctx.fillText(item.title, 38, y, 210);
        ctx.font = `9px ${HUD_FONT}`;
        ctx.fillStyle = PALETTE.muted;
        ctx.fillText(item.description, 38, y + 13, 210);
        ctx.font = `bold 10px ${HUD_FONT}`;
    });

    const enemyCatalog = [
        ["IMP", "Investe contra sua posição cusperando agulhas de fogo."],
        ["CACODEMON", "Flutua acima da formação e sopra leques de orbes. Mais onda, mais orbes."],
        ["ALMA PERDIDA", "Mergulho kamikaze na sua posição, soltando minas de fogo."],
        ["REVENANTE", "Atira raios em pares e lança foguetes teleguiados periodicamente."],
    ];
    enemyCatalog.forEach(([name, description], index) => {
        const y = 184 + index * 70;
        ctx.fillStyle = ENEMY_STYLES[ENEMY_TYPES[index]].color;
        ctx.font = `bold 12px ${HUD_FONT}`;
        ctx.fillText(name, 294, y);
        ctx.fillStyle = PALETTE.muted;
        ctx.font = `11px ${HUD_FONT}`;
        ctx.fillText(description, 294, y + 20, 210);
        ctx.fillStyle = ENEMY_STYLES[ENEMY_TYPES[index]].color;
        ctx.beginPath();
        ctx.arc(496, y, 5, 0, Math.PI * 2);
        ctx.fill();
    });

    Object.entries(playerSkins).forEach(([id, skin], index) => {
        const y = 184 + index * 66;
        ctx.fillStyle = skin.hull;
        ctx.beginPath();
        ctx.moveTo(552, y - 8);
        ctx.lineTo(563, y + 8);
        ctx.lineTo(552, y + 4);
        ctx.lineTo(541, y + 8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = PALETTE.text;
        ctx.font = `bold 11px ${HUD_FONT}`;
        ctx.fillText(skin.name, 572, y - 3);
        ctx.fillStyle = PALETTE.muted;
        ctx.font = `9px ${HUD_FONT}`;
        ctx.fillText(skin.perk, 572, y + 13, 198);
        ctx.fillStyle = selectedSkin === id ? "#e0532f" : ownedSkins.has(id) ? "#8f7c63" : "#a3502e";
        ctx.font = `bold 9px ${HUD_FONT}`;
        ctx.fillText(
            selectedSkin === id ? "EQUIPADA" : ownedSkins.has(id) ? "ADQUIRIDA" : "COMPRE NA FORJA UAC",
            572,
            y + 27
        );
    });

    const closeButton = getCatalogCloseBounds();
    drawTechButton(closeButton, "VOLTAR AO MENU", false);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
}

function drawGameOver() {
    ctx.fillStyle = "rgba(5, 3, 3, 0.86)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const glow = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 30, canvas.width / 2, canvas.height / 2, 390);
    glow.addColorStop(0, "rgba(201, 51, 31, 0.3)");
    glow.addColorStop(1, "rgba(201, 51, 31, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    drawTechPanel(170, 185, 460, 300, "#7d1f14", "rgba(10, 6, 5, 0.96)");

    drawSkull(canvas.width / 2, 244, 1.1);

    ctx.fillStyle = "#c9331f";
    ctx.shadowColor = "#2a0705";
    ctx.shadowBlur = 18;
    ctx.font = `bold 36px ${TITLE_FONT}`;
    ctx.fillText(gameWon ? "MISSÃO CONCLUÍDA" : "VOCÊ FOI MASSACRADO", canvas.width / 2, 298);
    ctx.shadowBlur = 0;
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `14px ${HUD_FONT}`;
    ctx.fillText(`${gameWon ? "Invasão repelida em 10 setores · " : ""}Pontuação final: ${String(score).padStart(5, "0")}`, canvas.width / 2, 322);

    if (!scoreSaved) {
        ctx.font = `bold 12px ${HUD_FONT}`;
        ctx.fillStyle = "#ffcf8f";
        ctx.fillText("GRAVE SUA MATANÇA NO PÓDIO", canvas.width / 2, 352);

        for (let i = 0; i < 3; i++) {
            const boxX = canvas.width / 2 - 80 + i * 58;
            const active = i === playerName.length;
            ctx.strokeStyle = active ? "#e0532f" : "rgba(200, 176, 144, 0.45)";
            ctx.lineWidth = active ? 2.5 : 1.5;
            ctx.strokeRect(boxX, 364, 50, 54);
            if (playerName[i]) {
                ctx.fillStyle = "#e6d5b3";
                ctx.font = `bold 28px ${TITLE_FONT}`;
                ctx.fillText(playerName[i], boxX + 25, 390);
            } else if (active && Math.floor(Date.now() / 400) % 2 === 0) {
                ctx.fillStyle = "#e0532f";
                ctx.fillRect(boxX + 20, 380, 3, 22);
            }
            ctx.fillStyle = "#8f7c63";
            ctx.font = `bold 10px ${HUD_FONT}`;
            ctx.fillText(String(i + 1), boxX + 25, 430);
        }

        ctx.fillStyle = PALETTE.muted;
        ctx.font = `11px ${HUD_FONT}`;
        ctx.fillText("Digite A-Z · BACKSPACE apaga · ENTER grava · ESC pula", canvas.width / 2, 458);
    } else {
        const button = getRestartButtonBounds();
        drawTechButton(button, "REINICIAR MISSÃO");
        const podiumButton = getGameOverPodiumButtonBounds();
        drawTechButton(podiumButton, "VER O PÓDIO", false);
        ctx.fillStyle = PALETTE.muted;
        ctx.font = `11px ${HUD_FONT}`;
        ctx.fillText("GRAVADO NO PÓDIO — tecla P reabre", canvas.width / 2, 477);
    }

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
}

function drawPodium() {
    ctx.fillStyle = "rgba(5, 3, 3, 0.95)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const glow = ctx.createRadialGradient(canvas.width / 2, 200, 30, canvas.width / 2, 200, 400);
    glow.addColorStop(0, "rgba(201, 51, 31, 0.3)");
    glow.addColorStop(1, "rgba(201, 51, 31, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    drawTechPanel(150, 120, 500, 400, "#7d1f14", "rgba(9, 6, 5, 0.96)");

    ctx.fillStyle = "#c9331f";
    ctx.shadowColor = "#2a0705";
    ctx.shadowBlur = 18;
    ctx.font = `bold 34px ${TITLE_FONT}`;
    ctx.fillText("PÓDIO DA FÚRIA", canvas.width / 2, 168);
    ctx.shadowBlur = 0;
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `12px ${HUD_FONT}`;
    ctx.fillText("As maiores matanças ficam gravadas aqui", canvas.width / 2, 196);

    const medals = [
        { letter: "1", color: "#d9a44a", glow: "#ffe9b0" },
        { letter: "2", color: "#b0a486", glow: "#ece5d0" },
        { letter: "3", color: "#a3502e", glow: "#ffb37a" },
    ];
    const list = podiumScores.slice(0, 5);

    if (list.length === 0) {
        ctx.fillStyle = PALETTE.muted;
        ctx.font = `14px ${HUD_FONT}`;
        ctx.fillText("Nenhum nome gravado ainda.", canvas.width / 2, 320);
        ctx.fillText("Sobreviva a uma invasão e marque seu nome.", canvas.width / 2, 344);
    }

    list.forEach((entry, index) => {
        const y = 244 + index * 46;
        const medal = medals[index];
        const you = entry.born === lastEntryId;

        if (you) {
            ctx.fillStyle = "rgba(201, 51, 31, 0.22)";
            ctx.fillRect(190, y - 17, 420, 38);
            ctx.strokeStyle = "#e0532f";
            ctx.lineWidth = 1;
            ctx.strokeRect(190, y - 17, 420, 38);
        }

        if (medal) {
            ctx.save();
            ctx.shadowColor = medal.glow;
            ctx.shadowBlur = 12;
            ctx.fillStyle = medal.color;
            ctx.beginPath();
            ctx.moveTo(210, y - 11);
            ctx.lineTo(222, y);
            ctx.lineTo(210, y + 11);
            ctx.lineTo(198, y);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            ctx.fillStyle = "#2a0705";
            ctx.font = `bold 11px ${HUD_FONT}`;
            ctx.fillText(medal.letter, 210, y + 0.5);
        } else {
            ctx.fillStyle = PALETTE.muted;
            ctx.font = `bold 14px ${HUD_FONT}`;
            ctx.fillText(`${index + 1}.`, 210, y);
        }

        ctx.textAlign = "left";
        ctx.fillStyle = you ? "#e0532f" : "#e6d5b3";
        ctx.font = `bold 20px ${TITLE_FONT}`;
        ctx.fillText(String(entry.name).slice(0, 3), 268, y);

        ctx.fillStyle = PALETTE.muted;
        ctx.font = `10px ${HUD_FONT}`;
        ctx.fillText(`SETOR ${String(entry.wave).padStart(2, "0")}`, 272 + 52, y);
        if (you) {
            ctx.fillStyle = "#e0532f";
            ctx.fillText("VOCÊ", 384, y);
        }

        ctx.textAlign = "right";
        ctx.fillStyle = medal ? medal.color : PALETTE.text;
        ctx.font = `bold 18px ${TITLE_FONT}`;
        ctx.fillText(String(entry.score).padStart(5, "0"), 600, y);
        ctx.textAlign = "center";
    });

    const closeButton = getPodiumCloseBounds();
    drawTechButton(closeButton, "VOLTAR", false);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
}

function drawShop() {
    ctx.fillStyle = "rgba(5, 3, 3, 0.97)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    ctx.shadowColor = "#2a0705";
    ctx.shadowBlur = 14;
    ctx.fillStyle = "#c9331f";
    ctx.font = `bold 34px ${TITLE_FONT}`;
    ctx.fillText("FORJA UAC", 46, 62);
    ctx.shadowBlur = 0;
    ctx.font = `12px ${HUD_FONT}`;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(`Onda ${wave} concluída — gaste seus créditos antes de avançar`, 46, 94);

    // selo de créditos disponíveis
    drawTechPanel(canvas.width - 246, 38, 200, 46, PALETTE.amber, "rgba(18, 12, 10, 0.98)");
    ctx.textAlign = "center";
    ctx.font = `bold 9px ${HUD_FONT}`;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText("CRÉDITOS DISPONÍVEIS", canvas.width - 146, 52);
    ctx.font = `bold 22px ${TITLE_FONT}`;
    ctx.fillStyle = PALETTE.accentBright;
    ctx.fillText(String(score).padStart(5, "0"), canvas.width - 146, 70);

    shopItems.forEach((item, index) => {
        const card = getShopCardBounds(index);
        const cost = getPowerUpCost(item);
        const isSkin = item.id.startsWith("skin-");
        const skinId = isSkin ? item.id.slice(5) : null;
        const isOwnedSkin = isSkin && ownedSkins.has(skinId);
        const equipped = isSkin && selectedSkin === skinId;
        const soldOut = isItemMaxed(item);
        const canAfford = isOwnedSkin || (score >= cost && !soldOut);

        drawTechPanel(
            card.x,
            card.y,
            card.width,
            card.height,
            equipped ? PALETTE.accent : canAfford ? item.color : "rgba(120, 60, 40, 0.55)",
            "rgba(16, 11, 9, 0.97)"
        );

        ctx.textAlign = "left";
        ctx.font = `bold 8px ${HUD_FONT}`;
        ctx.fillStyle = item.color;
        ctx.fillText(item.group, card.x + 10, card.y + 14);

        // selo de preço
        const chipW = equipped ? 70 : 62;
        ctx.textAlign = "right";
        ctx.font = `bold 10px ${HUD_FONT}`;
        if (equipped) {
            ctx.fillStyle = PALETTE.accent;
            ctx.fillText("✓ EM USO", card.x + card.width - 10, card.y + 14);
        } else if (soldOut) {
            ctx.fillStyle = "#8f7c63";
            ctx.fillText(isOwnedSkin ? "ADQUIRIDA" : "MÁXIMO", card.x + card.width - 10, card.y + 14);
        } else {
            const chipY = card.y + 4;
            ctx.beginPath();
            ctx.rect(card.x + card.width - chipW, chipY, chipW, 18);
            ctx.fillStyle = canAfford ? "rgba(64, 17, 10, 0.9)" : "rgba(10, 6, 5, 0.9)";
            ctx.fill();
            ctx.strokeStyle = canAfford ? item.color : "rgba(120, 60, 40, 0.7)";
            ctx.stroke();
            ctx.fillStyle = canAfford ? "#ffffff" : PALETTE.muted;
            ctx.fillText(`${cost}`, card.x + card.width - 10, card.y + 13);
        }

        ctx.textAlign = "left";
        ctx.fillStyle = PALETTE.text;
        ctx.font = `bold 11px ${HUD_FONT}`;
        ctx.fillText(item.title, card.x + 10, card.y + 32, card.width - 24);

        ctx.fillStyle = PALETTE.muted;
        ctx.font = `9px ${HUD_FONT}`;
        ctx.fillText(item.description, card.x + 10, card.y + 47, card.width - 24);

        if (!isSkin) {
            drawLevelPips(card.x + 10, card.y + 56, item);
        }

        ctx.textAlign = "center";
        ctx.font = `9px ${HUD_FONT}`;
        if (equipped) {
            ctx.fillStyle = PALETTE.accent;
        } else if (soldOut) {
            ctx.fillStyle = PALETTE.muted;
        } else if (canAfford) {
            ctx.fillStyle = PALETTE.text;
        } else {
            ctx.fillStyle = "#ff5d3a";
        }
        ctx.fillText(
            equipped
                ? "" 
                : soldOut && isOwnedSkin
                    ? "COMPRADA" 
                    : soldOut
                        ? "NÍVEL MÁXIMO" 
                        : canAfford
                            ? "CLIQUE PARA COMPRAR"
                            : `FALTAM ${cost - score} CRÉDITOS`,
            card.x + card.width / 2,
            card.y + 74,
            card.width - 16
        );
        ctx.textAlign = "left";
    });

    const button = getContinueButtonBounds();
    drawTechButton(button, `AVANÇAR → ONDA ${wave}`);
    ctx.textAlign = "center";
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `11px ${HUD_FONT}`;
    ctx.fillText("ENTER avança · SHIFT + clique em melhoria vende por 50%", canvas.width / 2, button.y + button.height + 18);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
}

//=====================
//GAME OVER
//=====================

//=====================
//RESET
//=====================

function resetGame() {
    score = 0;
    lives = 3;
    gameOver = false;
    gameWon = false; paused = false;
    gameStarted = true;
    shopOpen = false;
    podiumOpen = false;
    scoreSaved = false;
    playerName = [];
    wave = 1;
    rapidFireLevel = 0;
    spreadShotLevel = 0;
    speedLevel = 0;
    creditLevel = 0;
    pulseLevel = 0;
    missileLevel = 0;
    shieldCharges = 0;
    applySkinStats();
    bullets.length = 0;
    enemyBullets.length = 0;
    pickups.length = 0;
    particles.length = 0;
    popups.length = 0;
    combo = 0;
    comboExpiresAt = 0;
    shakeUntil = 0;
    hurtFlashUntil = 0;
    nextObstacleRegenAt = 0;
    enemySpeed = 1;
    enemyDirection = 1;
    keys.Space = false;
    playerInvulnerableUntil = 0;
    nextPlayerShotAt = 0;
    nextEnemyShotAt = Date.now() + 900;
    waveBanner = { text: "SETOR 01", sub: "Elimine o bestiário antes que chegue até você", until: Date.now() + 2000 };
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 70;
    createEnemies();
    createObstacles();
}

function loadPodiumScores() {
    try {
        const stored = localStorage.getItem(PODIUM_KEY);
        const list = stored ? JSON.parse(stored) : [];
        return Array.isArray(list) ? list.filter((entry) => entry && typeof entry.score === "number") : [];
    } catch {
        return [];
    }
}

function savePodiumScores(list) {
    try {
        localStorage.setItem(PODIUM_KEY, JSON.stringify(list.slice(0, 8)));
    } catch {
        // armazenamento indisponível: o pódio vive só nesta sessão
    }
}

function savePodiumScore() {
    const name = (playerName.join("") || "---").slice(0, 3).toUpperCase();
    const entry = { name, score, wave, born: Date.now() };
    const list = loadPodiumScores();
    list.push(entry);
    list.sort((a, b) => b.score - a.score);
    podiumScores = list.slice(0, 8);
    lastEntryId = entry.born;
    savePodiumScores(podiumScores);
    playerName = [];
    scoreSaved = true;
    podiumOpen = true;
    podiumReturn = "gameover";
}

//=====================
//RENDERIZAÇÃO
//=====================

function drawPickups() {
    const now = Date.now();
    pickups.forEach((pickup) => {
        const bob = Math.sin(now / 300 + pickup.sway) * 2;
        ctx.save();
        ctx.translate(pickup.x, pickup.y + bob);
        if (pickup.kind === "credit") {
            ctx.shadowColor = "#ffcf8f";
            ctx.shadowBlur = 10;
            ctx.fillStyle = "#cf9a3f";
            ctx.beginPath();
            ctx.arc(8, 8, 7.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#ffe9b0";
            ctx.beginPath();
            ctx.arc(8, 8, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#6b4a1e";
            ctx.fillRect(6.6, 4, 2.8, 8);
        } else if (pickup.kind === "shield") {
            ctx.shadowColor = "#79c473";
            ctx.shadowBlur = 10;
            ctx.fillStyle = "#3f7a4a";
            ctx.beginPath();
            ctx.moveTo(8, -1);
            ctx.lineTo(15, 3);
            ctx.lineTo(13, 13);
            ctx.lineTo(8, 17);
            ctx.lineTo(3, 13);
            ctx.lineTo(1, 3);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#eaffdd";
            ctx.fillRect(6.8, 4, 2.4, 8);
            ctx.fillRect(4.2, 6.4, 7.6, 2.4);
        } else {
            ctx.shadowColor = "#e0532f";
            ctx.shadowBlur = 10;
            ctx.fillStyle = "#f2ead2";
            ctx.fillRect(2, 1, 12, 13);
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#c9331f";
            ctx.fillRect(6.4, 3.2, 3.2, 8.6);
            ctx.fillRect(3.8, 5.8, 8.4, 3.2);
        }
        ctx.restore();
    });
}

function drawParticles() {
    const now = Date.now();
    particles.forEach((particle) => {
        const age = (now - particle.born) / particle.life;
        ctx.globalAlpha = Math.max(0, 1 - age);
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    });
    ctx.globalAlpha = 1;
}

function drawPopups() {
    const now = Date.now();
    for (let i = popups.length - 1; i >= 0; i--) {
        const popup = popups[i];
        const age = (now - popup.born) / popup.life;
        if (age >= 1) {
            popups.splice(i, 1);
            continue;
        }
        ctx.globalAlpha = Math.max(0, 1 - age);
        ctx.fillStyle = popup.color;
        ctx.font = `bold 10px ${HUD_FONT}`;
        ctx.textAlign = "center";
        ctx.fillText(popup.text, popup.x, popup.y - age * 22);
        ctx.globalAlpha = 1;
        ctx.textAlign = "left";
    }
}

function drawWaveBanner() {
    if (!waveBanner) return;
    const remaining = waveBanner.until - Date.now();
    if (remaining <= 0) {
        waveBanner = null;
        return;
    }
    ctx.globalAlpha = Math.min(1, remaining / 500);
    ctx.textAlign = "center";
    ctx.fillStyle = "#c9331f";
    ctx.shadowColor = "#2a0705";
    ctx.shadowBlur = 18;
    ctx.font = `bold 34px ${TITLE_FONT}`;
    ctx.fillText(waveBanner.text, canvas.width / 2, 150);
    ctx.shadowBlur = 0;
    ctx.fillStyle = PALETTE.text;
    ctx.font = `12px ${HUD_FONT}`;
    ctx.fillText(waveBanner.sub, canvas.width / 2, 174);
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";
}

function draw() {
    drawBackground();

    if (!gameStarted) {
        if (catalogOpen) {
            drawCatalog();
        } else if (podiumOpen) {
            drawPodium();
        } else {
            drawStartScreen();
        }
        return;
    }

    const now = Date.now();
    ctx.save();
    if (now < shakeUntil) {
        ctx.translate((Math.random() - 0.5) * 7, (Math.random() - 0.5) * 7);
    }

    drawObstacles();
    if (now < playerInvulnerableUntil && Math.floor(now / 100) % 2 === 0) {
        ctx.globalAlpha = 0.35;
    }
    drawPlayer();
    ctx.globalAlpha = 1;
    drawBullets();
    drawEnemies();
    drawPickups();
    drawParticles();
    ctx.restore();

    drawPopups();
    drawHUD();
    drawWaveBanner();

    if (now < hurtFlashUntil) {
        const strength = Math.max(0, 0.24 * (hurtFlashUntil - now) / 420);
        ctx.fillStyle = `rgba(201, 51, 31, ${strength.toFixed(3)})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (gameOver && podiumOpen) {
        drawGameOver();
        drawPodium();
    } else if (gameOver) {
        drawGameOver();
    } else if (shopOpen) {
        drawShop();
    }
    if (!shopOpen && !(gameOver && podiumOpen)) drawHomeButton();
    if (paused && !gameOver) {
        ctx.fillStyle = "rgba(5, 3, 3, 0.78)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillStyle = PALETTE.accentBright; ctx.font = `bold 42px ${TITLE_FONT}`;
        ctx.fillText("JOGO PAUSADO", canvas.width / 2, canvas.height / 2 - 12);
        ctx.fillStyle = PALETTE.text; ctx.font = `13px ${HUD_FONT}`;
        ctx.fillText("Pressione P para continuar", canvas.width / 2, canvas.height / 2 + 32);
        ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    }
}

//=====================
//LOOP PRINCIPAL
//=====================

function gameLoop(timestamp) {
    frameScale = previousFrameTime
        ? Math.min((timestamp - previousFrameTime) / (1000 / 60), 2)
        : 1;
    previousFrameTime = timestamp;

    if (gameStarted && !gameOver && !shopOpen && !paused) {
        updatePlayer();
        if (keys.Space) {
            const skin = playerSkins[selectedSkin];
            const shotInterval = Math.max(150 - (skin.fireFloor || 0), 450 - rapidFireLevel * 85);
            if (Date.now() >= nextPlayerShotAt) {
                shoot();
                nextPlayerShotAt = Date.now() + shotInterval;
            }
        }
        updateBullets();
        updateEnemies();
        detectCollisions();
        updatePickups();
        updateParticles();
        const nowTicks = Date.now();
        if (nowTicks >= nextObstacleRegenAt) {
            nextObstacleRegenAt = nowTicks + 6500;
            for (const obstacle of obstacles) {
                obstacle.health = Math.min(MAX_OBSTACLE_HEALTH, obstacle.health + 1);
            }
        }
    }
    draw();
    requestAnimationFrame(gameLoop);
}

//=====================
//INICIALIZAÇÃO
//=====================

createEnemies();
podiumScores = loadPodiumScores();
gameLoop();