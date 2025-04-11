// --- Элементы DOM ---
const balanceDisplay = document.getElementById('balance');
const betInput = document.getElementById('bet-amount');
const spinButton = document.getElementById('spin-button');
const reelsContainer = document.querySelector('.reels');
const messageDisplay = document.getElementById('message');

// --- Звуки ---
const spinSound = document.getElementById('spin-sound');
const winSound = document.getElementById('win-sound');
const loseSound = document.getElementById('lose-sound');
// Функция для безопасного воспроизведения звука
function playSound(sound) {
    if (sound && typeof sound.play === 'function') {
        sound.currentTime = 0; // Сбрасываем на начало
        sound.play().catch(error => console.log("Ошибка воспроизведения звука:", error));
    }
}

// --- Настройки Игры ---
const SYMBOLS = { // Имена для читаемости
    CHERRY: '🍒', LEMON: '🍋', ORANGE: '🍊',
    GRAPE: '🍇', BELL: '🔔', STAR: '⭐', SEVEN: '7️⃣'
};

// ########## ИЗМЕНЕННЫЙ БЛОК ##########
// Новые ленты барабанов с измененными вероятностями
const REEL_STRIPS = [
    [ // Барабан 1 (Больше 🍒, 🍋, 🍊; меньше 🔔, ⭐; нет 7️⃣) - Длина 25
        SYMBOLS.CHERRY, SYMBOLS.LEMON, SYMBOLS.CHERRY, SYMBOLS.ORANGE, SYMBOLS.GRAPE,
        SYMBOLS.LEMON, SYMBOLS.CHERRY, SYMBOLS.BELL, SYMBOLS.LEMON, SYMBOLS.CHERRY,
        SYMBOLS.ORANGE, SYMBOLS.GRAPE, SYMBOLS.CHERRY, SYMBOLS.LEMON, SYMBOLS.ORANGE,
        SYMBOLS.BELL, SYMBOLS.CHERRY, SYMBOLS.LEMON, SYMBOLS.GRAPE, SYMBOLS.CHERRY,
        SYMBOLS.ORANGE, SYMBOLS.LEMON, SYMBOLS.BELL, SYMBOLS.CHERRY, SYMBOLS.STAR // Только 1 звезда
    ],
    [ // Барабан 2 (Сбалансировано, но 7️⃣ редкая) - Длина 25
        SYMBOLS.LEMON, SYMBOLS.BELL, SYMBOLS.CHERRY, SYMBOLS.GRAPE, SYMBOLS.ORANGE,
        SYMBOLS.LEMON, SYMBOLS.CHERRY, SYMBOLS.BELL, SYMBOLS.STAR, SYMBOLS.GRAPE,
        SYMBOLS.ORANGE, SYMBOLS.CHERRY, SYMBOLS.LEMON, SYMBOLS.GRAPE, SYMBOLS.BELL,
        SYMBOLS.CHERRY, SYMBOLS.LEMON, SYMBOLS.ORANGE, SYMBOLS.CHERRY, SYMBOLS.GRAPE,
        SYMBOLS.LEMON, SYMBOLS.CHERRY, SYMBOLS.ORANGE, SYMBOLS.BELL, SYMBOLS.SEVEN // Только 1 семерка
    ],
    [ // Барабан 3 (Больше 🍒, 🍋, 🍊; меньше 🔔, ⭐ редкая, 7️⃣ есть) - Длина 25
        SYMBOLS.ORANGE, SYMBOLS.CHERRY, SYMBOLS.LEMON, SYMBOLS.GRAPE, SYMBOLS.CHERRY,
        SYMBOLS.BELL, SYMBOLS.LEMON, SYMBOLS.ORANGE, SYMBOLS.CHERRY, SYMBOLS.LEMON,
        SYMBOLS.GRAPE, SYMBOLS.ORANGE, SYMBOLS.CHERRY, SYMBOLS.STAR, SYMBOLS.LEMON,
        SYMBOLS.BELL, SYMBOLS.CHERRY, SYMBOLS.ORANGE, SYMBOLS.LEMON, SYMBOLS.GRAPE,
        SYMBOLS.CHERRY, SYMBOLS.ORANGE, SYMBOLS.LEMON, SYMBOLS.CHERRY, SYMBOLS.SEVEN // Только 1 семерка
    ]
];
// #####################################

const REEL_COUNT = 3;
const SYMBOLS_VISIBLE = 1; // Виден только 1 символ
const LINES_TO_CHECK = 1; // Проверяем только 1 линию
const MIDDLE_LINE_INDEX = 0; // Индекс единственной видимой линии
// Множители выигрыша
const WIN_MULTIPLIERS = {
    [SYMBOLS.CHERRY]: 5, [SYMBOLS.LEMON]: 8, [SYMBOLS.ORANGE]: 10,
    [SYMBOLS.GRAPE]: 15, [SYMBOLS.BELL]: 20, [SYMBOLS.STAR]: 30,
    [SYMBOLS.SEVEN]: 50
};

let currentBalance = 1000;
let currentBet = parseInt(betInput.value);
let isSpinning = false;

// --- Функции ---

// Получаем высоту одного символа
function getSymbolHeight() {
    const cssVar = getComputedStyle(document.documentElement).getPropertyValue('--symbol-container-height');
    if (cssVar) return parseInt(cssVar, 10);
    return 80; // Default
}

// Инициализация барабанов
function createReels() {
    reelsContainer.innerHTML = '';
    const symbolHeight = getSymbolHeight();
    for (let i = 0; i < REEL_COUNT; i++) {
        const reelElement = document.createElement('div');
        reelElement.classList.add('reel');
        const symbolContainer = document.createElement('div');
        symbolContainer.classList.add('reel-symbols');
        const initialSymbols = getSymbolsFromStrip(i, 0, REEL_STRIPS[i].length);
        fillReel(symbolContainer, initialSymbols);
        reelElement.appendChild(symbolContainer);
        reelsContainer.appendChild(reelElement);
        const initialTranslateY = 0;
        symbolContainer.style.transition = 'none';
        symbolContainer.style.transform = `translateY(${initialTranslateY}px)`;
    }
}

// Заполняет контейнер символами
function fillReel(symbolContainer, symbols) {
    symbolContainer.innerHTML = '';
    const symbolHeight = getSymbolHeight();
    symbols.forEach(symbol => {
        const symbolDiv = document.createElement('div');
        symbolDiv.textContent = symbol;
        symbolDiv.style.height = `${symbolHeight}px`;
        symbolContainer.appendChild(symbolDiv);
    });
}

// Получает срез символов из ленты барабана с зацикливанием
function getSymbolsFromStrip(reelIndex, startIndex, count) {
    const strip = REEL_STRIPS[reelIndex];
    const stripLength = strip.length;
    const symbols = [];
    for (let i = 0; i < count; i++) {
        const index = (startIndex + i) % stripLength;
        symbols.push(strip[index]);
    }
    return symbols;
}

// Функция для очистки эффектов выигрыша
function clearEffects() {
    reelsContainer.querySelectorAll('.winning-symbol').forEach(el => {
        el.classList.remove('winning-symbol');
    });
    messageDisplay.classList.remove('flash');
}

// Анимация вращения
async function spinReels() {
    if (isSpinning) return;
    isSpinning = true;
    spinButton.disabled = true;
    messageDisplay.textContent = '';
    messageDisplay.className = 'message';
    clearEffects(); // Очищаем эффекты выигрыша

    playSound(spinSound);

    const symbolHeight = getSymbolHeight();
    const reels = Array.from(reelsContainer.querySelectorAll('.reel'));
    const finalResults = []; // Будет содержать по 1 символу на барабан

    const spinPromises = reels.map(async (reel, i) => {
        const symbolContainer = reel.querySelector('.reel-symbols');
        const strip = REEL_STRIPS[i];
        const stripLength = strip.length;
        const randomStopIndex = Math.floor(Math.random() * stripLength); // Индекс символа, который должен остановиться

        const finalVisibleSymbol = getSymbolsFromStrip(i, randomStopIndex, 1)[0];
        finalResults[i] = [finalVisibleSymbol]; // Сохраняем как массив из одного элемента

        const symbolsForAnimation = getSymbolsFromStrip(i, 0, stripLength);
        fillReel(symbolContainer, symbolsForAnimation);

        symbolContainer.style.transition = 'none';
        const startTranslateY = symbolHeight;
        symbolContainer.style.transform = `translateY(${startTranslateY}px)`;

        await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));

        const animationDuration = 1 + i * 0.3;
        symbolContainer.style.transition = `transform ${animationDuration}s cubic-bezier(0.25, 1, 0.5, 1)`;
        const targetTranslateY = -randomStopIndex * symbolHeight;
        symbolContainer.style.transform = `translateY(${targetTranslateY}px)`;

        await new Promise(resolve => setTimeout(resolve, animationDuration * 1000));
        return finalVisibleSymbol;
    });

    await Promise.all(spinPromises);

    checkWin(finalResults); // Проверяем выигрыш

    isSpinning = false;
    spinButton.disabled = currentBalance < currentBet;
}

// Проверка выигрыша (индекс 0 для единственной линии)
function checkWin(finalReels) {
    // finalReels теперь вида [[s1], [s2], [s3]]
    let totalWinnings = 0;
    const symbol1 = finalReels[0][0]; // Индекс 0 - единственный видимый символ
    const symbol2 = finalReels[1][0];
    const symbol3 = finalReels[2][0];

    if (symbol1 === symbol2 && symbol2 === symbol3) {
        // Выигрыш!
        const multiplier = WIN_MULTIPLIERS[symbol1] || 0;
        totalWinnings = currentBet * multiplier;
        currentBalance += totalWinnings; // Добавляем чистый выигрыш

        messageDisplay.textContent = `ВЫИГРЫШ: ${symbol1} x 3 = ${totalWinnings.toFixed(0)} ₽!`;
        messageDisplay.classList.add('win', 'flash');
        playSound(winSound);

        // Анимация подсветки ЕДИНСТВЕННОГО видимого символа
        const reels = reelsContainer.querySelectorAll('.reel');
        reels.forEach((reel, reelIndex) => {
             const symbolContainer = reel.querySelector('.reel-symbols');
             const symbolElements = symbolContainer.querySelectorAll('div');
             const symbolHeight = getSymbolHeight();
             const currentTranslateY = parseFloat(window.getComputedStyle(symbolContainer).transform.split(',')[5] || '0');
             const visibleDomIndex = Math.round(-currentTranslateY / symbolHeight);

             if (symbolElements[visibleDomIndex]) {
                 symbolElements[visibleDomIndex].classList.add('winning-symbol');
             } else {
                  console.error(`Не найден элемент для подсветки: reel ${reelIndex}, index ${visibleDomIndex}`);
             }
        });

        setTimeout(clearEffects, 1500);

    } else {
        // Проигрыш
        messageDisplay.textContent = 'Мимо!';
        messageDisplay.classList.add('lose');
        // playSound(loseSound);
    }

    balanceDisplay.textContent = Math.floor(currentBalance);
    if (currentBalance < currentBet) {
        spinButton.disabled = true;
        if (totalWinnings === 0) {
            messageDisplay.textContent += ' Недостаточно средств!';
        }
    }
}

// --- Обработчики событий ---
spinButton.addEventListener('click', () => {
    if (isSpinning) return;
    currentBet = parseInt(betInput.value);
    if (isNaN(currentBet) || currentBet < 1) {
         messageDisplay.textContent = `Ставка должна быть не меньше 1 ₽`;
         messageDisplay.className = 'message lose';
         betInput.value = 1;
         currentBet = 1;
         spinButton.disabled = currentBalance < currentBet;
         return;
    }
    if (currentBalance >= currentBet) {
        currentBalance -= currentBet;
        balanceDisplay.textContent = Math.floor(currentBalance);
        spinReels();
    } else {
        messageDisplay.textContent = 'Недостаточно средств!';
        messageDisplay.className = 'message lose';
    }
});

betInput.addEventListener('input', () => {
     let newBet = parseInt(betInput.value);
     if (isNaN(newBet)) newBet = 0;
     spinButton.disabled = isSpinning || (currentBalance < newBet) || newBet < 1;
});

// --- Инициализация при загрузке ---
balanceDisplay.textContent = currentBalance;
betInput.min = 1;
betInput.step = 1;
betInput.value = 1;
currentBet = parseInt(betInput.value);
createReels();
clearEffects();
spinButton.disabled = currentBalance < currentBet;