export function checkCollisions(player, object) {


    if (player.isInvincible && object.size) {
        return false;
    }
    // Для платформ
    if (object.width && object.height) {
        // Doodle Jump логика: проверяем возможность прыжка сквозь платформу снизу
        if (player.canJumpThroughPlatform(object)) {
            player.triggerJumpThroughEffect();
            return false; // Игрок проходит сквозь платформу снизу
        }
        
        // Обычная проверка коллизий
        const isColliding = player.x < object.x + object.width &&
            player.x + player.width > object.x &&
            player.y < object.y + object.height &&
            player.y + player.height > object.y;
        
        if (isColliding) {
            // Определяем, с какой стороны произошло столкновение
            const playerBottom = player.y + player.height;
            const playerTop = player.y;
            const platformTop = object.y;
            const platformBottom = object.y + object.height;

            // Doodle Jump логика: приземление сверху на платформу
            // Игрок должен падать вниз (velocityY > 0)
            const isLanding = playerBottom >= platformTop && 
                playerBottom <= platformTop + 20 && // Увеличен допуск
                player.velocityY > 0; // ДВИЖЕТСЯ ВНИЗ
            
                if (isLanding) {
                    player.y = object.y - player.height;
                    player.velocityY = 0;
                    player.isOnGround = true;
                    player.jumpingUp = false;
                    
                    // Если игрок был в режиме респавна, завершаем его
                    if (player.respawning) {
                        player.respawning = false;
                    }
                    
                    // Устанавливаем состояние только если не прыгаем и не падаем
                    if (player.velocityY === 0 && player.isOnGround) {
                        player.state = 'running';
                    }
                    
                    return true;
                }

            // Столкновение снизу (игрок ударяется головой)
            // Только если игрок не прыгает вверх (Doodle Jump логика)
            if (playerTop <= platformBottom && 
                playerTop >= platformBottom - 10 && 
                player.velocityY < 0) {
                
                // Проверяем, не пытается ли игрок прыгнуть через платформу
                if (!player.jumpingUp || player.velocityY >= -2) {
                    player.y = object.y + object.height;
                    player.velocityY = 0;
                    player.jumpingUp = false;
                    return true;
                }
            }

            // Боковые столкновения
            if (player.x + player.width > object.x + 5 && 
                player.x < object.x + object.width - 5 &&
                Math.abs(player.y - object.y) > 10) {
                // Если игрок касается сбоку платформы во время падения
                if (player.velocityY > 0 && player.y + player.height < object.y + 10) {
                    // Игрок падает рядом с платформой, но не на нее
                    // Можно добавить небольшую коррекцию
                    if (player.x + player.width > object.x && player.x < object.x + 10) {
                        player.x = object.x - player.width;
                    } else if (player.x < object.x + object.width && player.x + player.width > object.x + object.width - 10) {
                        player.x = object.x + object.width;
                    }
                }
            }
        }
    } 
    // Для препятствий (треугольников)
    else if (object.size) {
        // Используем bounding box для упрощения
        const triangleLeft = object.x;
        const triangleRight = object.x + object.size;
        const triangleTop = object.y;
        const triangleBottom = object.y + object.size;
        
        // Проверяем столкновение с bounding box треугольника
        if (player.x < triangleRight &&
            player.x + player.width > triangleLeft &&
            player.y < triangleBottom &&
            player.y + player.height > triangleTop) {
            
            // Более простая проверка для игрока
            // Если нижняя часть игрока выше вершины треугольника
            if (player.y + player.height > triangleTop + object.size * 0.7) {
                return true;
            }
        }
    }

    return false;
}

// Функция для проверки нахождения точки в треугольнике
function pointInTriangle(px, py, x1, y1, x2, y2, x3, y3) {
    const area = (x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1);
    const s = ((x2 - px) * (y3 - py) - (x3 - px) * (y2 - py)) / area;
    const t = ((x3 - px) * (y1 - py) - (x1 - px) * (y3 - py)) / area;
    
    return s >= 0 && t >= 0 && s + t <= 1;
}

// Старая функция для совместимости
export function canJumpThroughPlatform(player, platform) {
    return player.canJumpThroughPlatform(platform);
}