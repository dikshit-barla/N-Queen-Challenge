class EnhancedNQueensGame {
    constructor() {
        this.size = 4;
        this.board = [];
        this.queens = new Set();
        this.isLocked = false;
        this.difficulty = 'easy';
        // Base times in seconds for each difficulty at level 1
        this.baseTimes = {
            easy: 300,    // 5 minutes
            medium: 150,  // 2.5 minutes
            hard: 90     // 1.5 minutes
        };
        // Time increments per level in seconds
        this.timeIncrements = {
            easy: 120,    // +2 minutes per level
            medium: 90,   // +1.5 minutes per level
            hard: 60      // +1 minute per level
        };
        // Track level separately for different board sizes
        this.currentLevel = this.size - 3; // 4x4 is level 1, 5x5 is level 2, etc.
        this.timeLimit = this.calculateTimeLimit();
        this.timeRemaining = this.timeLimit;
        this.timerInterval = null;
        this.achievements = [];
        this.availableAchievements = [
            { id: 'first_win', name: '🏆 First Victory', description: 'Complete your first 4x4 board' },
            { id: 'level_10', name: '🌟 Master Strategist', description: 'Reach level 10' },
            { id: 'no_mistakes', name: '💡 Perfect Placement', description: 'Complete a level without any conflicts' }
        ];
        this.initialize();
        this.startTimer();
        this.initializeDifficultySelectorListeners();
    }

    calculateTimeLimit() {
        const baseTime = this.baseTimes[this.difficulty];
        const increment = this.timeIncrements[this.difficulty];
        const level = this.size - 3; // Calculate level based on board size
        const additionalTime = (level - 1) * increment;
        return baseTime + additionalTime;
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        // Keep the same board size but update the timer for the new difficulty
        this.timeLimit = this.calculateTimeLimit();
        // Reset timer with new time limit
        this.resetTimer();
        // Update the board display without changing size
        this.initialize();
    }

    startTimer() {
        clearInterval(this.timerInterval);
        const timerElement = document.getElementById('gameTimer');
        timerElement.classList.remove('warning');
        
        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            const minutes = Math.floor(this.timeRemaining / 60);
            const seconds = this.timeRemaining % 60;
            
            timerElement.textContent = `Time: ${minutes}:${seconds < 10 ? '0' : ''}${seconds} (${this.difficulty})`;
            
            if (this.timeRemaining <= 30) {
                timerElement.classList.add('warning');
            }
            
            if (this.timeRemaining <= 0) {
                this.gameOver();
            }
        }, 1000);
    }

    resetTimer() {
        clearInterval(this.timerInterval);
        this.timeLimit = this.calculateTimeLimit();
        this.timeRemaining = this.timeLimit;
        const timerElement = document.getElementById('gameTimer');
        timerElement.classList.remove('warning');
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        timerElement.textContent = `Time: ${minutes}:${seconds < 10 ? '0' : ''}${seconds} (${this.difficulty})`;
        this.startTimer();
    }

    reset() {
        this.initialize();
        this.resetTimer();
    }

    nextLevel() {
        if (this.queens.size === this.size && !this.hasAnyConflicts()) {
            this.size++;
            this.currentLevel = this.size - 3; // Update level based on new board size
            this.initialize();
            this.checkAndUnlockAchievements();
            // Calculate new time limit based on new board size
            this.timeLimit = this.calculateTimeLimit();
            this.resetTimer();
        } else {
            this.updateMessage('Solve the current level first!', 'error');
        }
    }

    initialize() {
        this.board = Array(this.size).fill().map(() => Array(this.size).fill(false));
        this.queens.clear();
        this.isLocked = false;
        this.render();
        this.updateMessage('Place your queens strategically!');
        this.updateButtons();
        this.updateDisplays();
    }

    initializeDifficultySelectorListeners() {
        const difficultyBtns = document.querySelectorAll('.difficulty-btn');
        difficultyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                difficultyBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.setDifficulty(btn.dataset.difficulty);
            });
        });
    }

    


    gameOver() {
        clearInterval(this.timerInterval);
        this.isLocked = true;
        this.updateMessage('Time\'s up! Game Over', 'error');
        this.updateButtons();
    }

    updateDisplays() {
        document.getElementById('levelDisplay').textContent = `${this.size}x${this.size}`;
        document.getElementById('queensCount').textContent = `${this.queens.size}/${this.size}`;
    }

    render() {
        const boardElement = document.getElementById('board');
        boardElement.style.gridTemplateColumns = `repeat(${this.size}, 70px)`;
        boardElement.innerHTML = '';
        boardElement.className = `chessboard${this.isLocked ? ' locked' : ''}`;

        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const cell = document.createElement('div');
                cell.className = `cell ${(i + j) % 2 ? 'dark' : 'light'}`;
                
                if (this.isUnderAttack(i, j)) {
                    cell.classList.add('attacked');
                    const dangerX = document.createElement('div');
                    dangerX.className = 'danger-x';
                    dangerX.textContent = '✕';
                    cell.appendChild(dangerX);
                }
                
                cell.onclick = () => !this.isLocked && this.handleClick(i, j);
                
                if (this.board[i][j]) {
                    const queen = document.createElement('div');
                    queen.className = 'queen';
                    if (this.isUnderAttack(i, j)) {
                        queen.classList.add('threatened');
                    } else if (this.queens.size === this.size && !this.hasAnyConflicts()) {
                        queen.classList.add('safe');
                    }
                    queen.textContent = '♕';
                    cell.appendChild(queen);
                }
                
                boardElement.appendChild(cell);
            }
        }
    }
    
    isUnderAttack(row, col) {
        if (!this.board[row][col]) {
            for (let pos of this.queens) {
                const [r, c] = pos.split(',').map(Number);
                if (this.threatens(row, col, r, c)) {
                    return true;
                }
            }
        } else {
            for (let pos of this.queens) {
                const [r, c] = pos.split(',').map(Number);
                if (`${row},${col}` !== pos && this.threatens(row, col, r, c)) {
                    return true;
                }
            }
        }
        return false;
    }
    updateButtons() {
        const nextBtn = document.getElementById('nextBtn');
        nextBtn.disabled = this.isLocked || !(this.queens.size === this.size && !this.hasAnyConflicts());
    }
    updateMessage(text, type = '') {
        const message = document.getElementById('message');
        message.className = `message ${type}`;
        message.textContent = text;
    }
    
    removeQueen(row, col) {
        if (this.isLocked) return;
        this.board[row][col] = false;
        this.queens.delete(`${row},${col}`);
        this.render();
        this.updateMessage(`Queen removed. ${this.size - this.queens.size} queens left to place`);
        this.updateDisplays();
        this.updateButtons();
    }

    handleClick(row, col) {
        if (this.board[row][col]) {
            this.removeQueen(row, col);
        } else {
            this.placeQueen(row, col);
        }
    }
    showConflict(row, col) {
        const cells = document.querySelectorAll('.cell');
        const attackedCells = new Set();

        // Find all cells under attack
        for (let pos of this.queens) {
            const [r, c] = pos.split(',').map(Number);
            if (`${row},${col}` !== pos && this.threatens(row, col, r, c)) {
                attackedCells.add(`${row},${col}`);
                attackedCells.add(pos);
            }
        }

        // Highlight attacked cells and queens
        attackedCells.forEach(pos => {
            const [r, c] = pos.split(',').map(Number);
            const cell = cells[r * this.size + c];
            cell.classList.add('attacked');
            const queen = cell.querySelector('.queen');
            if (queen) {
                queen.classList.add('threatened');
            }
        });

        this.updateMessage('Queens are threatening each other! Reset to try again.', 'error');
    }
    showSuccess() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.classList.add('success-highlight');
            const queen = cell.querySelector('.queen');
            if (queen) {
                queen.classList.add('safe');
            }
        });
        
        this.updateMessage('Perfect placement! Advance to the next level!', 'success');
        this.updateButtons();
    }

    placeQueen(row, col) {
        if (this.queens.size >= this.size) {
            this.updateMessage('Maximum queens placed! Remove some queens to continue.', 'error');
            return;
        }

        this.board[row][col] = true;
        this.queens.add(`${row},${col}`);
        
        if (this.hasConflicts(row, col)) {
            this.showConflict(row, col);
            this.isLocked = true;
        } else if (this.queens.size === this.size && !this.hasAnyConflicts()) {
            this.showSuccess();
        }
        
        this.updateDisplays();
        this.render();
    }
    createRipple(event, element) {
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${event.clientX - rect.left - size/2}px`;
        ripple.style.top = `${event.clientY - rect.top - size/2}px`;
        element.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
    }
    handleClick(row, col) {
        if (this.isLocked) return;
        
        const cell = document.querySelectorAll('.cell')[row * this.size + col];
        this.createRipple(event, cell);

        if (this.board[row][col]) {
            this.removeQueen(row, col);
        } else {
            this.placeQueen(row, col);
        }
    }
    // Additional methods (isUnderAttack, hasConflicts, threatens, etc.) would be implemented similarly
    // ... 
    hasAnyConflicts() {
        const positions = Array.from(this.queens).map(pos => pos.split(',').map(Number));
        for (let i = 0; i < positions.length; i++) {
            for (let j = i + 1; j < positions.length; j++) {
                if (this.threatens(...positions[i], ...positions[j])) {
                    return true;
                }
            }
        }
        return false;
    }

    

    checkAndUnlockAchievements() {
        if (!this.achievements.includes('first_win') && this.size >= 5) {
            this.unlockAchievement('first_win');
        }
        // More achievement checks can be added
    }

    unlockAchievement(achievementId) {
        const achievement = this.availableAchievements.find(a => a.id === achievementId);
        if (achievement && !this.achievements.includes(achievementId)) {
            this.achievements.push(achievementId);
            this.showAchievementNotification(achievement);
        }
    }

    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.textContent = `Achievement Unlocked: ${achievement.name}`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    hasConflicts(row, col) {
        for (let pos of this.queens) {
            const [r, c] = pos.split(',').map(Number);
            if (`${row},${col}` !== pos && this.threatens(row, col, r, c)) {
                return true;
            }
        }
        return false;
    }
    threatens(r1, c1, r2, c2) {
        return r1 === r2 || c1 === c2 || 
               Math.abs(r1 - r2) === Math.abs(c1 - c2);
    }
    // Placeholder for other methods that were in the previous implementation
    // ... (isUnderAttack, hasConflicts, threatens, etc.)
}

const game = new EnhancedNQueensGame();

function showInstructions() {
const modal = document.getElementById('instructionsModal');
modal.style.opacity = '1';
modal.style.visibility = 'visible';
}

function closeInstructions() {
const modal = document.getElementById('instructionsModal');
modal.style.opacity = '0';
modal.style.visibility = 'hidden';
}

function showAchievementsModal() {
    const modal = document.getElementById('achievementsModal');
    const list = document.getElementById('achievementsList');
    
    list.innerHTML = game.achievements.map(achievementId => {
        const achievement = game.availableAchievements.find(a => a.id === achievementId);
        return `
            <div class="achievement-item">
                <div class="achievement-icon">${achievement.name.split(' ')[0]}</div>
                <div>
                    <strong>${achievement.name}</strong>
                    <p>${achievement.description}</p>
                </div>
            </div>
        `;
    }).join('');

    modal.style.opacity = '1';
    modal.style.visibility = 'visible';
}

function closeAchievementsModal() {
    const modal = document.getElementById('achievementsModal');
    modal.style.opacity = '0';
    modal.style.visibility = 'hidden';
}

// Add instructions and achievements buttons
const controlsDiv = document.querySelector('.controls');
const instructionsBtn = document.createElement('button');
instructionsBtn.className = 'btn';
instructionsBtn.textContent = 'Instructions';
instructionsBtn.onclick = showInstructions;
controlsDiv.appendChild(instructionsBtn);

const achievementsBtn = document.createElement('button');
achievementsBtn.className = 'btn';
achievementsBtn.textContent = 'Achievements';
achievementsBtn.onclick = showAchievementsModal;
controlsDiv.appendChild(achievementsBtn);

// Auto-open instructions on first load
document.addEventListener('DOMContentLoaded', () => {
    showInstructions();});