/**
 * Mini-Game Framework Factory
 */

class MiniGameFactory {
    static create(gameType, config, controller) {
        switch (gameType) {
            case 'StepTracker':
                return new StepTrackerGame(config, controller);
            case 'RhythmGame':
                return new RhythmGame(config, controller);
            default:
                console.error(`Unknown game type: ${gameType}`);
                return null;
        }
    }
}

class BaseMiniGame {
    constructor(config, controller) {
        this.config = config;
        this.controller = controller;
        this.score = 0;
        this.container = document.createElement('div');
        this.container.className = 'minigame-container';
        this.container.style.display = 'none';
        document.body.appendChild(this.container);
    }

    start() {
        this.container.style.display = 'flex';
        this.container.innerHTML = `
            <div class="game-header">
                <div class="score-badge">🏆 <span id="game-score">0</span></div>
            </div>
            <div id="game-content"></div>
        `;
        this.render();
    }

    updateScore(val) {
        this.score += val;
        const scoreEl = document.getElementById('game-score');
        if(scoreEl) scoreEl.textContent = this.score;
    }

    render() {
        // Override in subclass
    }

    endGame() {
        this.container.style.display = 'none';
        this.controller.transitionTo('END_STATE');
    }
}

class StepTrackerGame extends BaseMiniGame {
    constructor(config, controller) {
        super(config, controller);
        this.currentStep = 0;
    }

    render() {
        const step = this.config.steps[this.currentStep];
        const content = document.getElementById('game-content');
        if (!content) return;
        
        const lang = window.currentLang || 'en';
        
        content.innerHTML = `
            <div class="step-card">
               <div class="step-number">${this.currentStep + 1}</div>
               <div class="step-title">${step.title[lang] || step.title['en']}</div>
               <div class="step-desc">${step.desc[lang] || step.desc['en']}</div>
               <button class="btn-gold" id="next-step-btn">Next Step</button>
            </div>
        `;

        document.getElementById('next-step-btn').addEventListener('click', () => {
            this.currentStep++;
            this.updateScore(10);
            if (this.currentStep >= this.config.steps.length) {
                this.endGame();
            } else {
                this.render();
            }
        });
    }
}

class RhythmGame extends BaseMiniGame {
    constructor(config, controller) {
        super(config, controller);
    }

    render() {
        const content = document.getElementById('game-content');
        if (!content) return;

        content.innerHTML = `
            <div style="text-align:center;">
                <div class="game-title-samri">Rhythm Game Loaded</div>
                <button class="btn-outline" id="sim-win-btn">Simulate Win</button>
            </div>
        `;

        const btn = document.getElementById('sim-win-btn');
        if(btn) {
           btn.addEventListener('click', () => {
               this.updateScore(100);
               this.endGame();
           });
        }
    }
}

window.MiniGameFactory = MiniGameFactory;
