(function () {
    // 1. 1920x1080 缩放适配逻辑
    var app = document.getElementById('app');
    var currentScale = 1;
    function updateScale() {
        currentScale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
        app.style.transform = 'translate(-50%, -50%) scale(' + currentScale + ')';
        app.style.visibility = 'visible';
    }
    window.addEventListener('resize', updateScale);
    updateScale();

    // 2. 定义题目数据结构
    var questions = [
        {
            sentence: "人民英雄纪念碑___在天安门广场上。",
            correct: "屹立",
            options: ["屹立", "矗立", "耸立"],
            initBg: "images/bg_default.webp",
            correctBg: "images/bg_yili.webp",
            analysis: "<span class='highlight-word'>屹立</span>多指稳固不可动摇，常用于人、精神或纪念碑等；<span class='highlight-word'>矗立</span>多指高大且直；<span class='highlight-word'>耸立</span>多指高高地突起。"
        },
        {
            sentence: "一座座高楼大厦___在城市中心。",
            correct: "矗立",
            options: ["屹立", "矗立", "耸立"],
            initBg: "images/bg_default.webp",
            correctBg: "images/bg_chuli.webp",
            analysis: "<span class='highlight-word'>矗立</span>多指高大且直，常用于高楼、建筑等；<span class='highlight-word'>屹立</span>多指稳固不可动摇；<span class='highlight-word'>耸立</span>多指高高地突起。"
        },
        {
            sentence: "陡峭的山峰___在云海之中。",
            correct: "耸立",
            options: ["屹立", "矗立", "耸立"],
            initBg: "images/bg_default.webp",
            correctBg: "images/bg_songli.webp",
            analysis: "<span class='highlight-word'>耸立</span>多指高高地突起，常用于山峰、高塔等自然或细长建筑；<span class='highlight-word'>矗立</span>多指高大且直；<span class='highlight-word'>屹立</span>多指稳固不可动摇。"
        },
        {
            sentence: "风停了，原本波浪翻滚的湖面恢复了___。",
            correct: "平静",
            options: ["安静", "平静"],
            initBg: "images/bg_bolang.webp",
            correctBg: "images/bg_pingjing.webp",
            analysis: "<span class='highlight-word'>平静</span>多指环境或心情没有波澜、动荡，常用于水面、心情等；<span class='highlight-word'>安静</span>多指没有声音、不吵闹。"
        },
        {
            sentence: "同学们都在认真看书，教室里非常___。",
            correct: "安静",
            options: ["安静", "平静"],
            initBg: "images/bg_default.webp",
            correctBg: "images/bg_anjing.webp",
            analysis: "<span class='highlight-word'>安静</span>多指没有声音、不吵闹，常用于环境、人；<span class='highlight-word'>平静</span>多指没有波澜、动荡。"
        }
    ];

    // 初始化全局变量
    window.Global = window.Global || {};
    window.Global.startTime = new Date().getTime();
    window.Global.rightNum = 0;
    window.Global.answerNum = 0;
    window.Global.questionCurArr1 = questions;

    var currentQuestionIndex = 0;
    var score = 0;
    var mistakes = [];
    var isAudioInitialized = false;

    // Web Audio API 音效
    var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    function playSound(type) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        var osc = audioCtx.createOscillator();
        var gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        if (type === 'correct') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
            osc.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
        } else if (type === 'wrong') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
        }
    }

    // 播放欢迎语音 (需用户交互触发)
    function playWelcomeAudio() {
        if (!isAudioInitialized) {
            var welcomeAudio = document.getElementById('welcome-audio');
            if (welcomeAudio) {
                welcomeAudio.play().catch(function(e){ console.log("Audio play prevented"); });
            }
            if (audioCtx.state === 'suspended') audioCtx.resume();
            isAudioInitialized = true;
        }
    }

    document.addEventListener('click', playWelcomeAudio, { once: true });
    document.addEventListener('touchstart', playWelcomeAudio, { once: true });

    // 渲染题目
    function renderQuestion(index) {
        var q = questions[index];
        // 使用正则表达式匹配 '___' 及其可能紧跟的标点符号，包裹在 nowrap 的 span 中防止标点单独换行
        var sentenceHtml = q.sentence.replace(/___([。，！？.,!?]?)/, '<span style="white-space: nowrap;"><span class="drop-zone" id="drop-zone"></span>$1</span>');
        document.getElementById('sentence-container').innerHTML = sentenceHtml;
        
        var bgImage = document.getElementById('bg-image');
        bgImage.style.opacity = 0;
        setTimeout(function() {
            bgImage.src = q.initBg;
            bgImage.style.opacity = 1;
        }, 300);

        var cardsArea = document.getElementById('cards-area');
        cardsArea.innerHTML = '';
        
        // 打乱选项
        var options = q.options.slice().sort(function() { return Math.random() - 0.5; });
        var totalWidth = 1920;
        var cardWidth = 260;
        var gap = totalWidth / (options.length + 1);

        options.forEach(function(opt, i) {
            var card = document.createElement('div');
            card.className = 'word-card';
            card.innerText = opt;
            
            var leftPos = gap * (i + 1) - cardWidth / 2;
            card.style.left = leftPos + 'px';
            card.style.top = '70px'; // 相对于 cards-area
            
            card.dataset.initLeft = leftPos;
            card.dataset.initTop = 70;
            
            bindDragEvents(card);
            cardsArea.appendChild(card);
        });
    }

    // 3. 拖拽交互逻辑
    var isDragging = false;
    var currentCard = null;
    var startX, startY, initialLeft, initialTop;

    function bindDragEvents(card) {
        card.addEventListener('mousedown', onDragStart);
        card.addEventListener('touchstart', onDragStart, { passive: false });
    }

    function onDragStart(e) {
        if (e.type === 'touchstart') e.preventDefault();
        playWelcomeAudio(); // 确保音频上下文激活
        
        isDragging = true;
        currentCard = this;
        currentCard.classList.add('dragging');
        
        // 修复：通过判断 e.touches 是否存在来获取坐标，避免 clientX 为 0 时触发 falsy 判断导致读取 undefined 的 touches
        var clientX = e.touches ? e.touches[0].clientX : e.clientX;
        var clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        startX = clientX;
        startY = clientY;
        initialLeft = parseFloat(currentCard.style.left) || 0;
        initialTop = parseFloat(currentCard.style.top) || 0;
    }

    function onDragMove(e) {
        if (!isDragging || !currentCard) return;
        if (e.type === 'touchmove') e.preventDefault();
        
        // 修复：通过判断 e.touches 是否存在来获取坐标，避免 clientX 为 0 时触发 falsy 判断导致读取 undefined 的 touches
        var clientX = e.touches ? e.touches[0].clientX : e.clientX;
        var clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        var dx = (clientX - startX) / currentScale;
        var dy = (clientY - startY) / currentScale;
        
        currentCard.style.left = (initialLeft + dx) + 'px';
        currentCard.style.top = (initialTop + dy) + 'px';
        
        checkCollision();
    }

    function checkCollision() {
        var dropZone = document.getElementById('drop-zone');
        if (!dropZone) return false;
        
        var cardRect = currentCard.getBoundingClientRect();
        var dropRect = dropZone.getBoundingClientRect();
        
        var cardCenterX = cardRect.left + cardRect.width / 2;
        var cardCenterY = cardRect.top + cardRect.height / 2;
        var dropCenterX = dropRect.left + dropRect.width / 2;
        var dropCenterY = dropRect.top + dropRect.height / 2;
        
        var distance = Math.sqrt(Math.pow(cardCenterX - dropCenterX, 2) + Math.pow(cardCenterY - dropCenterY, 2));
        
        if (distance < 120 * currentScale) {
            dropZone.classList.add('highlight');
            return true;
        } else {
            dropZone.classList.remove('highlight');
            return false;
        }
    }

    // 4. 正误判定
    function onDragEnd(e) {
        if (!isDragging || !currentCard) return;
        isDragging = false;
        currentCard.classList.remove('dragging');
        
        var isHit = checkCollision();
        var dropZone = document.getElementById('drop-zone');
        if (dropZone) dropZone.classList.remove('highlight');
        
        window.Global.answerNum++;
        
        if (isHit) {
            var word = currentCard.innerText;
            var currentQ = questions[currentQuestionIndex];
            
            if (word === currentQ.correct) {
                // 正确
                playSound('correct');
                window.Global.rightNum++;
                score += 10;
                document.getElementById('score').innerText = score;
                
                dropZone.innerText = word;
                dropZone.classList.add('success-flash');
                currentCard.style.display = 'none';
                
                // 禁用其他卡片拖拽
                var allCards = document.querySelectorAll('.word-card');
                allCards.forEach(function(c) { c.style.pointerEvents = 'none'; });
                
                var bgImage = document.getElementById('bg-image');
                bgImage.style.opacity = 0;
                setTimeout(function() {
                    bgImage.src = currentQ.correctBg;
                    bgImage.style.opacity = 1;
                }, 500);
                
                var progress = ((currentQuestionIndex + 1) / questions.length) * 100;
                document.getElementById('progress-bar').style.width = progress + '%';
                
                setTimeout(function() {
                    currentQuestionIndex++;
                    if (currentQuestionIndex < questions.length) {
                        renderQuestion(currentQuestionIndex);
                    } else {
                        gameOver();
                    }
                }, 2500);
                
            } else {
                // 错误
                playSound('wrong');
                currentCard.classList.add('shake');
                var cardToReset = currentCard;
                setTimeout(function() {
                    cardToReset.classList.remove('shake');
                    cardToReset.style.left = cardToReset.dataset.initLeft + 'px';
                    cardToReset.style.top = cardToReset.dataset.initTop + 'px';
                }, 500);
                
                if (mistakes.indexOf(currentQuestionIndex) === -1) {
                    mistakes.push(currentQuestionIndex);
                }
            }
        } else {
            // 未命中弹回
            currentCard.style.left = currentCard.dataset.initLeft + 'px';
            currentCard.style.top = currentCard.dataset.initTop + 'px';
        }
        
        currentCard = null;
    }

    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('touchmove', onDragMove, { passive: false });
    document.addEventListener('mouseup', onDragEnd);
    document.addEventListener('touchend', onDragEnd);

    // 5. 游戏结束逻辑
    function gameOver() {
        var modal = document.getElementById('result-modal');
        var mistakesList = document.getElementById('mistakes-list');
        mistakesList.innerHTML = '';
        
        if (mistakes.length === 0) {
            mistakesList.innerHTML = '<div class="mistake-item"><div class="mistake-sentence" style="text-align:center; color:#32CD32;">太棒了！你全部答对了，没有错题！</div></div>';
        } else {
            mistakes.forEach(function(index) {
                var q = questions[index];
                var item = document.createElement('div');
                item.className = 'mistake-item';
                item.innerHTML = '<div class="mistake-sentence">' + q.sentence.replace('___', '<span class="highlight-word">' + q.correct + '</span>') + '</div>' +
                                 '<div class="mistake-analysis">解析：' + q.analysis + '</div>';
                mistakesList.appendChild(item);
            });
        }
        
        modal.classList.remove('hidden');
        
        // 上报数据
        var tmpTime = new Date().getTime() - window.Global.startTime;
        var message = {
            isRight: 3,
            rightNum: window.Global.rightNum,
            quizAcc: Math.round((window.Global.rightNum / window.Global.questionCurArr1.length) * 100),
            questionNum: window.Global.questionCurArr1.length,
            score: "",
            total_score: window.Global.rightNum * 10,
            gameType: 5,
            tmpl: "近义词大挑战",
            answerTime: tmpTime > 0 ? tmpTime : 0,
            answerNum: window.Global.answerNum
        };
        console.log("Game Over Report:", message);
        if (window.anysdk && window.anysdk.over) {
            window.anysdk.over(message);
        }
    }

    document.getElementById('restart-btn').addEventListener('click', function() {
        currentQuestionIndex = 0;
        score = 0;
        mistakes = [];
        window.Global.startTime = new Date().getTime();
        window.Global.rightNum = 0;
        window.Global.answerNum = 0;
        
        document.getElementById('score').innerText = '0';
        document.getElementById('progress-bar').style.width = '0%';
        document.getElementById('result-modal').classList.add('hidden');
        
        renderQuestion(0);
    });

    // 初始化第一题
    renderQuestion(0);

})();