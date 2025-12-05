export class InputHandler {
    constructor() {
        this.keys = {};
        
        // Обработка клавиатуры (только прыжок)
        window.addEventListener('keydown', (e) => {
            if (['ArrowUp', ' ', 'w', 'W'].includes(e.key)) {
                this.keys['ArrowUp'] = true;
                e.preventDefault();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            if (['ArrowUp', ' ', 'w', 'W'].includes(e.key)) {
                this.keys['ArrowUp'] = false;
                e.preventDefault();
            }
        });
        
        // Обработка касаний для мобильных устройств (только прыжок)
        this.setupTouchControls();
    }

    setupTouchControls() {
        const controls = document.createElement('div');
        controls.style.cssText = `
            position: fixed;
            bottom: 40px;
            left: 0;
            right: 0;
            display: flex;
            justify-content: center;
            z-index: 100;
            pointer-events: none;
        `;

        const jumpBtn = this.createControlButton('↑', 'ArrowUp');
        jumpBtn.style.cssText = `
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: rgba(255, 107, 107, 0.9);
            border: 3px solid #fff;
            font-size: 32px;
            color: white;
            pointer-events: auto;
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
        `;

        controls.appendChild(jumpBtn);
        document.body.appendChild(controls);
    }

    createControlButton(text, key) {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.style.cssText = `
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: rgba(255, 107, 107, 0.7);
            border: 3px solid #fff;
            font-size: 32px;
            color: white;
            cursor: pointer;
            transition: all 0.1s;
        `;

        btn.addEventListener('touchstart', (e) => {
            this.keys[key] = true;
            btn.style.background = 'rgba(255, 107, 107, 1)';
            btn.style.transform = 'scale(0.95)';
            e.preventDefault();
        });
        
        btn.addEventListener('touchend', (e) => {
            this.keys[key] = false;
            btn.style.background = 'rgba(255, 107, 107, 0.7)';
            btn.style.transform = 'scale(1)';
            e.preventDefault();
        });
        
        // Для десктопов
        btn.addEventListener('mousedown', () => {
            this.keys[key] = true;
            btn.style.background = 'rgba(255, 107, 107, 1)';
            btn.style.transform = 'scale(0.95)';
        });
        
        btn.addEventListener('mouseup', () => {
            this.keys[key] = false;
            btn.style.background = 'rgba(255, 107, 107, 0.7)';
            btn.style.transform = 'scale(1)';
        });
        
        btn.addEventListener('mouseleave', () => {
            this.keys[key] = false;
            btn.style.background = 'rgba(255, 107, 107, 0.7)';
            btn.style.transform = 'scale(1)';
        });

        return btn;
    }
}