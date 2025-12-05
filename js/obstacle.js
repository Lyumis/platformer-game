export class Obstacle {
    constructor(game, x, y, size) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = '#ff3d3d'; 
    }

    // Fallback метод, если текстура не загрузилась
    draw(ctx) {
        ctx.fillStyle = this.color;
        
        // Рисуем треугольник
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.size);
        ctx.lineTo(this.x + this.size / 2, this.y);
        ctx.lineTo(this.x + this.size, this.y + this.size);
        ctx.closePath();
        ctx.fill();

        // Добавляем детали
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}