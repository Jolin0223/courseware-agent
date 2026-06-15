(function () {
    // 1. 页面缩放逻辑
    var app = document.getElementById('app');
    function updateScale() {
        var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
        app.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
        app.style.visibility = 'visible';
    }
    window.addEventListener('resize', updateScale);
    updateScale();

    // 2. 初始化全局变量
    window.Global = window.Global || {};
    window.Global.startTime = new Date().getTime();
    window.Global.rightNum = 0;
    window.Global.answerNum = 0;
    window.Global.questionCurArr1 = [
        { id: 1, longest: 2 },
        { id: 2, longest: 2 },
        { id: 3, longest: 0 },
        { id: 4, longest: 1 },
        { id: 5, longest: 0 },
        { id: 6, longest: 3 },
        { id: 7, longest: 1 },
        { id: 8, longest: 4 },
        { id: 9, longest: 2 },
        { id: 10, longest: 3 }
    ];

    // 音频控制 (Web Audio API & HTMLAudioElement)
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

    function playTone(frequency, type, duration) {
        if (!audioCtx) return;
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + duration);
    }

    const sfx = {
        click: () => playTone(600, 'sine', 0.1),
        drag: () => playTone(300, 'triangle', 0.1),
        success: () => { playTone(523.25, 'sine', 0.1); setTimeout(() => playTone(659.25, 'sine', 0.2), 100); },
        fail: () => { playTone(300, 'sawtooth', 0.2); setTimeout(() => playTone(250, 'sawtooth', 0.3), 200); }
    };

    const voices = {
        intro: new Audio('audio/intro.mp3'),
        question: new Audio('audio/question.mp3'),
        wrong: new Audio('audio/wrong.mp3'),
        correct: new Audio('audio/correct.mp3')
    };

    function playVoice(key) {
        Object.values(voices).forEach(v => { v.pause(); v.currentTime = 0; });
        if (voices[key]) {
            voices[key].play().catch(e => console.log("Audio play prevented:", e));
        }
    }

    // 游戏状态与数据
    let currentLevel = 0;
    let isGameOver = false;
    let isCounting = false;
    let isTransitioning = false;
    let countingRopeIdx = -1;
    let countStep = 0;
    let draggedRopeIdx = -1;
    let dragY = 0;
    let hasWrongInCurrentLevel = false; // 修复：记录当前关卡是否答错过

    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const GRID_SIZE = 100;
    const COLS = 12;
    const ROWS = 9;

    // 关卡数据：绳子路径由网格坐标点组成
    const levelsData = [
        {
            ropes: [
                { color: '#ff4757', path: [[1,2],[2,2],[3,2],[4,2]], length: 3 },
                { color: '#ffa502', path: [[1,4],[2,4],[3,4],[4,4],[5,4]], length: 4 },
                { color: '#1e90ff', path: [[1,6],[2,6],[3,6],[4,6],[5,6],[6,6]], length: 5 }
            ]
        },
        {
            ropes: [
                { color: '#ff4757', path: [[2,2],[3,2],[3,3],[4,3],[5,3]], length: 4 },
                { color: '#ffa502', path: [[2,5],[3,5],[4,5],[4,6],[5,6],[6,6]], length: 5 },
                { color: '#1e90ff', path: [[7,2],[8,2],[8,3],[8,4],[9,4],[9,5],[10,5]], length: 6 }
            ]
        },
        {
            ropes: [
                { color: '#ff4757', path: [[2,2],[3,2],[3,3],[4,3],[5,3],[6,3],[6,4]], length: 6 },
                { color: '#ffa502', path: [[2,5],[3,5],[4,5],[5,5]], length: 3 },
                { color: '#1e90ff', path: [[2,7],[3,7],[4,7],[5,7],[6,7]], length: 4 }
            ]
        },
        {
            ropes: [
                { color: '#ff4757', path: [[2,2],[3,2],[4,2],[4,3],[5,3]], length: 4 },
                { color: '#ffa502', path: [[2,5],[3,5],[3,6],[4,6],[5,6],[6,6],[7,6]], length: 6 },
                { color: '#1e90ff', path: [[7,2],[8,2],[8,3],[9,3],[10,3]], length: 4 }
            ]
        },
        {
            ropes: [
                { color: '#ff4757', path: [[1,2],[2,2],[3,2],[3,3],[4,3],[5,3],[6,3]], length: 6 },
                { color: '#ffa502', path: [[1,5],[2,5],[2,6],[3,6],[4,6]], length: 4 },
                { color: '#1e90ff', path: [[6,6],[7,6],[7,7],[8,7],[9,7],[10,7]], length: 5 }
            ]
        },
        {
            ropes: [
                { color: '#ff4757', path: [[1,1],[2,1],[2,2],[3,2],[4,2]], length: 4 },
                { color: '#ffa502', path: [[1,3],[2,3],[3,3],[4,3],[5,3],[5,4]], length: 5 },
                { color: '#1e90ff', path: [[1,5],[2,5],[3,5],[4,5],[5,5],[6,5],[7,5]], length: 6 },
                { color: '#2ed573', path: [[1,7],[2,7],[2,8],[3,8],[4,8],[5,8],[6,8],[7,8]], length: 7 }
            ]
        },
        {
            ropes: [
                { color: '#ff4757', path: [[2,1],[3,1],[4,1],[5,1],[6,1],[7,1]], length: 5 },
                { color: '#ffa502', path: [[2,3],[3,3],[3,4],[4,4],[5,4],[6,4],[7,4],[8,4]], length: 7 },
                { color: '#1e90ff', path: [[2,5],[3,5],[4,5],[5,5],[6,5],[6,6],[7,6]], length: 6 },
                { color: '#2ed573', path: [[2,7],[3,7],[4,7],[5,7],[6,7]], length: 4 }
            ]
        },
        {
            ropes: [
                { color: '#ff4757', path: [[1,1],[2,1],[3,1],[4,1]], length: 3 },
                { color: '#ffa502', path: [[1,3],[2,3],[3,3],[4,3],[5,3]], length: 4 },
                { color: '#1e90ff', path: [[1,5],[2,5],[3,5],[4,5],[5,5],[6,5]], length: 5 },
                { color: '#2ed573', path: [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7],[7,7]], length: 6 },
                { color: '#9b59b6', path: [[1,8],[2,8],[3,8],[4,8],[5,8],[6,8],[7,8],[8,8]], length: 7 }
            ]
        },
        {
            ropes: [
                { color: '#ff4757', path: [[2,1],[3,1],[4,1],[5,1],[6,1]], length: 4 },
                { color: '#ffa502', path: [[2,2],[3,2],[4,2],[5,2],[6,2],[7,2]], length: 5 },
                { color: '#1e90ff', path: [[2,4],[3,4],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5]], length: 7 },
                { color: '#2ed573', path: [[2,6],[3,6],[4,6],[5,6],[6,6],[7,6]], length: 5 },
                { color: '#9b59b6', path: [[2,8],[3,8],[4,8],[5,8],[6,8],[7,8],[8,8]], length: 6 }
            ]
        },
        {
            ropes: [
                { color: '#ff4757', path: [[3,1],[4,1],[5,1],[6,1],[7,1]], length: 4 },
                { color: '#ffa502', path: [[3,2],[4,2],[5,2],[6,2],[7,2],[8,2]], length: 5 },
                { color: '#1e90ff', path: [[3,4],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4]], length: 6 },
                { color: '#2ed573', path: [[3,5],[4,5],[4,6],[5,6],[6,6],[7,6],[8,6],[9,6],[10,6]], length: 8 },
                { color: '#9b59b6', path: [[3,8],[4,8],[5,8],[6,8],[7,8],[8,8],[9,8],[10,8]], length: 7 }
            ]
        }
    ];

    // 3. Canvas渲染
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 绘制网格
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 2;
        for (let i = 0; i <= COLS; i++) {
            ctx.beginPath();
            ctx.moveTo(i * GRID_SIZE, 0);
            ctx.lineTo(i * GRID_SIZE, ROWS * GRID_SIZE);
            ctx.stroke();
        }
        for (let i = 0; i <= ROWS; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * GRID_SIZE);
            ctx.lineTo(COLS * GRID_SIZE, i * GRID_SIZE);
            ctx.stroke();
        }

        if (isGameOver) return;

        const currentRopes = levelsData[currentLevel].ropes;

        // 绘制绳子
        currentRopes.forEach((rope, idx) => {
            // 如果正在数格子，高亮经过的格子
            if (isCounting && countingRopeIdx === idx) {
                for (let i = 0; i < countStep; i++) {
                    if (i < rope.path.length - 1) {
                        const p1 = rope.path[i];
                        const p2 = rope.path[i+1];
                        const midX = (p1[0] + p2[0]) / 2 * GRID_SIZE;
                        const midY = (p1[1] + p2[1]) / 2 * GRID_SIZE;
                        
                        ctx.fillStyle = 'rgba(255, 255, 0, 0.4)';
                        ctx.fillRect(midX - GRID_SIZE/2, midY - GRID_SIZE/2, GRID_SIZE, GRID_SIZE);
                        
                        ctx.fillStyle = '#ff8c00';
                        ctx.font = 'bold 40px Arial';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(i + 1, midX, midY);
                    }
                }
            }

            // 绘制绳子本身
            ctx.beginPath();
            ctx.strokeStyle = rope.color;
            ctx.lineWidth = 12;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (draggedRopeIdx === idx) {
                // 拉直状态
                const startX = rope.path[0][0] * GRID_SIZE;
                const startY = rope.path[0][1] * GRID_SIZE;
                ctx.moveTo(startX, startY);
                ctx.lineTo(startX, dragY);
                
                // 底部拉直的线段
                const straightLength = rope.length * GRID_SIZE;
                ctx.moveTo(startX, dragY);
                ctx.lineTo(startX + straightLength, dragY);
            } else {
                // 弯曲状态
                rope.path.forEach((p, i) => {
                    const x = p[0] * GRID_SIZE;
                    const y = p[1] * GRID_SIZE;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                });
            }
            ctx.stroke();
        });
    }

    // 4. 交互逻辑
    let isDragging = false;
    let startX = 0, startY = 0;
    let pressTimer = null;

    function getRopeAtPos(x, y) {
        const currentRopes = levelsData[currentLevel].ropes;
        for (let i = 0; i < currentRopes.length; i++) {
            const rope = currentRopes[i];
            // 修复：计算点击位置到绳子各线段的最短距离，而不是仅判断节点
            for (let j = 0; j < rope.path.length - 1; j++) {
                const px1 = rope.path[j][0] * GRID_SIZE;
                const py1 = rope.path[j][1] * GRID_SIZE;
                const px2 = rope.path[j+1][0] * GRID_SIZE;
                const py2 = rope.path[j+1][1] * GRID_SIZE;
                
                const A = x - px1;
                const B = y - py1;
                const C = px2 - px1;
                const D = py2 - py1;

                const dot = A * C + B * D;
                const len_sq = C * C + D * D;
                let param = -1;
                if (len_sq !== 0) {
                    param = dot / len_sq;
                }

                let xx, yy;
                if (param < 0) {
                    xx = px1;
                    yy = py1;
                } else if (param > 1) {
                    xx = px2;
                    yy = py2;
                } else {
                    xx = px1 + param * C;
                    yy = py1 + param * D;
                }

                const dx = x - xx;
                const dy = y - yy;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 40) {
                    return i;
                }
            }
        }
        return -1;
    }

    function handleStart(e) {
        if (e.type === 'touchstart') {
            e.preventDefault();
        }
        if (isGameOver || isCounting || isTransitioning) return;
        initAudio();
        const rect = canvas.getBoundingClientRect();
        const scale = canvas.width / rect.width;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        startX = (clientX - rect.left) * scale;
        startY = (clientY - rect.top) * scale;

        const ropeIdx = getRopeAtPos(startX, startY);
        if (ropeIdx !== -1) {
            pressTimer = setTimeout(() => {
                isDragging = true;
                draggedRopeIdx = ropeIdx;
                dragY = startY;
                sfx.drag();
            }, 300); // 长按300ms触发拖拽
        }
    }

    function handleMove(e) {
        if (!isDragging) return;
        const rect = canvas.getBoundingClientRect();
        const scale = canvas.width / rect.width;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        dragY = (clientY - rect.top) * scale;
        draw();
    }

    function handleEnd(e) {
        if (pressTimer) clearTimeout(pressTimer);
        
        if (isDragging) {
            isDragging = false;
            draggedRopeIdx = -1;
            draw();
            return;
        }

        if (isGameOver || isCounting || isTransitioning) return;

        const rect = canvas.getBoundingClientRect();
        const scale = canvas.width / rect.width;
        const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
        const endX = (clientX - rect.left) * scale;
        const endY = (clientY - rect.top) * scale;

        // 如果没有移动太多，视为点击
        if (Math.hypot(endX - startX, endY - startY) < 20) {
            const ropeIdx = getRopeAtPos(endX, endY);
            if (ropeIdx !== -1) {
                checkAnswer(ropeIdx);
            }
        }
    }

    canvas.addEventListener('mousedown', handleStart);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('touchstart', handleStart, {passive: false});
    window.addEventListener('touchmove', handleMove, {passive: false});
    window.addEventListener('touchend', handleEnd);

    // 5. 答题判定与动态数格
    function checkAnswer(idx) {
        if (isTransitioning) return;
        window.Global.answerNum++;
        const correctIdx = window.Global.questionCurArr1[currentLevel].longest;
        
        if (idx === correctIdx) {
            // 正确
            isTransitioning = true;
            // 修复：只有当前关卡未答错过，才增加正确数
            if (!hasWrongInCurrentLevel) {
                window.Global.rightNum++;
            }
            sfx.success();
            playVoice('correct');
            
            // 切换左侧动画
            document.getElementById('animal-pit').style.display = 'none';
            const savedImg = document.getElementById('animal-saved');
            savedImg.style.display = 'block';
            savedImg.classList.add('jumping');

            setTimeout(() => {
                savedImg.style.display = 'none';
                savedImg.classList.remove('jumping');
                document.getElementById('animal-pit').style.display = 'block';
                nextLevel();
            }, 3000);
        } else {
            // 错误，触发数格辅助
            hasWrongInCurrentLevel = true; // 修复：记录当前关卡已答错
            sfx.fail();
            playVoice('wrong');
            startCountingAssist(idx);
        }
    }

    function startCountingAssist(idx) {
        isCounting = true;
        countingRopeIdx = idx;
        countStep = 0;
        const rope = levelsData[currentLevel].ropes[idx];
        const totalSteps = rope.path.length - 1;

        const interval = setInterval(() => {
            countStep++;
            sfx.click();
            draw();
            if (countStep >= totalSteps) {
                clearInterval(interval);
                setTimeout(() => {
                    isCounting = false;
                    countingRopeIdx = -1;
                    draw();
                }, 2000);
            }
        }, 500);
    }

    function nextLevel() {
        isTransitioning = false;
        hasWrongInCurrentLevel = false; // 修复：进入下一关时重置答错状态
        currentLevel++;
        if (currentLevel >= window.Global.questionCurArr1.length) {
            gameOver();
        } else {
            document.getElementById('progress-text').innerText = `关卡: ${currentLevel + 1} / 10`;
            playVoice('question');
            draw();
        }
    }

    // 7. 数据上报
    function gameOver() {
        isGameOver = true;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        let tmpTime = new Date().getTime() - window.Global.startTime;
        let message = {
            isRight: 3,
            rightNum: window.Global.rightNum,
            quizAcc: Math.round((window.Global.rightNum / window.Global.questionCurArr1.length) * 100),
            questionNum: window.Global.questionCurArr1.length,
            score: "",
            total_score: window.Global.rightNum * 10,
            gameType: 5,
            tmpl: "比绳子长短",
            answerTime: tmpTime > 0 ? tmpTime : 0,
            answerNum: window.Global.answerNum,
        };
        console.log(message);
        if (window.anysdk && window.anysdk.over) {
            window.anysdk.over(message);
        }
    }

    // 重播按钮
    document.getElementById('replay-btn').addEventListener('click', () => {
        initAudio();
        sfx.click();
        playVoice('question');
    });

    // 游戏初始化
    function initGame() {
        document.getElementById('progress-text').innerText = `关卡: 1 / 10`;
        draw();
        
        // 必须由用户交互触发音频，这里监听第一次点击来播放intro
        const startInteraction = () => {
            initAudio();
            playVoice('intro');
            setTimeout(() => playVoice('question'), 4000);
            document.removeEventListener('click', startInteraction);
            document.removeEventListener('touchstart', startInteraction);
        };
        document.addEventListener('click', startInteraction);
        document.addEventListener('touchstart', startInteraction);
    }

    initGame();
})();