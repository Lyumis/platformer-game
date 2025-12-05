export class Player {
    constructor(game) {
        this.game = game;

        // Размер для коллизий
        this.width = 60;
        this.height = 40;

        // Позиция
        this.x = game.width / 2 - this.width / 2;
        this.y = game.height - this.height - 50;

        this.velocityY = 0;
        this.velocityX = 0;
        this.jumpForce = -12;
        this.gravity = 0.5;
        this.isOnGround = false;
        this.color = '#ff6b6b';
        this.jumpCooldown = 0;
        this.coyoteTime = 0;
        this.maxCoyoteTime = 8;
        this.jumpThroughEffect = 0;

        // Doodle Jump логика
        this.jumpingUp = false;
        this.jumpGracePeriod = 3;

        // УПРОЩЕННАЯ логика состояний
        this.state = 'idle';
        this.respawning = false;

        // ДОБАВЛЯЕМ: Неуязвимость после получения урона
        this.isInvincible = false;
        this.invincibilityTimer = 0;
        this.invincibilityDuration = 60; // 60 кадров = ~2 секунды при 30 FPS
        this.blinkTimer = 0;
        this.blinkInterval = 5; // Частота мерцания (каждый 5 кадров)
        this.isVisible = true; // Видимость спрайта для мерцания
    }

    // ДОБАВЛЯЕМ: Метод для активации неуязвимости
    activateInvincibility() {
        this.isInvincible = true;
        this.invincibilityTimer = this.invincibilityDuration;
        this.isVisible = true;
        this.blinkTimer = 0;
    }

    // ДОБАВЛЯЕМ: Обновление таймера неуязвимости
    updateInvincibility() {
        if (this.isInvincible && this.invincibilityTimer > 0) {
            this.invincibilityTimer--;

            // Мерцание: меняем видимость каждые blinkInterval кадров
            this.blinkTimer++;
            if (this.blinkTimer >= this.blinkInterval) {
                this.isVisible = !this.isVisible;
                this.blinkTimer = 0;
            }

            // Завершение неуязвимости
            if (this.invincibilityTimer <= 0) {
                this.isInvincible = false;
                this.isVisible = true;
            }
        }
    }

    update(keys) {
        if (this.game.gameOver) return;

        // Обновляем неуязвимость
        this.updateInvincibility();

        // ДЕБАГ: Если respawning, не обновляем физику
        if (this.respawning) {
            // При респавне просто держим состояние running
            this.state = 'running';
            this.velocityY = 0;
            this.isOnGround = true;
            return; // Выходим из метода
        }

        // Обновляем время "койота"
        if (this.isOnGround) {
            this.coyoteTime = this.maxCoyoteTime;
            this.jumpingUp = false;
            // ИСПРАВЛЕНИЕ: Только если еще не running, устанавливаем
            if (this.velocityY >= 0 && this.state !== 'running') {
                this.state = 'running';
            }
        } else if (this.coyoteTime > 0) {
            this.coyoteTime--;
        }

        // Обновляем эффект прыжка сквозь платформу
        if (this.jumpThroughEffect > 0) {
            this.jumpThroughEffect--;
        }

        // Обработка прыжка
        if (this.jumpCooldown > 0) {
            this.jumpCooldown--;
        }

        // Прыжок с учетом времени "койота"
        const canJump = (this.isOnGround || this.coyoteTime > 0) && this.jumpCooldown === 0;
        if (keys['ArrowUp'] && canJump) {
            this.velocityY = this.jumpForce;
            this.isOnGround = false;
            this.coyoteTime = 0;
            this.jumpCooldown = 15;
            this.state = 'jumping';
            this.jumpingUp = true;
            this.jumpGracePeriod = 5;
        }

        // Обновляем grace period
        if (this.jumpGracePeriod > 0) {
            this.jumpGracePeriod--;
        }

        // Применение гравитации
        if (!this.isOnGround) {
            this.velocityY += this.gravity;

            // ИСПРАВЛЕНИЕ: Только если еще не falling, устанавливаем
            if (this.velocityY > 0 && this.state !== 'falling') {
                this.state = 'falling';
            }
        }

        // Ограничение максимальной скорости падения
        if (this.velocityY > 20) {
            this.velocityY = 20;
        }

        // Обновление позиции по Y
        this.y += this.velocityY;

        // Всегда центрируем игрока по горизонтали
        this.x = this.game.width / 2 - this.width / 2;

        // ИСПРАВЛЕНИЕ: Убрали лишнюю проверку - состояние уже установлено
    }

    // Метод для Doodle Jump логики
    canJumpThroughPlatform(platform) {
        if (!this.jumpingUp || this.velocityY >= 0 || this.jumpGracePeriod <= 0) {
            return false;
        }

        const playerBottom = this.y + this.height;
        const platformTop = platform.y;

        const isUnderPlatform = playerBottom <= platformTop + 5 && this.velocityY < 0;
        const horizontalOverlap = this.x + this.width > platform.x + 10 &&
            this.x < platform.x + platform.width - 10;
        const willPassThrough = playerBottom + Math.abs(this.velocityY) > platformTop;

        return isUnderPlatform && horizontalOverlap && willPassThrough;
    }

    triggerJumpThroughEffect() {
        this.jumpThroughEffect = 10;
    }

    reset() {
        this.width = 60;
        this.height = 40;
        this.x = this.game.width / 2 - this.width / 2;
        this.y = this.game.height - this.height - 50;
        this.velocityY = 0;
        this.velocityX = 0;
        this.isOnGround = true; // ИЗМЕНЕНО: true вместо false
        this.jumpCooldown = 0;
        this.coyoteTime = this.maxCoyoteTime; // ИЗМЕНЕНО: устанавливаем coyoteTime
        this.jumpThroughEffect = 0;
        this.state = 'running'; // ИЗМЕНЕНО
        this.jumpingUp = false;
        this.jumpGracePeriod = 0; // ИЗМЕНЕНО: 0 вместо 3
        this.respawning = true;
    }
}