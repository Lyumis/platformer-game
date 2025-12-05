export class Platform {
    constructor(game, x, y, width, height) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        
        // Определяем тип платформы для выбора текстуры
        if (y > game.height - 200) {
            this.type = 'bottom'; // Нижний ряд
        } else if (y > game.height - 300) {
            this.type = 'middle'; // Средний ряд
        } else {
            this.type = 'top'; // Верхний ряд
        }
    }

    // Убираем метод draw - теперь рисует renderer
    // Оставляем только если нужен fallback
    draw(ctx) {
        // Fallback цвета (если текстуры не загрузились)
        let color;
        switch(this.type) {
            case 'bottom': color = '#4361ee'; break;
            case 'middle': color = '#7209b7'; break;
            case 'top': color = '#f72585'; break;
            default: color = '#4cc9f0';
        }
        
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Верхняя поверхность
        const surfaceGradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + 5);
        surfaceGradient.addColorStop(0, '#4cc9f0');
        surfaceGradient.addColorStop(1, color);
        ctx.fillStyle = surfaceGradient;
        ctx.fillRect(this.x, this.y, this.width, 5);
    }
}