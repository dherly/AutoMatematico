let gameDetailsModalInstance = null;
/**
 * Función simple para escapar caracteres HTML especiales y prevenir XSS básico.
 * @param {string} unsafe - Texto potencialmente inseguro.
 * @returns {string} - Texto seguro para insertar en HTML.
 */
function escapeHtml(unsafe) { // <-- ESTA ES LA VERSIÓN CORRECTA
    if (unsafe === null || unsafe === undefined) return '';
    return unsafe
         .toString()
         .replace(/&/g, "&")
         .replace(/</g, "<")
         .replace(/>/g, ">")
         .replace(/"/g, "\\\"")
         .replace(/'/g, "'");
}

document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos del DOM ---
    const statsTableBody = document.getElementById('stats-table-body'); // Cuerpo de la tabla principal
    const detailsModalElement = document.getElementById('detailsModal'); // Elemento del Modal (para inicializar Bootstrap)

    // Elementos DENTRO del Modal para mostrar detalles (asegúrate que existan en stats.html)
    const modalPlayerName = document.getElementById('modal-player-name'); // Necesitarás añadir este ID en stats.html
    const modalStartTime = document.getElementById('modal-start-time');   // Necesitarás añadir este ID en stats.html
    const modalOperationsDetails = document.getElementById('modal-operations-details'); // Necesitarás añadir este ID en stats.html
    const modalTitle = document.getElementById('detailsModalLabel'); // Título del modal
    // const modalGameDuration = document.getElementById('modal-game-duration');
    // const modalFallDuration = document.getElementById('modal-fall-duration'); // NUEVO: para duración de caída
    const soundSummary = document.getElementById('sound-summary'); // Busca el <audio>

    const modalPlayerNameElem = document.getElementById('modal-player-name');
    const modalStartTimeElem = document.getElementById('modal-start-time');
    const modalGameDurationElem = document.getElementById('modal-game-duration');
    const modalFallDurationElem = document.getElementById('modal-fall-duration');
    const modalOperationsDetailsElem = document.getElementById('modal-operations-details');

    if (detailsModalElement) {
        try {
            gameDetailsModalInstance = new bootstrap.Modal(detailsModalElement); // <--- USA LA VARIABLE GLOBAL
            console.log("Instancia del modal (gameDetailsModalInstance) creada.");
        } catch (e) {
            console.error("Error al inicializar el modal de Bootstrap:", e);
        }
    } else {
        console.warn("El elemento del DOM para el modal (ID: 'detailsModal') no fue encontrado.");
    }
    // --- Funciones ---

    /**
     * Busca el resumen de juegos del backend y los muestra en la tabla principal.
     */
    async function fetchAndDisplayStatsSummary() {
        if (!statsTableBody) return; // Solo para la página de stats

        try {
            const response = await fetch('/get_stats');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const gameSummaries = await response.json();
            renderSummaryTable(gameSummaries);
        } catch (error) {
            console.error("Error fetching game summaries:", error);
            if (statsTableBody) statsTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Error al cargar resumen de juegos.</td></tr>`;
        }
    }

    /**
     * Dibuja la tabla principal con el resumen de cada juego.
     * @param {Array} summaries - Array de objetos, cada uno resumiendo un juego.
     */
    function renderSummaryTable(summaries) {
        if (!statsTableBody) return;
        statsTableBody.innerHTML = '';

        if (!summaries || summaries.length === 0) {
            statsTableBody.innerHTML = `<tr><td colspan="5" class="text-center">No hay juegos guardados todavía.</td></tr>`;
            return;
        }

        summaries.forEach(summary => {
            const row = document.createElement('tr');
            const startTime = new Date(summary.game_start_timestamp * 1000);
            const formattedStartTime = startTime.toLocaleString('es-ES', {
                 year: 'numeric', month: '2-digit', day: '2-digit',
                 hour: '2-digit', minute: '2-digit' });

            row.innerHTML = `
                <td>${escapeHtml(summary.player_name)}</td>
                <td>${formattedStartTime}</td>
                <td>${summary.correct_operations}</td>
                <td>${summary.total_operations}</td>
                <td>
                    <button class="btn btn-sm btn-info details-btn"
                            data-player="${escapeHtml(summary.player_name)}"
                            data-timestamp="${summary.game_start_timestamp}">
                        Ver Juego
                    </button>
                </td>
            `;
            statsTableBody.appendChild(row);
        });

        document.querySelectorAll('.details-btn').forEach(button => {
            button.addEventListener('click', () => {
                const playerName = button.dataset.player;
                const startTimestamp = parseFloat(button.dataset.timestamp); // Convertir a número
                // Llamar a la función global para mostrar el modal
                if (typeof window.showGameDetailsModal === 'function') {
                    window.showGameDetailsModal(playerName, startTimestamp);
                } else {
                    console.error("Función showGameDetailsModal no encontrada en window.");
                }
            });
        });
    }

    /**
     * Función GLOBAL para buscar y mostrar los detalles de un juego en el modal.
     * game.js llamará a esta función.
     * @param {string} playerName
     * @param {number} startTimestamp (en segundos)
     */
    // window.showGameDetailsModal = async function(playerName, startTimestamp) {
    //     if (!activeDetailsModalInstance) { // Verificar la instancia que inicializamos arriba
    //         console.error("La instancia del modal de Bootstrap (activeDetailsModalInstance) no está disponible. No se puede mostrar el modal.");
    //         return;
    //     }
    //     if (!detailsModalInstance) {
    //         const modalElement = document.getElementById(detailsModalElementId);
    //         if (modalElement) {
    //             detailsModalInstance = new bootstrap.Modal(modalElement);
    //             console.log("Modal de Bootstrap inicializado en showGameDetailsModal.");
    //         } else {
    //             console.error(`El elemento del modal con ID '${detailsModalElementId}' no se encontró. No se puede mostrar el modal.`);
    //             return; // Salir si no se puede encontrar el elemento del modal
    //         }
    //     }

    //     if (!detailsModalInstance) { // Doble verificación por si la inicialización falló silenciosamente (poco probable)
    //         console.error("El modal de Bootstrap (detailsModalInstance) sigue sin estar inicializado después del intento.");
    //         return;
    //     }

    //     if (!playerName || typeof startTimestamp === 'undefined' || startTimestamp === null) {
    //         console.error("Faltan datos (jugador o timestamp) para mostrar detalles del juego.");
    //         if(modalTitle) modalTitle.textContent = "Error de Datos";
    //         if(modalPlayerName) modalPlayerName.textContent = "-";
    //         if(modalStartTime) modalStartTime.textContent = "-";
    //         if(modalOperationsDetails) modalOperationsDetails.innerHTML = '<p class="text-center text-danger">No se pueden cargar los detalles: faltan datos del juego.</p>';
    //         detailsModalInstance.show();
    //         return;
    //     }

    //     const startTimeObj = new Date(startTimestamp * 1000);
    //     const formattedStartTime = startTimeObj.toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short'});

    //     if(modalTitle) modalTitle.textContent = `Detalles del Juego - ${escapeHtml(playerName)}`;
    //     if(modalPlayerName) modalPlayerName.textContent = escapeHtml(playerName);
    //     if(modalStartTime) modalStartTime.textContent = formattedStartTime;
    //     if(modalOperationsDetails) modalOperationsDetails.innerHTML = '<p class="text-center">Cargando detalles...</p>';

    //     detailsModalInstance.show(); // Muestra el modal

    //     if (soundSummary && typeof soundSummary.play === 'function') {
    //         soundSummary.currentTime = 0;
    //         soundSummary.play().catch(e => console.warn("Error al reproducir sonido de resumen:", e));
    //     }

    //     try {
    //         const detailUrl = `/get_game_details/${encodeURIComponent(playerName)}/${startTimestamp}`;
    //         const response = await fetch(detailUrl);

    //         if (!response.ok) {
    //              let errorMsg = `HTTP error! status: ${response.status}`;
    //              try {
    //                  const errorData = await response.json();
    //                  errorMsg = errorData.error || errorMsg;
    //              } catch (e) { /* Ignora si la respuesta no es JSON */ }
    //              throw new Error(errorMsg);
    //         }
    //         const operations = await response.json();
    //         renderOperationDetailsInModal(operations); // Llama a la función auxiliar interna
    //     } catch (error) {
    //         console.error("Error fetching game details:", error);
    //         if (modalOperationsDetails) {
    //             modalOperationsDetails.innerHTML = `<p class="text-center text-danger">Error al cargar detalles: ${error.message}</p>`;
    //         }
    //     }
    //     // detailsModalInstance.show();
    // };

    window.showGameDetailsModal = async function(playerName, startTimestamp) {
        if (!gameDetailsModalInstance) { 
            console.error("La instancia del modal (gameDetailsModalInstance) no está disponible.");
            // Intento de recuperación si la página es stats.html y se cargó después
            const modalElem = document.getElementById('detailsModal');
            if (modalElem) {
                try {
                    gameDetailsModalInstance = new bootstrap.Modal(modalElem);
                    console.log("Modal reinicializado en showGameDetailsModal.");
                } catch(e) {
                     console.error("Fallo al reinicializar modal en showGameDetailsModal:", e);
                     return;
                }
            } else {
                return; // No se puede mostrar
            }
        }

        const currentModalTitle = document.getElementById('detailsModalLabel'); // Usar nombres locales para evitar conflictos
        const currentPlayerNameElem = document.getElementById('modal-player-name');
        const currentStartTimeElem = document.getElementById('modal-start-time');
        const currentGameDurationElem = document.getElementById('modal-game-duration'); // <--- Variable que causaba el error
        const currentFallDurationElem = document.getElementById('modal-fall-duration');
        const currentOperationsDetailsElem = document.getElementById('modal-operations-details');
        const currentSoundSummary = document.getElementById('sound-summary');

        if(currentModalTitle) currentModalTitle.textContent = "Detalles del Juego";
        if(currentPlayerNameElem) currentPlayerNameElem.textContent = "-";
        if(currentStartTimeElem) currentStartTimeElem.textContent = "-";
        // La línea 217 que daba error era probablemente una de estas:
        if(currentGameDurationElem) currentGameDurationElem.textContent = "Cargando..."; // <--- Usa la variable local
        if(currentFallDurationElem) currentFallDurationElem.textContent = "Cargando..."; // <--- Usa la variable local
        if(currentOperationsDetailsElem) currentOperationsDetailsElem.innerHTML = '<p class="text-center">Cargando detalles...</p>';

        // Limpiar y preparar el modal
        // if(modalTitle) modalTitle.textContent = "Detalles del Juego";
        // if(modalPlayerNameElem) modalPlayerNameElem.textContent = "-";
        // if(modalPlayerName) modalPlayerName.textContent = "-";
        // if(modalStartTime) modalStartTime.textContent = "-";
        // if(modalGameDuration) modalGameDuration.textContent = "Cargando..."; // Limpiar campo
        // if(modalFallDuration) modalFallDuration.textContent = "Cargando..."; // Limpiar campo
        // if(modalOperationsDetails) modalOperationsDetails.innerHTML = '<p class="text-center">Cargando detalles...</p>';

        // // ... (resto de la preparación como la tenías)
        // if(modalGameDurationElem) modalGameDurationElem.textContent = "Cargando...";
        // if(modalFallDurationElem) modalFallDurationElem.textContent = "Cargando...";
        // if(modalOperationsDetailsElem) modalOperationsDetailsElem.innerHTML = '<p class="text-center">Cargando detalles...</p>';
        
        if (!playerName || typeof startTimestamp === 'undefined' || startTimestamp === null) {
            console.error("Faltan datos (jugador o timestamp) para mostrar detalles del juego.");
            if(modalTitle) modalTitle.textContent = "Error de Datos";
            if(modalOperationsDetails) modalOperationsDetails.innerHTML = '<p class="text-center text-danger">No se pueden cargar los detalles: faltan datos del juego.</p>';
            // Los campos de duración ya están en "Cargando..." o podrían ponerse en "Error"
            if(modalGameDuration) modalGameDuration.textContent = "Error";
            if(modalFallDuration) modalFallDuration.textContent = "Error";
            gameDetailsModalInstance.show();
            return;
        }

        const startTimeObj = new Date(startTimestamp * 1000);
        const formattedStartTime = startTimeObj.toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short'});

        // if(modalTitle) modalTitle.textContent = `Detalles del Juego - ${escapeHtml(playerName)}`;
        // if(modalPlayerName) modalPlayerName.textContent = escapeHtml(playerName);
        // if(modalStartTime) modalStartTime.textContent = formattedStartTime;
        if(modalTitle) modalTitle.textContent = `Detalles del Juego - ${escapeHtml(playerName)}`; // Usa escapeHtml global
        if(modalPlayerNameElem) modalPlayerNameElem.textContent = escapeHtml(playerName);    // Usa escapeHtml global
        if(modalStartTimeElem) modalStartTimeElem.textContent = formattedStartTime;

        gameDetailsModalInstance.show();

        if (soundSummary && typeof soundSummary.play === 'function') {
            soundSummary.currentTime = 0;
            soundSummary.play().catch(e => console.warn("Error al reproducir sonido de resumen:", e));
        }

        try {
            const detailUrl = `/get_game_details/${encodeURIComponent(playerName)}/${startTimestamp}`;
            const response = await fetch(detailUrl);

            if (!response.ok) {
                 let errorMsg = `HTTP error! status: ${response.status}`;
                 try { const errorData = await response.json(); errorMsg = errorData.error || errorMsg; }
                 catch (e) { /* Ignora si la respuesta no es JSON */ }
                 throw new Error(errorMsg);
            }
            
            const responseData = await response.json();  // responseData es el objeto {operations: [...], game_config: {...}}
            const operationsArray = responseData.operations; // ESTE ES EL ARRAY que necesitamos
            const gameConfig = responseData.game_config;     // Objeto con configuraciones

            // Actualizar los spans de duración del juego y caída
            // if(modalGameDuration) {
            //     modalGameDuration.textContent = gameConfig && gameConfig.game_duration !== null ? escapeHtml(gameConfig.game_duration.toString()) : "-";
            // }
            // if(modalFallDuration) {
            //     modalFallDuration.textContent = gameConfig && gameConfig.fall_duration !== null ? escapeHtml(gameConfig.fall_duration.toString()) : "-";
            // }

            if(modalGameDurationElem) {
                modalGameDurationElem.textContent = gameConfig && gameConfig.game_duration !== null ? escapeHtml(gameConfig.game_duration.toString()) : "-";
            }
            if(modalFallDurationElem) {
                modalFallDurationElem.textContent = gameConfig && gameConfig.fall_duration !== null ? escapeHtml(gameConfig.fall_duration.toString()) : "-";
            }

            function _renderOperationsInModal(operations) { // Le pongo _ para diferenciar si ya tienes una global
                if (!modalOperationsDetailsElem) return;
                if (!Array.isArray(operations) || operations.length === 0) {
                    modalOperationsDetailsElem.innerHTML = '<p class="text-center">No hay operaciones.</p>'; return;
                }
                let detailsHtml = `<div class="table-responsive"><table class="table table-sm table-bordered table-hover">`;
                detailsHtml += `<thead><tr><th>#</th><th>Operación</th><th>Seleccionado</th><th>Correcto</th><th>Resultado</th></tr></thead><tbody>`;
                operations.forEach((op, index) => {
                    const isCorrect = op.score_change === 1;
                    const resultText = isCorrect ? '✔️ Correcto' : '❌ Incorrecto';
                    const rowClass = isCorrect ? 'table-success' : 'table-danger';
                    const selectedAnswerDisplay = op.selected_answer === -1 ? 'N/A' : escapeHtml(op.selected_answer.toString());
                    detailsHtml += `<tr class="${rowClass}">
                                    <td>${index + 1}</td>
                                    <td>${escapeHtml(op.operation)}</td>
                                    <td>${selectedAnswerDisplay}</td>
                                    <td>${escapeHtml(op.correct_answer.toString())}</td>
                                    <td>${resultText}</td></tr>`;
                });
                detailsHtml += '</tbody></table></div>';
                modalOperationsDetailsElem.innerHTML = detailsHtml;
            }
            _renderOperationsInModal(operationsArray);
    
            // renderOperationDetailsInModal(operationsArray); 

        } catch (error) {
            console.error("Error fetching game details:", error);
            if (modalOperationsDetails) {
                modalOperationsDetails.innerHTML = `<p class="text-center text-danger">Error al cargar detalles: ${error.message}</p>`;
            }
            if(modalGameDuration) modalGameDuration.textContent = "Error";
            if(modalFallDuration) modalFallDuration.textContent = "Error";
        }
    };

    // Función auxiliar para renderizar las operaciones DENTRO del modal
    // function renderOperationDetailsInModal(operations) {
    //     if (!modalOperationsDetails) {
    //         console.error("El elemento 'modal-operations-details' no se encontró en el DOM.");
    //         return;
    //     }

    //     if (!operations || operations.length === 0) {
    //         modalOperationsDetails.innerHTML = '<p class="text-center">No se encontraron operaciones para este juego.</p>';
    //         return;
    //     }

    //     let detailsHtml = `<div class="table-responsive">
    //                        <table class="table table-sm table-bordered table-hover">`;
    //     detailsHtml += `<thead><tr>
    //                     <th scope="col">#</th>
    //                     <th scope="col">Operación</th>
    //                     <th scope="col">Seleccionado</th>
    //                     <th scope="col">Correcto</th>
    //                     <th scope="col">Resultado</th>
    //                    </tr></thead><tbody>`;

    //     operations.forEach((op, index) => {
    //         const isCorrect = op.score_change === 1;
    //         const resultText = isCorrect ? '✔️ Correcto' : '❌ Incorrecto';
    //         const rowClass = isCorrect ? 'table-success' : 'table-danger';

    //         detailsHtml += `<tr class="${rowClass}">
    //                         <td>${index + 1}</td>
    //                         <td>${escapeHtml(op.operation)}</td>
    //                         <td>${op.selected_answer}</td>
    //                         <td>${op.correct_answer}</td>
    //                         <td>${resultText}</td>
    //                        </tr>`;
    //     });
    //     detailsHtml += '</tbody></table></div>';
    //     modalOperationsDetails.innerHTML = detailsHtml;
    // }

    function renderOperationDetailsInModal(operations) { // 'operations' aquí DEBE ser un array
        if (!modalOperationsDetails) {
            console.error("El elemento 'modal-operations-details' no se encontró en el DOM.");
            return;
        }

        // Comprobar si 'operations' es realmente un array y tiene elementos
        if (!Array.isArray(operations) || operations.length === 0) {
            modalOperationsDetails.innerHTML = '<p class="text-center">No se encontraron operaciones para este juego o los datos son incorrectos.</p>';
            return;
        }

        let detailsHtml = `<div class="table-responsive">
                           <table class="table table-sm table-bordered table-hover">`;
        detailsHtml += `<thead><tr>
                        <th scope="col">#</th>
                        <th scope="col">Operación</th>
                        <th scope="col">Seleccionado</th>
                        <th scope="col">Correcto</th>
                        <th scope="col">Resultado</th>
                       </tr></thead><tbody>`;

        operations.forEach((op, index) => {
            const isCorrect = op.score_change === 1;
            const resultText = isCorrect ? '✔️ Correcto' : '❌ Incorrecto';
            const rowClass = isCorrect ? 'table-success' : 'table-danger';
            
            const selectedAnswerDisplay = op.selected_answer === -1 ? 'N/A' : escapeHtml(op.selected_answer.toString());
            
            detailsHtml += `<tr class="${rowClass}">
                            <td>${index + 1}</td>
                            <td>${escapeHtml(op.operation)}</td>
                            <td>${selectedAnswerDisplay}</td>
                            <td>${escapeHtml(op.correct_answer.toString())}</td>
                            <td>${resultText}</td>
                           </tr>`;
        });
        detailsHtml += '</tbody></table></div>';
        modalOperationsDetails.innerHTML = detailsHtml;
    }

    

    // --- Ejecución Inicial ---
    // Llama a la función principal para cargar el resumen de juegos al cargar la página
    fetchAndDisplayStatsSummary();
});
