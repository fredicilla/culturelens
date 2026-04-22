/**
 * Experience Engine Architecture - State Machine
 */
const EXP_STATES = {
    AR_INIT: 'AR_INIT',
    HISTORY_RENDER: 'HISTORY_RENDER',
    ARTISAN_BREAKDOWN: 'ARTISAN_BREAKDOWN',
    MINIGAME_LOOP: 'MINIGAME_LOOP',
    END_STATE: 'END_STATE'
};

class ExperienceController {
    constructor(experienceId) {
        this.experienceId = experienceId;
        this.currentState = EXP_STATES.AR_INIT;
        this.data = null;
        this.container = document.body;
        this.minigame = null;
    }

    async init() {
        try {
            const resp = await fetch('experiences.json');
            const allData = await resp.json();
            this.data = allData[this.experienceId];

            if (!this.data) {
                console.error('Experience not found:', this.experienceId);
                return;
            }

            this.applyTheme(this.data.metadata.region);
            this.verifyCitation();
            this.renderNarrativeOverlay();
            this.startStateMachine();
        } catch (err) {
            console.error('Failed to init ExperienceEngine:', err);
        }
    }

    applyTheme(regionCode) {
        // Prefer ThemeManager for full 5-region theming (glass-card, patterns, overlays)
        if (window.ThemeManager && window.ThemeManager.applyRegionTheme) {
            window.ThemeManager.applyRegionTheme(regionCode);
            return;
        }
        // Fallback: set CSS custom properties directly for backward compat
        const root = document.documentElement;
        if(regionCode) {
             root.style.setProperty('--region-bg', `var(--${regionCode}-bg)`);
             root.style.setProperty('--region-accent', `var(--${regionCode}-accent)`);
             root.style.setProperty('--region-accent-lt', `var(--${regionCode}-accent-lt)`);
             root.style.setProperty('--region-card', `var(--${regionCode}-card)`);
             root.style.setProperty('--region-text', `var(--${regionCode}-text)`);
        }
    }

    verifyCitation() {
        if(!this.data.metadata.source_citation) {
            console.warn("WARNING: Heritage citation missing. UNESCO validation required.");
        } else {
            console.log("Heritage Citation Verified:", this.data.metadata.source_citation);
        }
    }

    renderNarrativeOverlay() {
        // Base UI for the narrative, we can update it per state
        let overlay = document.getElementById('narrator-bar');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'narrator-bar';
            overlay.innerHTML = `
                <div class="narrator-content">
                    <div class="narrator-label" id="narrator-label">HERITAGE LOG</div>
                    <div class="narrator-text" id="narrator-text"></div>
                    <div class="narrator-citation" style="font-size: 8px; color: var(--region-accent-lt); margin-top: 4px; opacity: 0.7;">
                       Citation: ${this.data.metadata.source_citation}
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
        }
    }

    updateNarrative(textKey) {
        const textElement = document.getElementById('narrator-text');
        const overlay = document.getElementById('narrator-bar');
        
        if(textElement && overlay) {
             const lang = window.currentLang || 'en';
             const narrativeData = this.data.narrative[textKey];
             textElement.textContent = narrativeData ? narrativeData[lang] : '';
             overlay.classList.add('show');
        }
    }

    startStateMachine() {
        this.transitionTo(EXP_STATES.AR_INIT);
    }

    transitionTo(newState) {
        console.log(`Transitioning: ${this.currentState} -> ${newState}`);
        this.currentState = newState;

        switch (newState) {
            case EXP_STATES.AR_INIT:
                this.updateNarrative('intro');
                // Show AR UI... (assuming specific containers exist in DOM)
                // Wait for user interaction or time to proceed
                break;
            case EXP_STATES.HISTORY_RENDER:
                this.updateNarrative('history');
                break;
             case EXP_STATES.ARTISAN_BREAKDOWN:
                // Pre-minigame breakdown
                break;
            case EXP_STATES.MINIGAME_LOOP:
                this.launchMiniGame();
                break;
            case EXP_STATES.END_STATE:
                this.showCompletion();
                break;
        }
    }

    launchMiniGame() {
        if (window.MiniGameFactory) {
            this.minigame = window.MiniGameFactory.create(this.data.minigame.gameType, this.data.minigame.config, this);
            this.minigame.start();
        } else {
             console.error("MiniGameFactory not loaded.");
        }
    }

    showCompletion() {
        const overlay = document.getElementById('narrator-bar');
        if(overlay) overlay.classList.remove('show');
        
        // Expose a completion event or UI
        const completionEvent = new CustomEvent('experienceComplete', { detail: this.experienceId });
        window.dispatchEvent(completionEvent);
    }
}

window.ExperienceController = ExperienceController;
