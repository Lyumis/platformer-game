export class Renderer {
    constructor(ctx, width, height) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        
        // Загрузка спрайтов игрока
        this.playerSprites = {
            run: [],    // 3 кадра бега
            jump: [],   // 1 кадр прыжка
            fall: [],   // 1 кадр падения
            idle: []    // 1 кадр стояния
        };
        
        // Загрузка текстур платформ
        this.platformTextures = {
            top: null,
            middle: null,  
            bottom: null
        };
        
        // Загрузка текстур препятствий
        this.obstacleTexture = null;
        
        // Загрузка фона
        this.backgroundImage = null;
        
        // Паттерны для тилинга платформ
        this.platformPatterns = {
            top: null,
            middle: null,
            bottom: null
        };
        
        // Настройки анимации игрока
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.frameDuration = 100;
        this.lastState = 'idle'; // Добавляем
        
        this.loadAllAssets();
    
    }

    loadAllAssets() {
        this.loadPlayerSprites();
        this.loadPlatformTextures();
        this.loadObstacleTexture();
        this.loadBackground();
    }

    loadPlayerSprites() {
        // Загружаем 3 кадра для бега
        for (let i = 1; i <= 3; i++) {
            const sprite = new Image();
            sprite.src = `assets/images/player_run_${i}.png`;
            
            sprite.onerror = () => {
                this.createFallbackSprite(this.playerSprites.run, 'run', i);
            };
            
            this.playerSprites.run.push(sprite);
        }
        
        this.loadPlayerSprite('jump', 'player_jump.png');
        this.loadPlayerSprite('fall', 'player_fall.png');
        this.loadPlayerSprite('idle', 'player_idle_1.png');
    }
    
    loadPlayerSprite(animation, filename) {
        const sprite = new Image();
        sprite.src = `assets/images/${filename}`;
        
        sprite.onerror = () => {
            this.createFallbackSprite(this.playerSprites[animation], animation, 1);
        };
        
        this.playerSprites[animation].push(sprite);
    }
    
    loadPlatformTextures() {
        this.loadTexture('top', 'platform_top.png', 'platform');
        this.loadTexture('middle', 'platform_middle.png', 'platform');
        this.loadTexture('bottom', 'platform_bottom.png', 'platform');
    }
    
    loadObstacleTexture() {
        const texture = new Image();
        texture.src = 'assets/images/obstacle.png';
        
        texture.onload = () => {
            this.obstacleTexture = texture;
        };
        
        texture.onerror = () => {
            this.obstacleTexture = null;
        };
    }
    
    loadBackground() {
        const bg = new Image();
        bg.src = 'assets/images/background.png';
        
        bg.onload = () => {
            this.backgroundImage = bg;
        };
        
        bg.onerror = () => {
            this.backgroundImage = null;
        };
    }
    
    loadTexture(type, filename, category = 'platform') {
        const texture = new Image();
        texture.src = `assets/images/${filename}`;
        
        texture.onload = () => {
            if (category === 'platform') {
                this.platformTextures[type] = texture;
            }
        };
        
        texture.onerror = () => {
            if (category === 'platform') {
                this.platformTextures[type] = null;
                this.platformPatterns[type] = null;
            }
        };
    }
    
    createFallbackSprite(array, type, frameNum) {
        const canvas = document.createElement('canvas');
        canvas.width = 89;
        canvas.height = 61;
        const ctx = canvas.getContext('2d');
        
        const colors = {
            run: '#ff6b6b',
            jump: '#ff8e8e',
            fall: '#ff5252',
            idle: '#ff6b6b'
        };
        
        ctx.clearRect(0, 0, 89, 61);
        ctx.fillStyle = colors[type] || '#ff6b6b';
        
        if (type === 'run') {
            if (frameNum === 2) {
                ctx.fillRect(15, 10, 59, 41);
            } else if (frameNum === 3) {
                ctx.fillRect(20, 15, 49, 31);
            } else {
                ctx.fillRect(10, 5, 69, 51);
            }
        } else {
            ctx.fillRect(10, 5, 69, 51);
        }
        
        const img = new Image();
        img.src = canvas.toDataURL();
        array.push(img);
    }

    clear() {
        if (this.backgroundImage && this.backgroundImage.complete) {
            this.ctx.drawImage(this.backgroundImage, 0, 0, this.width, this.height);
        } else {
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
            gradient.addColorStop(0, '#2c2c2c');
            gradient.addColorStop(1, '#1a1a1a');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
    }

    drawPlatform(platform) {
        const platformType = platform.type || 
            (platform.y > this.height - 200 ? 'bottom' : 
             platform.y > this.height - 300 ? 'middle' : 'top');
        
        const texture = this.platformTextures[platformType];
        
        if (texture && texture.complete) {
            this.ctx.save();
            this.ctx.imageSmoothingEnabled = false;
            
            if (!this.platformPatterns[platformType]) {
                this.platformPatterns[platformType] = this.ctx.createPattern(texture, 'repeat');
            }
            
            this.ctx.fillStyle = this.platformPatterns[platformType];
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            this.ctx.fillRect(platform.x, platform.y, platform.width, 2);
            
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            this.ctx.fillRect(platform.x, platform.y + platform.height - 2, platform.width, 2);
            
            this.ctx.restore();
        } else {
            this.drawFallbackPlatform(platform, platformType);
        }
    }
    
    drawFallbackPlatform(platform, type) {
        let color;
        switch(type) {
            case 'bottom': color = '#ff6b6b'; break;
            case 'middle': color = '#ff8e8e'; break;
            case 'top': color = '#ff5252'; break;
            default: color = '#ff6b6b';
        }
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        const surfaceGradient = this.ctx.createLinearGradient(
            platform.x, platform.y, 
            platform.x, platform.y + 5
        );
        surfaceGradient.addColorStop(0, '#ffffff');
        surfaceGradient.addColorStop(1, color);
        this.ctx.fillStyle = surfaceGradient;
        this.ctx.fillRect(platform.x, platform.y, platform.width, 5);
    }

    drawObstacle(obstacle) {
        if (this.obstacleTexture && this.obstacleTexture.complete) {
            this.ctx.save();
            this.ctx.imageSmoothingEnabled = false;
            this.ctx.drawImage(
                this.obstacleTexture, 
                obstacle.x, 
                obstacle.y, 
                obstacle.size, 
                obstacle.size
            );
            this.ctx.restore();
        } else {
            this.drawFallbackObstacle(obstacle);
        }
    }
    
    drawFallbackObstacle(obstacle) {
        this.ctx.fillStyle = '#ff3d3d';
        
        this.ctx.beginPath();
        this.ctx.moveTo(obstacle.x, obstacle.y + obstacle.size);
        this.ctx.lineTo(obstacle.x + obstacle.size / 2, obstacle.y);
        this.ctx.lineTo(obstacle.x + obstacle.size, obstacle.y + obstacle.size);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    drawPlayer(player, currentTime) {
        // Проверяем неуязвимость и мерцание
        if (player.isInvincible && !player.isVisible) {
            // Если игрок неуязвим и невидим в этот кадр - не рисуем его
            return;
        }
        
        // Если респавнимся, сбрасываем анимацию
        if (player.respawning) {
            this.animationFrame = 0;
            this.animationTimer = currentTime;
            this.lastState = 'running';
            
            // Рисуем только спрайт idle при респавне
            let sprite = this.playerSprites.idle[0] || this.playerSprites.run[0];
            const spriteWidth = 89;
            const spriteHeight = 61;
            const drawX = Math.floor(player.x + (player.width - spriteWidth) / 2);
            const drawY = Math.floor(player.y + (player.height - spriteHeight) / 2);
            
            if (sprite && sprite.complete) {
                this.ctx.drawImage(sprite, drawX, drawY, spriteWidth, spriteHeight);
            }
            
            // Не рисуем остальное (UI тексты)
            return;
        }
        
        // // ДЕБАГ: Отображаем состояние игрока
        // this.ctx.fillStyle = 'white';
        // this.ctx.font = '12px Arial';
        // this.ctx.fillText(`State: ${player.state}`, 10, 120);
        // this.ctx.fillText(`isOnGround: ${player.isOnGround}`, 10, 140);
        // this.ctx.fillText(`velocityY: ${player.velocityY.toFixed(2)}`, 10, 160);
        // this.ctx.fillText(`AnimationFrame: ${this.animationFrame}`, 10, 180);
        // this.ctx.fillText(`Invincible: ${player.isInvincible}`, 10, 200); // Добавили
        // this.ctx.fillText(`InvTimer: ${player.invincibilityTimer}`, 10, 220); // Добавили
        
        // ВАЖНОЕ ИСПРАВЛЕНИЕ: Сбрасываем анимацию при смене состояния на running
        if (player.state === 'running') {
            // Сбрасываем таймер анимации если только что перешли в running
            if (this.lastState !== 'running') {
                this.animationTimer = currentTime;
                this.animationFrame = 0;
            }
            this.lastState = 'running';
            
            // Обновляем анимацию
            if (currentTime - this.animationTimer >= this.frameDuration) {
                this.animationFrame = (this.animationFrame + 1) % 3;
                this.animationTimer = currentTime;
            }
        } else {
            // Для других состояний сбрасываем анимацию
            if (this.lastState !== player.state) {
                this.animationFrame = 0;
                this.lastState = player.state;
            }
        }
        
        let sprite;
        if (player.state === 'jumping') {
            sprite = this.playerSprites.jump[0];
        } else if (player.state === 'falling') {
            sprite = this.playerSprites.fall[0];
        } else if (player.state === 'idle') {
            sprite = this.playerSprites.idle[0];
        } else if (player.state === 'running') {
            // ДЕБАГ: Проверяем, есть ли спрайты
            if (!this.playerSprites.run[this.animationFrame]) {
                sprite = this.playerSprites.run[0] || this.playerSprites.idle[0];
            } else {
                sprite = this.playerSprites.run[this.animationFrame];
            }
        } else {
            sprite = this.playerSprites.run[0];
        }
        
        if (!sprite) {
            sprite = this.playerSprites.run[0] || this.playerSprites.idle[0];
        }
        
        const spriteWidth = 89;
        const spriteHeight = 61;
        const drawX = Math.floor(player.x + (player.width - spriteWidth) / 2);
        const drawY = Math.floor(player.y + (player.height - spriteHeight) / 2);
        
        // Если игрок неуязвим, добавляем эффект прозрачности
        if (player.isInvincible) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.7; // Полупрозрачность при мерцании
        }
        
        // Рисуем спрайт
        if (sprite && sprite.complete) {
            this.ctx.drawImage(sprite, drawX, drawY, spriteWidth, spriteHeight);
        } else {
            this.ctx.fillStyle = player.color;
            this.ctx.fillRect(drawX, drawY, spriteWidth, spriteHeight);
        }
        
        // Восстанавливаем прозрачность если была применена
        if (player.isInvincible) {
            this.ctx.restore();
        }
        
        this.drawPlayerEffects(player);
    }
    
    drawPlayerEffects(player) {
        if (player.jumpThroughEffect > 0 && !player.respawning) {
            const alpha = player.jumpThroughEffect / 10 * 0.5;
            
            this.ctx.save();
            this.ctx.strokeStyle = '#ff6b6b';
            this.ctx.lineWidth = 2;
            this.ctx.globalAlpha = alpha;
            this.ctx.strokeRect(
                player.x - 2, 
                player.y - 2, 
                player.width + 4, 
                player.height + 4
            );
            this.ctx.restore();
        }
        
        if (!player.isOnGround) {
            this.drawPlayerShadow(player);
        }
    }
    
    drawPlayerShadow(player) {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.globalAlpha = 0.2;
        const shadowSize = 15 - (player.velocityY * 0.2);
        this.ctx.beginPath();
        this.ctx.ellipse(
            player.x + player.width/2, 
            this.height - 20, 
            Math.max(6, shadowSize), 
            4, 0, 0, Math.PI * 2
        );
        this.ctx.fill();
        this.ctx.restore();
    }

    drawUI(score, lives, gameSpeed) {
        // Фон для UI
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 220, 100); // Увеличен для скорости
        this.ctx.restore();
        
        // Текст UI с красно-коралловыми цветами
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.fillText(`Очки: ${Math.floor(score)}`, 20, 35);
        
        // Жизни с символом ❤
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.fillText(`Жизни: ${lives}`, 20, 65);
        
        // Символ сердца для каждой жизни
        this.ctx.fillStyle = '#ff5252';
        this.ctx.font = 'bold 20px Arial';
        let heartX = 90;
        for (let i = 0; i < lives; i++) {
            this.ctx.fillText('❤', heartX, 65);
            heartX += 22;
        }
        
        // Скорость - под жизнями
        this.ctx.fillStyle = '#ffa726';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.fillText(`Скорость: ${gameSpeed.toFixed(1)}`, 20, 95);
    }
}