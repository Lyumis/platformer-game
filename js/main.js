import { Game } from './game.js';

// Инициализация игры после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');
    const pauseOverlay = document.getElementById('pause-overlay');
    const pauseText = document.getElementById('pause-text');
    const resumeButton = document.getElementById('resume-button');
    const restartFromPauseButton = document.getElementById('restart-from-pause-button');
    
    // Кнопки управления
    const pauseButton = document.getElementById('pause-button');
    const restartGameButton = document.getElementById('restart-game-button');
    
    let game = null;
    let isPaused = false;

    function startGame() {
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        pauseOverlay.classList.remove('show');
        
        if (game) {
            game.stop();
        }
        
        game = new Game(canvas);
        game.start();
        isPaused = false;
        pauseButton.innerHTML = '⏸ Пауза';
        pauseOverlay.classList.remove('show');
    }

    function showGameOver(score) {
        document.getElementById('final-score').textContent = score;
        gameOverScreen.classList.remove('hidden');
    }

    function togglePause() {
        if (!game || game.gameOver) return;
        
        isPaused = !isPaused;
        if (isPaused) {
            game.stop();
            pauseButton.innerHTML = '▶ Продолжить';
            pauseOverlay.classList.add('show');
        } else {
            game.start();
            pauseButton.innerHTML = '⏸ Пауза';
            pauseOverlay.classList.remove('show');
        }
    }
    
    // ИСПРАВЛЕНИЕ: Убираем автоматическое продолжение при возвращении фокуса
    // Только пауза при потере фокуса
    window.addEventListener('blur', () => {
        if (game && !game.gameOver && !isPaused) {
            game.stop();
            isPaused = true;
            pauseButton.innerHTML = '▶ Продолжить';
            pauseOverlay.classList.add('show');
        }
    });
    
    // ИСПРАВЛЕНИЕ: Убрали window.addEventListener('focus', ...)
    // Теперь игра НЕ продолжается автоматически при возвращении фокуса
    // Игрок должен нажать кнопку продолжения вручную

    // Обработчики кнопок
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', startGame);
    
    // Пауза/продолжение
    pauseButton.addEventListener('click', togglePause);
    
    // Рестарт игры из верхней панели
    restartGameButton.addEventListener('click', () => {
        if (game) {
            game.stop();
            pauseOverlay.classList.remove('show');
            startGame();
        }
    });
    
    // Продолжить игру из меню паузы (клик на текст "ПАУЗА" или кнопку)
    pauseText.addEventListener('click', togglePause);
    resumeButton.addEventListener('click', togglePause);
    
    // Рестарт игры из меню паузы
    restartFromPauseButton.addEventListener('click', () => {
        if (game) {
            game.stop();
            pauseOverlay.classList.remove('show');
            startGame();
        }
    });

    // Экспортируем функцию для показа экрана завершения игры
    window.showGameOver = showGameOver;
    
    // Инициализация игры (для отладки можно раскомментировать)
    // startGame();
});