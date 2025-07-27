// Flashcard functionality
let flashcards = [];
let currentCard = null;
let studySession = [];
let currentStudyIndex = 0;
let dailyStats = {
    studied: 0,
    date: new Date().toDateString()
};

// Exam functionality
let currentExam = null;
let currentQuestionIndex = 0;
let examTimer = null;
let examStartTime = null;
let examAnswers = {};

// Tab switching
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    
    if (tabName === 'exams') {
        updateExamSetup();
    }
}

// Flashcard Functions
function addFlashcard() {
    const front = document.getElementById('cardFront').value.trim();
    const back = document.getElementById('cardBack').value.trim();
    
    if (!front || !back) {
        alert('Please fill in both front and back of the card.');
        return;
    }
    
    const card = {
        id: Date.now(),
        front: front,
        back: back,
        interval: 1,
        easeFactor: 2.5,
        nextReview: new Date(),
        reviews: 0,
        mastered: false
    };
    
    flashcards.push(card);
    
    document.getElementById('cardFront').value = '';
    document.getElementById('cardBack').value = '';
    
    updateStats();
    updateCardList();
    setupStudySession();
    updateExamSetup();
}

function updateStats() {
    // Check if it's a new day
    const today = new Date().toDateString();
    if (dailyStats.date !== today) {
        dailyStats.studied = 0;
        dailyStats.date = today;
    }
    
    const total = flashcards.length;
    const due = flashcards.filter(card => new Date() >= card.nextReview && !card.mastered).length;
    const mastered = flashcards.filter(card => card.mastered).length;
    
    document.getElementById('totalCards').textContent = total;
    document.getElementById('studiedToday').textContent = dailyStats.studied;
    document.getElementById('dueCards').textContent = due;
    document.getElementById('masteredCards').textContent = mastered;
}

function updateCardList() {
    const list = document.getElementById('cardList');
    
    if (flashcards.length === 0) {
        list.innerHTML = '<div style="text-align: center; color: #666;">No cards created yet.</div>';
        return;
    }
    
    list.innerHTML = '';
    flashcards.forEach(card => {
        const item = document.createElement('div');
        item.className = 'card-item';
        item.innerHTML = `
            <div>
                <strong>${card.front.substring(0, 30)}${card.front.length > 30 ? '...' : ''}</strong>
                <br><small>Reviews: ${card.reviews} | ${card.mastered ? 'Mastered' : 'Learning'}</small>
            </div>
            <button class="delete-card" onclick="deleteCard(${card.id})">Delete</button>
        `;
        list.appendChild(item);
    });
}

function deleteCard(id) {
    flashcards = flashcards.filter(card => card.id !== id);
    updateStats();
    updateCardList();
    setupStudySession();
    updateExamSetup();
}

function setupStudySession() {
    const studyArea = document.getElementById('studyArea');
    
    // Get cards due for review
    studySession = flashcards.filter(card => 
        new Date() >= card.nextReview && !card.mastered
    );
    
    if (studySession.length === 0) {
        studyArea.innerHTML = `
            <div id="noCards" style="text-align: center; padding: 40px; color: #666;">
                ${flashcards.length === 0 ? 'No cards available for study. Create some flashcards first!' : 'No cards due for review. Great job! 🎉'}
            </div>
        `;
        return;
    }
    
    // Shuffle cards
    studySession = studySession.sort(() => Math.random() - 0.5);
    currentStudyIndex = 0;
    showCurrentCard();
}

function showCurrentCard() {
    const studyArea = document.getElementById('studyArea');
    
    if (currentStudyIndex >= studySession.length) {
        studyArea.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <h3>🎉 Study session complete!</h3>
                <p>You've reviewed all due cards. Great work!</p>
                <button class="btn" onclick="setupStudySession()" style="margin-top: 20px;">Start New Session</button>
            </div>
        `;
        return;
    }
    
    currentCard = studySession[currentStudyIndex];
    
    studyArea.innerHTML = `
        <div class="flashcard" id="currentFlashcard" onclick="flipCard()">
            <div class="flashcard-inner">
                <div class="flashcard-front">
                    <div>${currentCard.front}</div>
                </div>
                <div class="flashcard-back">
                    <div>${currentCard.back}</div>
                </div>
            </div>
        </div>
        <div style="text-align: center; margin-top: 10px; color: #666;">
            Click card to flip • ${currentStudyIndex + 1} of ${studySession.length}
        </div>
        <div class="study-controls" id="studyControls" style="display: none;">
            <button class="btn-hard" onclick="rateCard(1)">Hard</button>
            <button class="btn-medium" onclick="rateCard(3)">Good</button>
            <button class="btn-easy" onclick="rateCard(5)">Easy</button>
        </div>
    `;
}

function flipCard() {
    const card = document.getElementById('currentFlashcard');
    const controls = document.getElementById('studyControls');
    
    card.classList.toggle('flipped');
    
    // Show controls after flip
    setTimeout(() => {
        if (card.classList.contains('flipped')) {
            controls.style.display = 'flex';
        } else {
            controls.style.display = 'none';
        }
    }, 300);
}

function rateCard(quality) {
    // Spaced repetition algorithm (simplified SM-2)
    const card = currentCard;
    card.reviews++;
    
    if (quality >= 3) {
        if (card.reviews === 1) {
            card.interval = 1;
        } else if (card.reviews === 2) {
            card.interval = 6;
        } else {
            card.interval = Math.round(card.interval * card.easeFactor);
        }
        
        card.easeFactor = card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    } else {
        card.reviews = 0;
        card.interval = 1;
    }
    
    card.easeFactor = Math.max(1.3, card.easeFactor);
    
    // Set next review date
    card.nextReview = new Date();
    card.nextReview.setDate(card.nextReview.getDate() + card.interval);
    
    // Mark as mastered if interval is very long
    if (card.interval >= 30 && quality >= 4) {
        card.mastered = true;
    }
    
    // Update stats
    dailyStats.studied++;
    updateStats();
    
    // Move to next card
    currentStudyIndex++;
    showCurrentCard();
}

// Exam Functions
function updateExamSetup() {
    const warning = document.getElementById('noFlashcardsWarning');
    const startBtn = document.getElementById('startExamBtn');
    
    if (flashcards.length < 3) {
        warning.style.display = 'block';
        startBtn.disabled = true;
        startBtn.style.opacity = '0.5';
    } else {
        warning.style.display = 'none';
        startBtn.disabled = false;
        startBtn.style.opacity = '1';
    }
}

function startExam() {
    if (flashcards.length < 3) {
        alert('You need at least 3 flashcards to create an exam.');
        return;
    }
    
    const numQuestions = document.getElementById('numQuestions').value;
    const timeLimit = parseInt(document.getElementById('timeLimit').value);
    const questionType = document.getElementById('questionType').value;
    
    // Create exam
    currentExam = {
        questions: generateExamQuestions(numQuestions, questionType),
        timeLimit: timeLimit,
        startTime: new Date()
    };
    
    examAnswers = {};
    currentQuestionIndex = 0;
    examStartTime = new Date();
    
    // Show exam area
    document.getElementById('examSetup').style.display = 'none';
    document.getElementById('examArea').style.display = 'block';
    
    // Start timer if time limit is set
    if (timeLimit > 0) {
        startExamTimer(timeLimit * 60);
    }
    
    displayExamQuestion();
}

function generateExamQuestions(numQuestions, questionType) {
    let availableCards = [...flashcards];
    const questions = [];
    
    // Determine number of questions
