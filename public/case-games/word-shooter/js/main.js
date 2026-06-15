(function () {
    // ==========================================
    // 1. 1920x1080 缩放适配逻辑
    // ==========================================
    var app = document.getElementById('app');
    function updateScale() {
        var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
        app.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
        app.style.visibility = 'visible';
    }
    window.addEventListener('resize', updateScale);
    updateScale();

    // ==========================================
    // 2. 全局变量与数据定义
    // ==========================================
    window.Global = window.Global || {};
    
    const wordData = [
        { image: 'images/pic_hair.png', word: 'hair', distractors: ['head', 'hand'], audio: 'audio/hair.mp3' },
        { image: 'images/pic_eye.png', word: 'eye', distractors: ['ear', 'egg'], audio: 'audio/eye.mp3' },
        { image: 'images/pic_ear.png', word: 'ear', distractors: ['eye', 'eat'], audio: 'audio/ear.mp3' },
        { image: 'images/pic_nose.png', word: 'nose', distractors: ['rose', 'note'], audio: 'audio/nose.mp3' },
        { image: 'images/pic_mouth.png', word: 'mouth', distractors: ['mouse', 'month'], audio: 'audio/mouth.mp3' },
        { image: 'images/pic_arm.png', word: 'arm', distractors: ['art', 'ant'], audio: 'audio/arm.mp3' },
        { image: 'images/pic_leg.png', word: 'leg', distractors: ['let', 'log'], audio: 'audio/leg.mp3' },
        { image: 'images/pic_robot.png', word: 'robot', distractors: ['rabbit', 'rocket'], audio: 'audio/robot.mp3' },
        { image: 'images/pic_tall.png', word: 'tall', distractors: ['tell', 'tail'], audio: 'audio/tall.mp3' },
        { image: 'images/pic_short.png', word: 'short', distractors: ['shirt', 'shoe'], audio: 'audio/short.mp3' },
        { image: 'images/pic_different.png', word: 'different', distractors: ['difficult', 'dinner'], audio: 'audio/different.mp3' },
        { image: 'images/pic_same.png', word: 'same', distractors: ['some', 'name'], audio: 'audio/same.mp3' },
        { image: 'images/pic_his.png', word: 'his', distractors: ['him', 'has'], audio: 'audio/his.mp3' }
    ];

    const equipRules = [
        { id: 'wood_gun', name: '木质手枪', img: 'images/equip_wood_gun.png', check: (st) => st.totalRight >= 1 },
        { id: 'silver_gun', name: '银色手枪', img: 'images/equip_silver_gun.png', check: (st) => st.combo >= 3 },
        { id: 'gold_gun', name: '金色手枪', img: 'images/equip_gold_gun.png', check: (st) => st.combo >= 5 },
        { id: 'magic_wand', name: '魔法权杖', img: 'images/equip_magic_wand.png', check: (st) => st.combo >= 10 },
        { id: 'armor', name: '防弹衣', img: 'images/equip_armor.png', check: (st) => st.totalRight >= 5 },
        { id: 'scope', name: '瞄准镜', img: 'images/equip_scope.png', check: (st) => st.totalRight >= 8 }
    ];

    let state = {
        currentIndex: 0,
        score: 0,
        lives: 3,
        combo: 0,
        totalRight: 0,
        timeLeft: 10,
        timerId: null,
        animId: null,
        isAnswering: false,
        wrongWords: [],
        equipments: [],
        targetsData: []
    };

    // ==========================================
    // 3. Web Audio API 纯音效实现
    // ==========================================
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioCtx;

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new AudioContext();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playTone(freq, type, duration, vol) {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    }

    function playHitSound() {
        initAudio();
        playTone(880, 'sine', 0.1, 0.5);
        setTimeout(() => playTone(1320, 'sine', 0.15, 0.5), 100);
    }

    function playMissSound() {
        initAudio();
        playTone(300, 'sawtooth', 0.2, 0.5);
        setTimeout(() => playTone(200, 'sawtooth', 0.3, 0.5), 200);
    }

    function playExplosionSound() {
        initAudio();
        const bufferSize = audioCtx.sampleRate * 0.3;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.8, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        noise.connect(gain);
        gain.connect(audioCtx.destination);
        noise.start();
    }

    // ==========================================
    // 4. 游戏主流程与交互逻辑
    // ==========================================
    const DOM = {
        startScreen: document.getElementById('start-screen'),
        gameScreen: document.getElementById('game-screen'),
        resultScreen: document.getElementById('result-screen'),
        startBtn: document.getElementById('start-btn'),
        restartBtn: document.getElementById('restart-btn'),
        currentQuestion: document.getElementById('current-question'),
        totalQuestion: document.getElementById('total-question'),
        timeLeft: document.getElementById('time-left'),
        score: document.getElementById('score'),
        livesInfo: document.getElementById('lives-info'),
        currentImage: document.getElementById('current-image'),
        targetArea: document.getElementById('target-area'),
        equipmentBar: document.getElementById('equipment-bar'),
        damageOverlay: document.getElementById('damage-overlay'),
        finalScore: document.getElementById('final-score'),
        wrongWordsList: document.getElementById('wrong-words-list'),
        collectedEquipments: document.getElementById('collected-equipments')
    };

    function startGame() {
        initAudio();
        // 初始化附加任务要求的全局变量
        window.Global.startTime = new Date().getTime();
        window.Global.rightNum = 0;
        window.Global.answerNum = 0;
        window.Global.questionCurArr1 = wordData;

        state = {
            currentIndex: 0,
            score: 0,
            lives: 3,
            combo: 0,
            totalRight: 0,
            timeLeft: 10,
            timerId: null,
            animId: null,
            isAnswering: false,
            wrongWords: [],
            equipments: [],
            targetsData: []
        };

        DOM.totalQuestion.innerText = wordData.length;
        updateUI();
        DOM.equipmentBar.innerHTML = '';
        
        DOM.startScreen.style.display = 'none';
        DOM.resultScreen.style.display = 'none';
        DOM.gameScreen.style.display = 'block';

        nextQuestion();
    }

    function nextQuestion() {
        if (state.lives <= 0 || state.currentIndex >= wordData.length) {
            endGame();
            return;
        }

        state.isAnswering = false;
        state.timeLeft = 10;
        DOM.timeLeft.innerText = state.timeLeft;
        DOM.currentQuestion.innerText = state.currentIndex + 1;
        
        const currentData = wordData[state.currentIndex];
        DOM.currentImage.src = currentData.image;
        DOM.currentImage.style.display = 'block';
        
        // 重新触发图片动画
        DOM.currentImage.style.animation = 'none';
        void DOM.currentImage.offsetWidth; 
        DOM.currentImage.style.animation = 'popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

        renderTargets(currentData);
        startTimer();
        startAnimation();
    }

    function renderTargets(data) {
        DOM.targetArea.innerHTML = '';
        state.targetsData = [];
        
        let words = [data.word, ...data.distractors];
        words.sort(() => Math.random() - 0.5); // 打乱

        const areaWidth = 1920;
        const targetWidth = 220;
        const spacing = areaWidth / 3;

        words.forEach((word, index) => {
            const el = document.createElement('div');
            el.className = 'target';
            el.innerHTML = `<div class="target-text">${word}</div>`;
            
            // 初始位置
            let startX = index * spacing + (spacing - targetWidth) / 2;
            let startY = 20;
            
            el.style.left = startX + 'px';
            el.style.top = startY + 'px';
            
            // 绑定点击事件
            el.addEventListener('mousedown', (e) => handleShoot(e, word, data.word, el));
            el.addEventListener('touchstart', (e) => {
                e.preventDefault();
                handleShoot(e.touches[0], word, data.word, el);
            }, {passive: false});

            DOM.targetArea.appendChild(el);

            // 基础速度，随连击数增加
            let speed = (2 + state.combo * 0.5) * (Math.random() > 0.5 ? 1 : -1);
            
            state.targetsData.push({
                el: el,
                x: startX,
                y: startY,
                baseY: startY,
                vx: speed,
                width: targetWidth
            });
        });
    }

    function startTimer() {
        clearInterval(state.timerId);
        state.timerId = setInterval(() => {
            if (state.isAnswering) return;
            state.timeLeft--;
            DOM.timeLeft.innerText = state.timeLeft;
            if (state.timeLeft <= 0) {
                handleTimeout();
            }
        }, 1000);
    }

    function startAnimation() {
        cancelAnimationFrame(state.animId);
        function animate() {
            if (!state.isAnswering) {
                state.targetsData.forEach(t => {
                    t.x += t.vx;
                    // 边缘反弹
                    if (t.x <= 0 || t.x >= 1920 - t.width) {
                        t.vx *= -1;
                        t.x = Math.max(0, Math.min(t.x, 1920 - t.width));
                    }
                    
                    // 连击数>=3时，开启波浪线轨迹
                    if (state.combo >= 3) {
                        t.y = t.baseY + Math.sin(t.x * 0.015) * 40;
                    } else {
                        t.y = t.baseY;
                    }
                    
                    t.el.style.left = t.x + 'px';
                    t.el.style.top = t.y + 'px';
                });
            }
            state.animId = requestAnimationFrame(animate);
        }
        animate();
    }

    function handleShoot(e, clickedWord, correctWord, targetEl) {
        if (state.isAnswering) return;
        state.isAnswering = true;
        window.Global.answerNum++;
        clearInterval(state.timerId);

        if (clickedWord === correctWord) {
            // 正确
            playHitSound();
            playExplosionSound();
            createParticles(e.clientX || e.pageX, e.clientY || e.pageY);
            
            // 播放单词发音
            const audioPath = wordData[state.currentIndex].audio;
            if (audioPath) {
                const wordAudio = new Audio(audioPath);
                wordAudio.play().catch(e => console.log("Audio play failed:", e));
            }

            state.score += 10;
            state.combo++;
            state.totalRight++;
            window.Global.rightNum++;
            
            targetEl.style.visibility = 'hidden';
            checkEquipments();
            updateUI();

            setTimeout(() => {
                state.currentIndex++;
                nextQuestion();
            }, 1500);

        } else {
            // 错误
            playMissSound();
            state.lives--;
            state.combo = 0;
            
            if (!state.wrongWords.includes(correctWord)) {
                state.wrongWords.push(correctWord);
            }

            // 屏幕红光闪烁
            DOM.damageOverlay.classList.remove('damage-flash');
            void DOM.damageOverlay.offsetWidth;
            DOM.damageOverlay.classList.add('damage-flash');

            updateUI();

            setTimeout(() => {
                state.currentIndex++;
                nextQuestion();
            }, 1500);
        }
    }

    function handleTimeout() {
        state.isAnswering = true;
        clearInterval(state.timerId);
        playMissSound();
        state.lives--;
        state.combo = 0;
        
        const correctWord = wordData[state.currentIndex].word;
        if (!state.wrongWords.includes(correctWord)) {
            state.wrongWords.push(correctWord);
        }

        DOM.damageOverlay.classList.remove('damage-flash');
        void DOM.damageOverlay.offsetWidth;
        DOM.damageOverlay.classList.add('damage-flash');

        updateUI();

        setTimeout(() => {
            state.currentIndex++;
            nextQuestion();
        }, 1500);
    }

    function createParticles(x, y) {
        // 将屏幕坐标转换为 #app 内的相对坐标
        const rect = app.getBoundingClientRect();
        const scale = rect.width / 1920;
        const relX = (x - rect.left) / scale;
        const relY = (y - rect.top) / scale;

        for (let i = 0; i < 15; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.left = relX + 'px';
            p.style.top = relY + 'px';
            
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 150 + 50;
            p.style.setProperty('--tx', Math.cos(angle) * distance + 'px');
            p.style.setProperty('--ty', Math.sin(angle) * distance + 'px');
            
            app.appendChild(p);
            setTimeout(() => p.remove(), 600);
        }
    }

    function checkEquipments() {
        equipRules.forEach(rule => {
            if (!state.equipments.find(e => e.id === rule.id) && rule.check(state)) {
                state.equipments.push(rule);
                
                // 添加到UI
                const el = document.createElement('div');
                el.className = 'equip-item';
                el.innerHTML = `<img src="${rule.img}" alt="${rule.name}">`;
                DOM.equipmentBar.appendChild(el);
                
                // 滚动到最新
                DOM.equipmentBar.scrollLeft = DOM.equipmentBar.scrollWidth;
            }
        });
    }

    function updateUI() {
        DOM.score.innerText = state.score;
        const hearts = DOM.livesInfo.querySelectorAll('.heart-icon');
        hearts.forEach((heart, index) => {
            if (index < state.lives) {
                heart.classList.remove('lost');
            } else {
                heart.classList.add('lost');
            }
        });
    }

    // ==========================================
    // 5. 结算与数据上报
    // ==========================================
    function endGame() {
        clearInterval(state.timerId);
        cancelAnimationFrame(state.animId);
        
        DOM.gameScreen.style.display = 'none';
        DOM.resultScreen.style.display = 'flex';
        
        DOM.finalScore.innerText = state.score;
        
        // 渲染错题
        DOM.wrongWordsList.innerHTML = state.wrongWords.length > 0 
            ? state.wrongWords.map(w => `<li>❌ ${w}</li>`).join('')
            : '<li>🎉 太棒了，没有错题！</li>';
            
        // 渲染收集的装备
        DOM.collectedEquipments.innerHTML = state.equipments.length > 0
            ? state.equipments.map(e => `<div class="equip-item" style="animation:none;"><img src="${e.img}" alt="${e.name}"></div>`).join('')
            : '<p style="font-size:30px; color:#999;">继续努力，下次收集装备！</p>';

        // 附加任务：上报数据
        let tmpTime = new Date().getTime() - window.Global.startTime;
        let message = {
            isRight: 3, // 写死
            rightNum: window.Global.rightNum,
            quizAcc: Math.round((window.Global.rightNum / window.Global.questionCurArr1.length) * 100) || 0,
            questionNum: window.Global.questionCurArr1.length,
            score: "", 
            total_score: state.score,
            gameType: 5,
            tmpl: "单词神枪手",
            answerTime: tmpTime > 0 ? tmpTime : 0,
            answerNum: window.Global.answerNum
        };
        
        console.log("Game Over Report:", message);
        if (window.anysdk && window.anysdk.over) {
            window.anysdk.over(message);
        }
    }

    // 绑定事件
    DOM.startBtn.addEventListener('click', startGame);
    DOM.restartBtn.addEventListener('click', startGame);

})();