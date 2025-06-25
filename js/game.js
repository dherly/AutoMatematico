document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos del DOM ---
    const startControls = document.getElementById('start-controls');
    const playerSelect = document.getElementById('player-select');
    const startButton = document.getElementById('start-button');
    const gameContainer = document.getElementById('game-container');
    const car = document.getElementById('car');
    const problemDisplay = document.getElementById('problem-display');
    const numbersArea = document.getElementById('numbers-area');
    const scoreDisplay = document.getElementById('score');
    const timerDisplay = document.getElementById('timer');
    const feedbackElement = document.getElementById('feedback');
    const gameOverMessage = document.getElementById('game-over-message');
    const finalScoreDisplay = document.getElementById('final-score');
    const roadElement = document.getElementById('road'); // Para controlar animación

    // --- Sonidos ---
    const soundCorrect = document.getElementById('sound-correct');
    const soundIncorrect = document.getElementById('sound-incorrect');
    const soundBackground = document.getElementById('sound-background');

    const gameDurationSelect = document.getElementById('game-duration-select');
    const fallDurationSelect = document.getElementById('fall-duration-select');

    // --- Estado del Juego ---
    let gameRunning = false;
    let currentPlayer = '';
    let score = 0;
    let timeLeft = 60; // 1 minuto
    let currentLane = 1; // 0: izquierda, 1: centro, 2: derecha
    let timerInterval = null;
    let problemTimeout = null;
    let currentProblem = { num1: 0, num2: 0, correctAnswer: 0, answers: [], correctLane: -1 };
    let currentGameStartTime = null;
    let fallDuration = 3000;
    const lanes = [0, 1, 2]; // Índices de carriles

    let gameDuration = 60; // VALOR POR DEFECTO, se cambiará

    

    // --- Configuración Inicial ---
    const lanePositions = { // Clases CSS para la posición del coche
        0: 'lane-0',
        1: 'lane-1',
        2: 'lane-2'
    };

    // --- Funciones del Juego ---

    if(startButton) { // Buena práctica verificar si el elemento existe antes de añadir listener
        startButton.addEventListener('click', startGame);
    } else {
        console.error("Botón de inicio (startButton) no encontrado.");
    }

    function updateCarPosition() {
        Object.values(lanePositions).forEach(className => {
            // console.log("Removing:", className, "Has class:", car.classList.contains(className));
            car.classList.remove(className);
        });
        const classToAdd = lanePositions[currentLane];
        console.log("Attempting to add class for lane " + currentLane + ":", classToAdd);
        if (classToAdd) {
            car.classList.add(classToAdd);
        } else {
            console.error("No CSS class defined for lane:", currentLane);
        }
    }

    function moveCar(direction) {
        if (!gameRunning) return;
        let previousLane = currentLane; // Para depuración
    
        if (direction === 'left' && currentLane > 0) {
            currentLane--;
        } else if (direction === 'right' && currentLane < 2) {
            currentLane++;
        }
        console.log(`Moved from ${previousLane} to ${currentLane}. Car should be in ${lanePositions[currentLane]}`); // Log para depurar
        updateCarPosition();
    }

    // function generateProblem() {
    //     if (!gameRunning) return;
    //     numbersArea.innerHTML = '';
    //     currentProblem.answers = [];
    //     currentProblem.correctLane = -1;
    //     const num1 = Math.floor(Math.random() * 9) + 1;
    //     const num2 = Math.floor(Math.random() * 9) + 1;
    //     currentProblem.num1 = num1;
    //     currentProblem.num2 = num2;
    //     currentProblem.correctAnswer = num1 * num2;
    //     problemDisplay.textContent = `${num1} x ${num2}`;
    //     const incorrectAnswers = new Set();
    //     while (incorrectAnswers.size < 2) {
    //         let randomAnswer;
    //         if (Math.random() > 0.5) {
    //              const offset = Math.floor(Math.random() * 3) + 1; // Reducir offset para no alejarse tanto
    //              randomAnswer = Math.random() > 0.5 ? currentProblem.correctAnswer + offset : currentProblem.correctAnswer - offset;
    //              randomAnswer = Math.max(1, randomAnswer);
    //         } else {
    //             randomAnswer = Math.floor(Math.random() * 81) + 1;
    //         }
    //         if (randomAnswer !== currentProblem.correctAnswer && randomAnswer > 0 && !incorrectAnswers.has(randomAnswer)) { // Evitar duplicados en incorrectas
    //             incorrectAnswers.add(randomAnswer);
    //         }
    //     }
    //     const answers = [currentProblem.correctAnswer, ...incorrectAnswers];
    //     shuffleArray(answers);
    //     currentProblem.answers = answers;
    //     answers.forEach((answer, index) => {
    //         if (answer === currentProblem.correctAnswer) currentProblem.correctLane = index;
    //         createFallingNumber(answer, index, answer === currentProblem.correctAnswer);
    //     });
    //     clearTimeout(problemTimeout);
    //     problemTimeout = setTimeout(checkCollision, fallDuration);
    // }

    function generateProblem() {
        if (!gameRunning) return;
        numbersArea.innerHTML = '';
        currentProblem.answers = [];
        currentProblem.correctLane = -1;

        // Lógica con pesos: Multiplicación y división tienen el doble de probabilidad que suma y resta.
        // También se añade la resta a las operaciones posibles.
        const weightedProblemTypes = [
            'multiplication', 'multiplication',
            'division', 'division',
            'addition',
            'subtraction'
        ];
        const selectedProblemType = weightedProblemTypes[Math.floor(Math.random() * weightedProblemTypes.length)];

        let num1, num2, correctAnswer, operationString;
        const minNum = 2;
        const maxNum = 11;

        switch (selectedProblemType) {
            case 'addition':
                num1 = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
                num2 = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
                correctAnswer = num1 + num2;
                operationString = `${num1} + ${num2}`;
                break;
            case 'subtraction':
                // Asegurar que el resultado no sea negativo y no sea cero.
                let s_num1 = Math.floor(Math.random() * 10) + 5; // Números entre 5 y 14
                let s_num2 = Math.floor(Math.random() * 10) + 5;
                if (s_num1 === s_num2) {
                    s_num1 += 1; // Evitar que el resultado sea 0
                }
                num1 = Math.max(s_num1, s_num2);
                num2 = Math.min(s_num1, s_num2);
                correctAnswer = num1 - num2;
                operationString = `${num1} - ${num2}`;
                break;
            case 'division':
                // Asegurar que la división sea exacta y num2 no sea cero
                // Generamos el resultado y un operando, luego calculamos el otro
                correctAnswer = Math.floor(Math.random() * (maxNum - minNum)) + minNum; // Resultado entre minNum y maxNum-1
                num2 = Math.floor(Math.random() * (maxNum - minNum)) + minNum;          // Divisor
                if (num2 === 0) num2 = minNum; // Evitar división por cero (aunque el rango ya lo evita)
                num1 = correctAnswer * num2;
                // Asegurar que num1 esté dentro de un rango razonable, si no, reintentar (o limitar correctAnswer y num2)
                // Para simplificar, nos aseguramos que num1 no sea demasiado grande, si no, podría generar otro tipo de problema.
                if (num1 > maxNum * maxNum || num1 < minNum) { // Heurística simple
                    // Si la división es muy compleja, recurrimos a una multiplicación
                    num1 = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
                    num2 = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
                    correctAnswer = num1 * num2;
                    operationString = `${num1} x ${num2}`;
                } else {
                    operationString = `${num1} ÷ ${num2}`;
                }
                break;
            case 'multiplication':
            default: // Por defecto, o si la división falló en ser simple
                num1 = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
                num2 = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
                correctAnswer = num1 * num2;
                operationString = `${num1} x ${num2}`;
                break;
        }

        currentProblem.num1 = num1; // Aunque no siempre sean num1 y num2 directos, los guardamos por consistencia
        currentProblem.num2 = num2;
        currentProblem.correctAnswer = correctAnswer;
        currentProblem.operationString = operationString; // Guardar la representación del problema

        problemDisplay.textContent = operationString;

        const incorrectAnswers = new Set();
        const maxPossibleAnswer = (maxNum * maxNum) + maxNum; // Un límite superior aproximado para las respuestas

        while (incorrectAnswers.size < 2) {
            let randomAnswer;
            // Generar respuestas incorrectas que no sean obvias pero dentro de un rango plausible
            const offsetType = Math.random();
            if (offsetType < 0.4) { // Respuesta cercana
                const offset = Math.floor(Math.random() * (maxNum / 2)) + 1;
                randomAnswer = Math.random() > 0.5 ? correctAnswer + offset : correctAnswer - offset;
            } else if (offsetType < 0.8) { // Múltiplo cercano de uno de los operandos (si aplica)
                const operand = Math.random() > 0.5 ? num1 : num2;
                randomAnswer = operand * (Math.floor(Math.random() * (maxNum - minNum)) + minNum -1); // -1 para variar
            } else { // Respuesta más aleatoria
                randomAnswer = Math.floor(Math.random() * maxPossibleAnswer) + 1;
            }
            randomAnswer = Math.max(1, Math.round(randomAnswer)); // Asegurar que sea positivo y entero

            if (randomAnswer !== correctAnswer && randomAnswer > 0 && !incorrectAnswers.has(randomAnswer)) {
                incorrectAnswers.add(randomAnswer);
            }
        }

        const answers = [correctAnswer, ...incorrectAnswers];
        shuffleArray(answers);
        currentProblem.answers = answers;

        answers.forEach((answer, index) => {
            if (answer === correctAnswer) currentProblem.correctLane = index;
            createFallingNumber(answer, index, answer === correctAnswer);
        });

        clearTimeout(problemTimeout);
        // Usar la variable fallDuration (que está en ms)
        problemTimeout = setTimeout(checkCollision, fallDuration);
    }

    // function createFallingNumber(number, laneIndex, isCorrect) {
    //     const numberElement = document.createElement('div');
    //     numberElement.classList.add('falling-number');
    //     numberElement.textContent = number;
    //     numberElement.dataset.lane = laneIndex;
    //     numberElement.dataset.value = number;
    //     if (isCorrect) numberElement.classList.add('correct-lane-number'); // Podrías no necesitarla si el feedback es solo por carril
    //     numberElement.style.top = '60px';
    //     numbersArea.appendChild(numberElement);
    //     void numberElement.offsetWidth;
    //     numberElement.style.transition = `top ${fallDuration / 1000}s linear`;
    //     numberElement.style.top = `calc(100% - 130px)`;
    // }

    function createFallingNumber(number, laneIndex, isCorrect) {
        const numberElement = document.createElement('div');
        numberElement.classList.add('falling-number');
        numberElement.textContent = number;
        numberElement.dataset.lane = laneIndex;
        numberElement.dataset.value = number;
        if (isCorrect) numberElement.classList.add('correct-lane-number');
        numberElement.style.top = '60px';
        numbersArea.appendChild(numberElement);
        void numberElement.offsetWidth;
        // Usar la variable fallDuration (que está en ms)
        numberElement.style.transition = `top ${fallDuration / 1000}s linear`;
        numberElement.style.top = `calc(100% - 130px)`;
    }

    function checkCollision() {
        if (!gameRunning) return;
        if (!currentProblem || typeof currentProblem.num1 === 'undefined' || typeof currentProblem.num2 === 'undefined' || typeof currentProblem.correctAnswer === 'undefined' || currentProblem.correctLane === -1) {
            console.error("checkCollision: currentProblem o sus propiedades esenciales no están definidas. Abortando.");
            return;
        }
        const correctLaneIndex = currentProblem.correctLane;
        let selectedAnswerInLane = -1;
        const numberElements = numbersArea.querySelectorAll('.falling-number');
        numberElements.forEach(el => {
            if (el.dataset && typeof el.dataset.lane !== 'undefined' && typeof el.dataset.value !== 'undefined') {
                if (parseInt(el.dataset.lane) === currentLane) {
                    selectedAnswerInLane = parseInt(el.dataset.value);
                }
            }
        });
        let wasCorrect = false;
        if (currentLane === correctLaneIndex) { // La colisión se determina por estar en el carril correcto
            score++;
            scoreDisplay.textContent = score;
            showFeedback('¡Correcto!', true);
            if (soundCorrect && typeof soundCorrect.play === 'function') soundCorrect.play().catch(e => console.warn("Error soundCorrect:", e));
            wasCorrect = true;
        } else {
            showFeedback('¡Incorrecto!', false);
            if (soundIncorrect && typeof soundIncorrect.play === 'function') soundIncorrect.play().catch(e => console.warn("Error soundIncorrect:", e));
            wasCorrect = false;
        }

        // Guardar resultado con el timestamp de inicio del juego actual
        if (currentGameStartTime !== null) { // Solo guardar si el juego ha iniciado formalmente
            // saveResultToDB(
            //     `${currentProblem.num1} x ${currentProblem.num2}`,
            //     selectedAnswerInLane, // selectedAnswerInLane ya es -1 si no se encontró, o el valor
            //     currentProblem.correctAnswer,
            //     wasCorrect ? 1 : 0,
            //     currentGameStartTime
            // );
            saveResultToDB(
                currentProblem.operationString, // Usar la cadena de la operación
                selectedAnswerInLane,
                currentProblem.correctAnswer,
                wasCorrect ? 1 : 0,
                currentGameStartTime
            );
        } else {
            console.warn("checkCollision: currentGameStartTime es null, no se guardará el resultado de esta operación.");
        }

        setTimeout(() => {
            if (gameRunning) generateProblem();
        }, 700); // Dar tiempo a ver el feedback
    }

    async function saveResultToDB(operation, selected, correct, scoreChange, gameStartTimeParam) { // PARÁMETRO ES gameStartTimeParam
        if (gameStartTimeParam === null) { // USA EL PARÁMETRO
            console.error("saveResultToDB Error: El gameStartTimeParam recibido es null. No se guardará el resultado.");
            return;
        }
        if (typeof operation === 'undefined' || typeof correct === 'undefined' || typeof scoreChange === 'undefined' || typeof currentPlayer === 'undefined' || currentPlayer === '') {
            console.error("saveResultToDB Error: Parámetros inválidos o ausentes.", {operation, selected, correct, scoreChange, currentPlayer, gameStartTimeParam });
           return;
        }
        const currentFallDurationSeconds = parseInt(fallDurationSelect.value); // Ya está en segundos
        const currentGameDurationSeconds = parseInt(gameDurationSelect.value); // Ya está en segundos
        try {
            const response = await fetch('/save_result', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerName: currentPlayer,
                    operation: operation,
                    selectedAnswer: selected,
                    correctAnswer: correct,
                    scoreChange: scoreChange,
                    gameStartTime: gameStartTimeParam,
                    fallDuration: currentFallDurationSeconds,
                    gameDuration: currentGameDurationSeconds
                }),
            });
            if (!response.ok) {
                console.error('Failed to save result:', await response.text());
            }
        } catch (error) {
            console.error('Error saving result:', error);
        }
    }

    function showFeedback(message, isCorrect) {
        feedbackElement.textContent = message;
        feedbackElement.className = 'feedback-message';
        feedbackElement.classList.add(isCorrect ? 'correct' : 'incorrect', 'show');
        setTimeout(() => { feedbackElement.classList.remove('show'); }, 1000);
    }

    function updateTimer() {
        timeLeft--;
        timerDisplay.textContent = timeLeft;
        if (timeLeft <= 0) {
            endGame();
        }
    }

    function startGame() {
        // INICIO DEL CAMBIO en la función startGame
        if (!playerSelect || playerSelect.selectedIndex === -1) { // Verificar que playerSelect exista y tenga una opción
             alert("Por favor, selecciona un jugador.");
            return;
        }
        const selectedOption = playerSelect.options[playerSelect.selectedIndex];
        currentPlayer = selectedOption.value;
        // gameDuration se lee de selectedOption.dataset.time
        // gameDuration = parseInt(selectedOption.dataset.time) || 60;

        gameDuration = parseInt(gameDurationSelect.value) || 60; // En segundos
        fallDuration = (parseInt(fallDurationSelect.value) || 3) * 1000; // Convertir a milisegundos

        if (!currentPlayer) {
            alert("Error al obtener el jugador seleccionado."); // Esta alerta es redundante si la de arriba funciona
            return;
        }

        if (typeof(Storage) !== "undefined") {
            localStorage.setItem('lastMathPlayer', currentPlayer);
        }


        score = 0;
        timeLeft = gameDuration; // CORREGIDO: timeLeft toma el valor de gameDuration
        currentLane = 1;
        gameRunning = true;
        currentGameStartTime = parseFloat((Date.now() / 1000).toFixed(3));

        scoreDisplay.textContent = score;
        timerDisplay.textContent = timeLeft; // Mostrar el tiempo correcto al inicio
        startControls.style.display = 'none';
        if(gameOverMessage) gameOverMessage.style.display = 'none';
        gameContainer.style.display = 'block';
        updateCarPosition(); // Asegurar que el coche esté en posición al inicio
        if (roadElement) roadElement.style.animationPlayState = 'running';
        problemDisplay.textContent = "? x ?";

        if (soundBackground && typeof soundBackground.play === 'function') {
            soundBackground.volume = 0.15;
            soundBackground.currentTime = 0;
            soundBackground.play().catch(e => console.warn("Error al reproducir sonido de fondo:", e));
        }
        timerInterval = setInterval(updateTimer, 1000);
        generateProblem();
        // FIN DEL CAMBIO en la función startGame
    }

    function endGame() {
        gameRunning = false;
        clearInterval(timerInterval);
        clearTimeout(problemTimeout);
        if (soundBackground && typeof soundBackground.pause === 'function') {
            soundBackground.pause();
        }

        const finishedPlayer = currentPlayer;
        const finishedGameStartTime = currentGameStartTime;

        gameContainer.style.display = 'none';
        startControls.style.display = 'block';
        if (roadElement) roadElement.style.animationPlayState = 'paused';
        numbersArea.innerHTML = ''; // Limpiar números que caen
        problemDisplay.textContent = 'Fin';

        if (typeof window.showGameDetailsModal === 'function' && finishedPlayer && finishedGameStartTime !== null) {
            console.log(`Programando mostrar detalles para: ${finishedPlayer}, ${finishedGameStartTime}`);
            setTimeout(() => {
                console.log(`EJECUTANDO mostrar detalles para: ${finishedPlayer}, ${finishedGameStartTime}`);
                window.showGameDetailsModal(finishedPlayer, finishedGameStartTime);
            }, 300); 
            // window.showGameDetailsModal(finishedPlayer, finishedGameStartTime);
        } else {
            console.warn("Función showGameDetailsModal no disponible o datos insuficientes. Mostrando mensaje de fallback.");
            if(gameOverMessage) {
                const finalScoreEl = gameOverMessage.querySelector('#final-score'); // Asegurar que existe el span
                if(finalScoreEl) finalScoreEl.textContent = score; // Usar score de la variable global
                    gameOverMessage.style.display = 'block';
            }
        }
        currentGameStartTime = null; // Resetear para el próximo juego
    }


    // function initializeGamePage() {
    //     updateCarPosition();
    //     if (roadElement) roadElement.style.animationPlayState = 'paused';

    //     if (typeof(Storage) !== "undefined" && playerSelect) {
    //         const lastPlayer = localStorage.getItem('lastMathPlayer');
    //         if (lastPlayer) {
    //             const playerExists = Array.from(playerSelect.options).some(opt => opt.value === lastPlayer);
    //             if (playerExists) {
    //                 playerSelect.value = lastPlayer;
    //             } else if (playerSelect.options.length > 0) {
    //                 playerSelect.selectedIndex = 0; // Default al primero si el guardado no existe
    //             }
    //         } else if (playerSelect.options.length > 0) {
    //             playerSelect.selectedIndex = 0; // Default al primero si no hay nada guardado
    //         }
    //     }

    //     // Actualizar gameDuration y timeLeft basado en el jugador (pre)seleccionado
    //     if (playerSelect && playerSelect.selectedIndex !== -1) {
    //         const selectedOptionOnInit = playerSelect.options[playerSelect.selectedIndex];
    //         if (selectedOptionOnInit && selectedOptionOnInit.dataset.time) { // Verificar que dataset.time exista
    //              gameDuration = parseInt(selectedOptionOnInit.dataset.time) || 60;
    //         } else {
    //             // Si no hay data-time en la opción (ej. si se añade un jugador sin tiempo en HTML)
    //             gameDuration = 60; 
    //         }
    //     } else {
    //          // Si no hay selector o no hay opciones seleccionables (poco probable con el código actual)
    //         gameDuration = 60;
    //     }
    //     timeLeft = gameDuration;
    //     if (timerDisplay) timerDisplay.textContent = timeLeft;
    // }

    function initializeGamePage() {
        updateCarPosition();
        if (roadElement) roadElement.style.animationPlayState = 'paused';

        if (typeof(Storage) !== "undefined") {
            // Preseleccionar jugador
            if (playerSelect) {
                const lastPlayer = localStorage.getItem('lastMathPlayer');
                if (lastPlayer) {
                    const playerExists = Array.from(playerSelect.options).some(opt => opt.value === lastPlayer);
                    if (playerExists) playerSelect.value = lastPlayer;
                    else if (playerSelect.options.length > 0) playerSelect.selectedIndex = 0;
                } else if (playerSelect.options.length > 0) {
                    playerSelect.selectedIndex = 0;
                }
            }

            // INICIO DEL CAMBIO: Preseleccionar duraciones
            if (gameDurationSelect) {
                const lastGameDuration = localStorage.getItem('lastGameDuration');
                if (lastGameDuration) gameDurationSelect.value = lastGameDuration;
                // Actualizar la variable gameDuration global basada en la selección
                gameDuration = parseInt(gameDurationSelect.value) || 60;
            } else {
                gameDuration = 60; // Default si el selector no existe
            }

            if (fallDurationSelect) {
                const lastFallDuration = localStorage.getItem('lastFallDuration');
                if (lastFallDuration) fallDurationSelect.value = lastFallDuration;
                // Actualizar la variable fallDuration global basada en la selección
                fallDuration = (parseInt(fallDurationSelect.value) || 3) * 1000;
            } else {
                fallDuration = 3000; // Default si el selector no existe
            }
            // FIN DEL CAMBIO
        } else {
            // Defaults si localStorage no está disponible
            gameDuration = parseInt(gameDurationSelect?.value) || 60;
            fallDuration = (parseInt(fallDurationSelect?.value) || 3) * 1000;
        }

        timeLeft = gameDuration;
        if (timerDisplay) timerDisplay.textContent = timeLeft;
    }

    // --- Event Listeners ---
    startButton.addEventListener('click', startGame);

    document.addEventListener('keydown', (event) => {
        if (!gameRunning) return;

        if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
            moveCar('left');
        } else if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
            moveCar('right');
        }
    });

    // --- Utilidades ---
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    initializeGamePage(); 
});
