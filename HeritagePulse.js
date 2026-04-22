/**
 * Heritage Pulse Component
 * Shared component living in bottom nav. 
 * Allows users to submit cultural insights/submissions and stores them in localStorage.
 */

class HeritagePulse {
    constructor() {
        this.submissionsKey = 'culturelens_submissions';
        this.container = null;
    }

    init() {
        this.renderWidget();
        this.attachListeners();
    }

    renderWidget() {
        this.container = document.createElement('div');
        this.container.id = 'heritage-pulse-widget';
        this.container.className = 'heritage-pulse';
        
        this.container.innerHTML = `
            <div class="pulse-toggle">
                <span class="pulse-icon">❤️</span> Heritage Pulse
            </div>
            <div class="pulse-panel" style="display: none;">
                <h4>Share an Insight</h4>
                <textarea id="pulse-input" placeholder="Type your cultural insight here..." rows="3"></textarea>
                <button class="btn-gold" id="pulse-submit-btn" style="padding: 8px 16px; font-size: 12px; margin-top: 8px;">Submit</button>
                <div id="pulse-feed"></div>
            </div>
        `;
        document.body.appendChild(this.container);
        this.renderFeed();
    }

    attachListeners() {
        const toggle = this.container.querySelector('.pulse-toggle');
        const panel = this.container.querySelector('.pulse-panel');
        const submitBtn = this.container.querySelector('#pulse-submit-btn');
        const input = this.container.querySelector('#pulse-input');

        toggle.addEventListener('click', () => {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        });

        submitBtn.addEventListener('click', () => {
            const text = input.value.trim();
            if(text) {
                this.addSubmission(text);
                input.value = '';
                this.renderFeed();
                alert('Submission received and added to local prototype storage!');
            }
        });
    }

    getSubmissions() {
        const data = localStorage.getItem(this.submissionsKey);
        return data ? JSON.parse(data) : [];
    }

    addSubmission(text) {
        const subs = this.getSubmissions();
        subs.push({
            id: Date.now(),
            text: text,
            date: new Date().toISOString()
        });
        localStorage.setItem(this.submissionsKey, JSON.stringify(subs));
    }

    renderFeed() {
        const feedContainer = this.container.querySelector('#pulse-feed');
        if(!feedContainer) return;
        
        const subs = this.getSubmissions();
        if(subs.length === 0) {
            feedContainer.innerHTML = '<p style="font-size: 10px; opacity: 0.6; margin-top: 8px;">No submissions yet. Be the first!</p>';
            return;
        }

        const html = subs.slice().reverse().map(sub => `
            <div style="font-size: 11px; border-bottom: 1px solid var(--region-border); padding: 6px 0; margin-top: 8px;">
                "${sub.text}"
            </div>
        `).join('');

        feedContainer.innerHTML = `<div style="max-height: 100px; overflow-y: auto; margin-top: 10px;">${html}</div>`;
    }
}

window.HeritagePulse = HeritagePulse;
