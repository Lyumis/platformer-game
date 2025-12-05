import { Player } from './player.js';
import { Platform } from './platform.js';
import { Obstacle } from './obstacle.js';
import { InputHandler } from './input-handler.js';
import { Renderer } from './renderer.js';
import { checkCollisions } from './collision.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        this.player = new Player(this);
        this.platforms = [];
        this.obstacles = [];
        this.input = new InputHandler();
        this.renderer = new Renderer(this.ctx, this.width, this.height);

        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        this.gameSpeed = 3;
        this.isRespawning = false;
        this.respawnAnimation = 0;
        this.respawnMaxAnimation = 30;

        // ИЗМЕНЕНИЕ: Увеличиваем разницу между рядами платформ
        this.rows = [
            { y: this.height - 120, minGap: 100, maxGap: 200, platformWidth: 180 }, // Было 120
            { y: this.height - 240, minGap: 100, maxGap: 180, platformWidth: 150 },  // Было 100
            { y: this.height - 360, minGap: 100, maxGap: 180, platformWidth: 120 }    // Было 80
        ];

        this.lastPlatformX = [0, 0, 0];
        this.lastObstacleX = 400;
        this.obstacleGap = 250;
        this.obstacleChance = 0.6;
        this.platformSkipCounter = 0;
        this.platformSkipInterval = 8;

        // Создаем безопасную стартовую платформу
        this.createSafeStartingPlatform();
        this.createInitialPlatforms();
        this.spawnPlayerOnFirstPlatform();

        // Таймер для предотвращения зависаний
        this.fallSafeTimer = 0;
        this.maxFallSafeTime = 90;

        // Флаг для игрового цикла
        this.running = false;
        this.animationId = null;
        this.lastTime = 0;
    }

    createSafeStartingPlatform() {

        const safePlatformWidth = 400; // Было 300
        const safePlatformX = this.width / 2 - safePlatformWidth / 2;
        const safePlatformY = this.rows[0].y;

        const safePlatform = new Platform(
            this,
            safePlatformX,
            safePlatformY,
            safePlatformWidth,
            20
        );

        this.platforms.push(safePlatform);
        this.lastPlatformX[0] = safePlatformX + safePlatformWidth;
    }

    createInitialPlatforms() {
        // Создаем платформы для всех рядов
        for (let row = 0; row < this.rows.length; row++) {
            // Для первого ряда стартовая платформа уже есть
            if (row === 0) {
                // Создаем дополнительные платформы после стартовой
                for (let i = 0; i < 5; i++) {
                    this.createPlatformInRow(row);
                }
            } else {
                // Для второго и третьего рядов создаем с начала
                const rowConfig = this.rows[row];
                const firstPlatform = new Platform(
                    this,
                    100,
                    rowConfig.y,
                    rowConfig.platformWidth + 120, // Было 80
                    20
                );
                this.platforms.push(firstPlatform);
                this.lastPlatformX[row] = firstPlatform.x + firstPlatform.width;

                for (let i = 0; i < 5; i++) {
                    this.createPlatformInRow(row);
                }
            }
        }
    }

    createPlatformInRow(rowIndex) {
        const row = this.rows[rowIndex];

        this.platformSkipCounter++;
        if (this.platformSkipCounter >= this.platformSkipInterval && Math.random() > 0.7) {
            this.platformSkipCounter = 0;
            this.lastPlatformX[rowIndex] += row.minGap + Math.random() * (row.maxGap - row.minGap);
            return;
        }

        const gap = row.minGap + Math.random() * (row.maxGap - row.minGap);
        const x = this.lastPlatformX[rowIndex] + gap;

        const width = row.platformWidth + Math.random() * 120; // Было 60

        if (rowIndex === 0 && x < this.platforms[0].x + this.platforms[0].width + 50) {
            this.lastPlatformX[rowIndex] = this.platforms[0].x + this.platforms[0].width + 50;
            return this.createPlatformInRow(rowIndex);
        }

        this.platforms.push(new Platform(this, x, row.y, width, 20));
        this.lastPlatformX[rowIndex] = x + width;
        this.platformSkipCounter = 0;
    }

    spawnPlayerOnFirstPlatform() {
        // Игрок всегда спавнится на безопасной стартовой платформе
        const startingPlatform = this.platforms[0];

        this.player.x = startingPlatform.x + startingPlatform.width / 2 - this.player.width / 2;
        this.player.y = startingPlatform.y - this.player.height;
        this.player.isOnGround = true;
        this.player.coyoteTime = this.player.maxCoyoteTime;
        this.player.state = 'running';
        this.fallSafeTimer = 0;
    }

    createObstacleAtPosition(x) {
        // Не создаем препятствия слишком близко к стартовой платформе
        const startingPlatform = this.platforms[0];
        const startingPlatformCenter = startingPlatform.x + startingPlatform.width / 2;
        if (Math.abs(x - startingPlatformCenter) < 500) {
            return false;
        }

        // Увеличиваем шанс появления препятствий с ростом счета
        const dynamicChance = Math.min(0.8, this.obstacleChance + this.score * 0.00005);

        if (Math.random() > dynamicChance) {
            return false;
        }

        // Выбираем случайный ряд для препятствия (0, 1 или 2)
        const rowIndex = Math.floor(Math.random() * 3);
        const rowY = this.rows[rowIndex].y;

        // Ищем платформу в этом ряду, которая находится в районе x
        const platformsInRow = this.platforms.filter(platform =>
            Math.abs(platform.y - rowY) < 5 &&
            x >= platform.x - 50 &&
            x <= platform.x + platform.width + 50
        );

        if (platformsInRow.length === 0) {
            return false;
        }

        // Выбираем платформу, наиболее близкую к x
        const targetPlatform = platformsInRow.reduce((closest, platform) => {
            const platformCenter = platform.x + platform.width / 2;
            const closestCenter = closest.x + closest.width / 2;
            return Math.abs(platformCenter - x) < Math.abs(closestCenter - x) ? platform : closest;
        }, platformsInRow[0]);

        // Проверяем, достаточно ли широка платформа
        if (targetPlatform.width >= 120) {
            const size = 25 + Math.random() * 10;
            const obstacleX = targetPlatform.x + (targetPlatform.width / 2) - (size / 2);
            const obstacleY = targetPlatform.y - size;

            // Проверяем, нет ли препятствий слишком близко
            const tooClose = this.obstacles.some(obs =>
                Math.abs(obs.x - obstacleX) < 100 && Math.abs(obs.y - obstacleY) < 50
            );

            if (!tooClose) {
                this.obstacles.push(new Obstacle(this, obstacleX, obstacleY, size));
                return true;
            }
        }

        return false;
    }

    hasObstacleOnPlatform(platform) {
        return this.obstacles.some(obstacle =>
            Math.abs((obstacle.y + obstacle.size) - platform.y) < 10 &&
            obstacle.x > platform.x + 20 &&
            obstacle.x + obstacle.size < platform.x + platform.width - 20
        );
    }

    update(currentTime = Date.now()) {
        if (this.gameOver) return;

        const deltaTime = this.lastTime ? (currentTime - this.lastTime) / 16.67 : 1;
        this.lastTime = currentTime;

        this.gameSpeed = 3 + this.score * 0.001;
        this.player.update(this.input.keys);

        // Движение платформ и препятствий
        const moveAmount = this.gameSpeed * deltaTime;
        this.platforms.forEach(platform => platform.x -= moveAmount);
        this.obstacles.forEach(obstacle => obstacle.x -= moveAmount);

        // Удаление вышедших за экран объектов
        this.platforms = this.platforms.filter(p => p.x + p.width > -100);
        this.obstacles = this.obstacles.filter(o => o.x + o.size > -50);

        // Генерация новых платформ
        for (let row = 0; row < this.rows.length; row++) {
            const platformsInRow = this.platforms.filter(p => Math.abs(p.y - this.rows[row].y) < 10);
            if (platformsInRow.length > 0) {
                const rightmostPlatform = platformsInRow.reduce((rightmost, platform) => {
                    return platform.x + platform.width > rightmost.x + rightmost.width ? platform : rightmost;
                }, platformsInRow[0]);
                this.lastPlatformX[row] = rightmostPlatform.x + rightmostPlatform.width;
            }

            while (this.lastPlatformX[row] < this.width + 1200) {
                this.createPlatformInRow(row);
            }
        }

        // Генерация новых препятствий на протяжении всего геймплея
        // Находим самое правое препятствие или используем начальную позицию
        let rightmostObstacleX = this.lastObstacleX;
        if (this.obstacles.length > 0) {
            const rightmostObstacle = this.obstacles.reduce((rightmost, obstacle) => {
                return obstacle.x > rightmost.x ? obstacle : rightmost;
            }, this.obstacles[0]);
            rightmostObstacleX = rightmostObstacle.x;
        }

        // Создаем новые препятствия постоянно
        while (rightmostObstacleX < this.width + 1000) {
            const nextX = rightmostObstacleX + this.obstacleGap + Math.random() * 100 - 50;

            // Пробуем создать препятствие
            if (this.createObstacleAtPosition(nextX)) {
                rightmostObstacleX = nextX;
            } else {
                // Если не удалось создать, все равно продвигаем позицию
                rightmostObstacleX += this.obstacleGap;
            }
        }

        // Обновляем lastObstacleX для следующего кадра
        this.lastObstacleX = rightmostObstacleX;

        // Проверка коллизий - ВАЖНО: не сбрасываем isOnGround здесь!
        // Пусть checkCollisions сам устанавливает isOnGround
        let landed = false;

        for (let i = 0; i < this.platforms.length; i++) {
            if (checkCollisions(this.player, this.platforms[i])) {
                landed = true;
                this.fallSafeTimer = 0;
                break; // УБРАЛИ установку состояния здесь
            }
        }

        // Если игрок НЕ приземлился
        if (!landed) {
            this.player.isOnGround = false;
            this.fallSafeTimer++;
        } else {
            this.fallSafeTimer = 0;
        }

        // Проверка коллизий с препятствиями
        for (let i = 0; i < this.obstacles.length; i++) {
            if (checkCollisions(this.player, this.obstacles[i])) {
                this.handleObstacleCollision();
                break;
            }
        }

        // Проверка падения с системой безопасности
        if (this.player.y > this.height + 100 || this.fallSafeTimer > this.maxFallSafeTime) {
            this.handleFall();
        }

        // Обновление счета
        this.score += this.gameSpeed * 0.1 * deltaTime;
    }

    handleObstacleCollision() {
        // Проверяем, неуязвим ли игрок
        if (this.player.isInvincible) {
            return; // Если неуязвим - игнорируем столкновение
        }
        
        this.lives--;
    
        // Удаляем препятствие с которым столкнулись
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            if (this.player.x < obs.x + obs.size &&
                this.player.x + this.player.width > obs.x &&
                this.player.y < obs.y + obs.size &&
                this.player.y + this.player.height > obs.y) {
                this.obstacles.splice(i, 1);
                break;
            }
        }
    
        if (this.lives <= 0) {
            this.gameOver = true;
            setTimeout(() => {
                if (window.showGameOver) {
                    window.showGameOver(Math.floor(this.score));
                }
            }, 100);
        } else {
            // Активируем неуязвимость и мерцание
            this.player.activateInvincibility();
            
            // Небольшой отскок при столкновении (опционально)
            // this.player.velocityY = -5;
            
            this.player.isOnGround = false;
            this.player.state = 'jumping';
            this.fallSafeTimer = 0;
            
        }
    }

    handleFall() {
        if (this.isRespawning) return;

        this.lives--;
        this.fallSafeTimer = 0;

        if (this.lives <= 0) {
            this.gameOver = true;
            setTimeout(() => {
                if (window.showGameOver) {
                    window.showGameOver(Math.floor(this.score));
                }
            }, 100);
        } else {
            // Начинаем анимацию респавна
            this.startRespawnAnimation();
        }
    }

    startRespawnAnimation() {
        this.isRespawning = true;
        this.respawnAnimation = this.respawnMaxAnimation;

        // Сохраняем текущую позицию для плавного перехода
        this.respawnStartX = this.player.x;
        this.respawnStartY = this.player.y;
        this.respawnStartAlpha = 1.0;

        // Находим платформу для респавна
        this.respawnPlatform = this.findSafeSpawnPlatform();

        if (this.respawnPlatform) {
            this.respawnTargetX = this.respawnPlatform.x + this.respawnPlatform.width / 2 - this.player.width / 2;
            this.respawnTargetY = this.respawnPlatform.y - this.player.height;

        } else {
            // Если не нашли платформу, создаем новую
            this.respawnPlatform = new Platform(
                this,
                this.width / 2 - 100,
                this.rows[0].y,
                200,
                20
            );
            this.platforms.push(this.respawnPlatform);
            this.respawnTargetX = this.width / 2 - this.player.width / 2;
            this.respawnTargetY = this.respawnPlatform.y - this.player.height;
        }

        // Сразу устанавливаем игрока в режим респавна
        this.player.respawning = true;
    }

    updateRespawnAnimation() {
        if (!this.isRespawning) return;

        this.respawnAnimation--;

        if (this.respawnAnimation <= 0) {
            // Завершение анимации респавна
            this.isRespawning = false;

            // ВАЖНО: Позиционируем игрока точно на платформе
            this.player.x = this.respawnTargetX;
            this.player.y = this.respawnTargetY;

            // Сбрасываем все состояния игрока
            this.player.velocityY = 0;
            this.player.velocityX = 0;
            this.player.isOnGround = true; // Ключевой момент!
            this.player.coyoteTime = this.player.maxCoyoteTime;
            this.player.jumpingUp = false;
            this.player.state = 'running';
            this.player.jumpGracePeriod = 0;
            this.player.respawning = false; // Завершаем респавн
            this.player.jumpCooldown = 0;
            this.player.jumpThroughEffect = 0;

            this.fallSafeTimer = 0;

        } else {
            // Плавная интерполяция позиции
            const progress = 1 - (this.respawnAnimation / this.respawnMaxAnimation);
            const easeProgress = 1 - Math.pow(1 - progress, 3);

            this.player.x = this.respawnStartX + (this.respawnTargetX - this.respawnStartX) * easeProgress;
            this.player.y = this.respawnStartY + (this.respawnTargetY - this.respawnStartY) * easeProgress;

            // Игрок в режиме респавна
            this.player.respawning = true;
            this.player.respawnAlpha = 0.5 + 0.5 * Math.sin(this.respawnAnimation * 0.3);
        }
    }

    removeObstaclesFromPlatform(platform) {
        // Находим все препятствия на этой платформе
        const obstaclesOnPlatform = this.obstacles.filter(obstacle => {
            const obstacleBottom = obstacle.y + obstacle.size;
            return Math.abs(obstacleBottom - platform.y) < 10 &&
                obstacle.x > platform.x + 20 &&
                obstacle.x + obstacle.size < platform.x + platform.width - 20;
        });

        // Удаляем их
        obstaclesOnPlatform.forEach(obstacle => {
            const index = this.obstacles.indexOf(obstacle);
            if (index > -1) {
                this.obstacles.splice(index, 1);
            }
        });

        return obstaclesOnPlatform.length > 0;
    }

    // Обновленный метод findSafeSpawnPlatform()
    findSafeSpawnPlatform() {
        // Ищем платформу в безопасной зоне для респавна
        const safeZoneStart = this.width / 2 - 200;
        const safeZoneEnd = this.width / 2 + 200;

        const suitablePlatforms = this.platforms.filter(platform =>
            platform.y === this.rows[0].y &&
            platform.width >= 180 &&
            platform.x + platform.width > safeZoneStart &&
            platform.x < safeZoneEnd
        );

        // Сортируем по близости к центру
        suitablePlatforms.sort((a, b) => {
            const aCenter = a.x + a.width / 2;
            const bCenter = b.x + b.width / 2;
            const screenCenter = this.width / 2;
            return Math.abs(aCenter - screenCenter) - Math.abs(bCenter - screenCenter);
        });

        // Берем ближайшую платформу и убираем с нее препятствия
        if (suitablePlatforms.length > 0) {
            const bestPlatform = suitablePlatforms[0];
            this.removeObstaclesFromPlatform(bestPlatform);
            return bestPlatform;
        }

        // Если не нашли подходящую в безопасной зоне, ищем любую широкую
        const anyWidePlatform = this.platforms.find(platform =>
            platform.y === this.rows[0].y &&
            platform.width >= 150 &&
            platform.x + platform.width > 100 &&
            platform.x < this.width + 300
        );

        if (anyWidePlatform) {
            this.removeObstaclesFromPlatform(anyWidePlatform);
            return anyWidePlatform;
        }

        return null;
    }

    render(currentTime = Date.now()) {
        if (this.gameOver && this.lives <= 0) return;

        this.renderer.clear();
        this.platforms.forEach(p => this.renderer.drawPlatform(p));
        this.obstacles.forEach(o => this.renderer.drawObstacle(o));

        // Если идет анимация респавна, рисуем игрока с прозрачностью
        if (this.isRespawning && this.player.respawnAlpha !== undefined) {
            this.ctx.save();
            this.ctx.globalAlpha = this.player.respawnAlpha;
            this.renderer.drawPlayer(this.player, currentTime);
            this.ctx.restore();
        } else {
            // Передаем текущее время для анимации
            this.renderer.drawPlayer(this.player, currentTime);
        }

        this.renderer.drawUI(this.score, this.lives, this.gameSpeed);

        // Отображаем анимацию респавна
        if (this.isRespawning) {
            this.renderRespawnEffect();
        }
    }

    renderRespawnEffect() {
        const progress = 1 - (this.respawnAnimation / this.respawnMaxAnimation);

        // Круговая анимация респавна
        this.ctx.save();
        this.ctx.globalAlpha = 0.7 * (1 - progress);
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.beginPath();
        this.ctx.arc(
            this.respawnTargetX + this.player.width / 2,
            this.respawnTargetY + this.player.height / 2,
            50 * progress,
            0,
            Math.PI * 2
        );
        this.ctx.fill();

        // Эффект частиц
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2 + progress * Math.PI * 2;
            const radius = 30 * (1 - progress);
            this.ctx.beginPath();
            this.ctx.arc(
                this.respawnTargetX + this.player.width / 2 + Math.cos(angle) * radius,
                this.respawnTargetY + this.player.height / 2 + Math.sin(angle) * radius,
                5 * (1 - progress),
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        }
        this.ctx.restore();
    }

    gameLoop = (timestamp) => {
        if (this.isRespawning) {
            this.updateRespawnAnimation();
        }

        if (!this.gameOver) {
            this.update(timestamp);
        }

        this.render(timestamp);

        if (this.running) {
            this.animationId = requestAnimationFrame(this.gameLoop);
        }
    }
    start() {
        this.running = true;
        this.lastTime = 0;
        this.animationId = requestAnimationFrame(this.gameLoop);
    }

    stop() {
        this.running = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    restart() {
        this.stop();
        this.gameOver = false;
        this.isRespawning = false;
        this.respawnAnimation = 0;
        this.score = 0;
        this.lives = 3;
        this.gameSpeed = 3;
        this.platforms = [];
        this.obstacles = [];
        this.lastPlatformX = [0, 0, 0];
        this.lastObstacleX = 400;
        this.platformSkipCounter = 0;
        this.fallSafeTimer = 0;
        this.lastTime = 0;

        this.createSafeStartingPlatform();
        this.createInitialPlatforms();
        this.spawnPlayerOnFirstPlatform();
        this.start();
    }
}