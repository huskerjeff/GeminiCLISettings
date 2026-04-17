ŒHclass GeminiMathGame {
    constructor() {
        this.svgNS = "http://www.w3.org/2000/svg";
        this.graphElement = document.getElementById('graph');
        this.equationText = document.getElementById('equation-text');
        this.feedbackText = document.getElementById('feedback-text');
        this.checkBtn = document.getElementById('check-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.progressFill = document.getElementById('progress-fill');
        this.challengeLabel = document.getElementById('challenge-label');
        this.scoreVal = document.getElementById('score-val');
        this.streakVal = document.getElementById('streak-val');

        this.config = {
            gridSize: 20, // -10 to 10
            padding: 40,
            width: 0,
            height: 0,
            scale: 0
        };

        this.state = {
            level: 1,
            challenge: 1,
            totalChallenges: 6,
            score: 0,
            streak: 0,
            currentEquation: { m: 1, b: 0 },
            userPoint: { x: 0, y: 0 },
            isDragging: false
        };

        this.init();
    }

    init() {
        this.setupGraph();
        this.generateChallenge();
        this.addEventListeners();
        window.addEventListener('resize', () => this.setupGraph());
    }

    setupGraph() {
        const rect = this.graphElement.getBoundingClientRect();
        this.config.width = rect.width;
        this.config.height = rect.height;
        this.config.scale = (Math.min(this.config.width, this.config.height) - (this.config.padding * 2)) / this.config.gridSize;

        this.renderGraph();
    }

    renderGraph() {
        this.graphElement.innerHTML = '';
        const svg = document.createElementNS(this.svgNS, "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.setAttribute("viewBox", `0 0 ${this.config.width} ${this.config.height}`);
        this.svg = svg;

        const centerX = this.config.width / 2;
        const centerY = this.config.height / 2;

        // Draw Grid Lines
        for (let i = -10; i <= 10; i++) {
            const pos = i * this.config.scale;
            
            // Vertical lines
            this.createLine(centerX + pos, 0, centerX + pos, this.config.height, "grid-line");
            // Horizontal lines
            this.createLine(0, centerY - pos, this.config.width, centerY - pos, "grid-line");

            // Labels
            if (i !== 0) {
                this.createLabel(centerX + pos, centerY + 15, i.toString());
                this.createLabel(centerX - 15, centerY - pos + 5, i.toString());
            }
        }

        // Draw Axes
        this.createLine(centerX, 0, centerX, this.config.height, "axis-line");
        this.createLine(0, centerY, this.config.width, centerY, "axis-line");

        // User Point
        this.point = document.createElementNS(this.svgNS, "circle");
        this.point.setAttribute("r", "8");
        this.point.setAttribute("class", "interactive-point");
        this.updatePointPosition();
        
        svg.appendChild(this.point);
        this.graphElement.appendChild(svg);
    }

    createLine(x1, y1, x2, y2, className) {
        const line = document.createElementNS(this.svgNS, "line");
        line.setAttribute("x1", x1);
        line.setAttribute("y1", y1);
        line.setAttribute("x2", x2);
        line.setAttribute("y2", y2);
        line.setAttribute("class", className);
        this.svg.appendChild(line);
    }

    createLabel(x, y, text) {
        const label = document.createElementNS(this.svgNS, "text");
        label.setAttribute("x", x);
        label.setAttribute("y", y);
        label.setAttribute("class", "axis-label");
        label.setAttribute("text-anchor", "middle");
        label.textContent = text;
        this.svg.appendChild(label);
    }

    updatePointPosition() {
        const centerX = this.config.width / 2;
        const centerY = this.config.height / 2;
        const screenX = centerX + (this.state.userPoint.x * this.config.scale);
        const screenY = centerY - (this.state.userPoint.y * this.config.scale);
        
        this.point.setAttribute("cx", screenX);
        this.point.setAttribute("cy", screenY);
    }

    generateChallenge() {
        // Level logic
        let m, b;
        if (this.state.level === 1) {
            // Level 1: Focus on Y-intercept, simple integers
            m = (Math.floor(Math.random() * 5) + 1) * (Math.random() > 0.5 ? 1 : -1);
            b = Math.floor(Math.random() * 11) - 5; // -5 to 5
        } else {
            // Future levels: Fractions, bigger range
            m = Math.floor(Math.random() * 9) - 4;
            b = Math.floor(Math.random() * 17) - 8;
        }

        this.state.currentEquation = { m, b };
        this.state.userPoint = { x: 0, y: 0 }; // Always start at origin for y-intercept challenge
        
        this.updateUI();
        this.updatePointPosition();
        this.clearFeedback();
    }

    updateUI() {
        const { m, b } = this.state.currentEquation;
        const sign = b >= 0 ? "+" : "-";
        const absB = Math.abs(b);
        
        this.equationText.innerHTML = `y = <span class="slope">${m}</span>x <span class="intercept">${sign} ${absB}</span>`;
        
        const progress = (this.state.challenge / this.state.totalChallenges) * 100;
        this.progressFill.style.width = `${progress}%`;
        this.challengeLabel.textContent = `Challenge ${this.state.challenge} of ${this.state.totalChallenges}`;
        
        this.scoreVal.textContent = this.state.score;
        this.streakVal.textContent = this.state.streak;
    }

    addEventListeners() {
        this.point.addEventListener('mousedown', (e) => this.startDrag(e));
        window.addEventListener('mousemove', (e) => this.drag(e));
        window.addEventListener('mouseup', () => this.endDrag());

        // Touch support
        this.point.addEventListener('touchstart', (e) => this.startDrag(e.touches[0]));
        window.addEventListener('touchmove', (e) => this.drag(e.touches[0]));
        window.addEventListener('touchend', () => this.endDrag());

        this.checkBtn.addEventListener('click', () => this.checkAnswer());
        this.resetBtn.addEventListener('click', () => this.resetGame());
    }

    startDrag(e) {
        this.state.isDragging = true;
    }

    drag(e) {
        if (!this.state.isDragging) return;

        const rect = this.graphElement.getBoundingClientRect();
        const centerX = this.config.width / 2;
        const centerY = this.config.height / 2;

        let mouseY = e.clientY - rect.top;
        
        // Map screen Y to grid Y (constrained to Y-axis for intercept challenge)
        let gridY = Math.round((centerY - mouseY) / this.config.scale);
        
        // Constrain to grid limits
        gridY = Math.max(-10, Math.min(10, gridY));
        
        this.state.userPoint.y = gridY;
        this.updatePointPosition();
    }

    endDrag() {
        this.state.isDragging = false;
    }

    checkAnswer() {
        const { b } = this.state.currentEquation;
        const userY = this.state.userPoint.y;

        if (userY === b) {
            this.showFeedback("Correct! That's the y-intercept.", "success");
            this.state.score += 100 + (this.state.streak * 10);
            this.state.streak++;
            
            setTimeout(() => {
                if (this.state.challenge < this.state.totalChallenges) {
                    this.state.challenge++;
                    this.generateChallenge();
                } else {
                    this.completeLevel();
                }
            }, 1500);
        } else {
            this.showFeedback(`Close! Look at the equation again. b = ${b}`, "error");
            this.state.streak = 0;
            this.scoreVal.classList.add('animate-success'); // Reuse animation for error shake if I add it
        }
        this.updateUI();
    }

    showFeedback(text, type) {
        this.feedbackText.textContent = text;
        this.feedbackText.className = `feedback-area feedback-${type}`;
        if (type === 'success') {
            this.graphElement.classList.add('animate-success');
            setTimeout(() => this.graphElement.classList.remove('animate-success'), 400);
        }
    }

    clearFeedback() {
        this.feedbackText.textContent = '';
        this.feedbackText.className = 'feedback-area';
    }

    completeLevel() {
        alert(`Level ${this.state.level} Complete! Score: ${this.state.score}`);
        this.state.level++;
        this.state.challenge = 1;
        this.generateChallenge();
    }

    resetGame() {
        this.state.challenge = 1;
        this.state.score = 0;
        this.state.streak = 0;
        this.generateChallenge();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GeminiMathGame();
});
ŒH"(97d2a7aef4b808f94ad6406fb3def9f0786147112Bfile:///c:/Users/jeffkit/OneDrive%20-%20CDW/Gemini_Game2/script.js:8file:///c:/Users/jeffkit/OneDrive%20-%20CDW/Gemini_Game2