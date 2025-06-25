import sqlite3
import json
import random
import time
from flask import Flask, render_template, request, jsonify, g, url_for

DATABASE = 'database.db'
PLAYER_NAMES = ["Visitante 1", "Visitante 2", "Visitante 3", "Visitante 4", "Visitante 5"]
PLAYERS_CONFIG = [
    {"name": "Visitante 1", "time_seconds": 60},
    {"name": "Visitante 2", "time_seconds": 45},
    {"name": "Visitante 3", "time_seconds": 90},
    {"name": "Visitante 4", "time_seconds": 75},
    {"name": "Visitante 5", "time_seconds": 30} # Ejemplo de un jugador con menos tiempo
]

app = Flask(__name__)
app.config['SECRET_KEY'] = 'una_clave_secreta_muy_segura' # Cambia esto en producción

# --- Database Handling ---
def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row # Para acceder a las columnas por nombre
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    with app.app_context():
        db = get_db()
        with app.open_resource('schema.sql', mode='r') as f:
            db.cursor().executescript(f.read())
        db.commit()
        print("Initialized the database.")

def query_db(query, args=(), one=False):
    cur = get_db().execute(query, args)
    rv = cur.fetchall()
    cur.close()
    return (rv[0] if rv else None) if one else rv

def insert_db(query, args=()):
    db = get_db()
    cur = db.cursor()
    cur.execute(query, args)
    db.commit()
    last_id = cur.lastrowid
    cur.close()
    return last_id

# --- Routes ---
@app.route('/')
def index():
    """Renderiza la página principal del juego."""
    # return render_template('index.html', players=PLAYER_NAMES)
    return render_template('index.html', players_config=PLAYERS_CONFIG)

@app.route('/stats')
def stats_page():
    """Renderiza la página de estadísticas."""
    # return render_template('stats.html')
    return render_template('stats.html', players_config=PLAYERS_CONFIG)

@app.route('/get_stats', methods=['GET'])
def get_stats():
    """Obtiene todos los resultados de la base de datos."""
    try:
        query = """
            SELECT
                player_name,
                game_start_timestamp,
                COUNT(id) as total_operations,
                SUM(score_change) as correct_operations,
                -- Tomamos el MAX porque esperamos que sea el mismo para todas las operaciones de un juego
                -- Si pudiera variar, necesitarías una lógica diferente o una tabla separada para la configuración del juego.
                MAX(fall_duration_seconds) as fall_duration, 
                MAX(game_duration_seconds) as game_duration
            FROM results
            WHERE game_start_timestamp IS NOT NULL
            GROUP BY player_name, game_start_timestamp
            ORDER BY game_start_timestamp DESC;
        """
        results = query_db(query)
        results_list = [dict(row) for row in results]
        return jsonify(results_list)
    except Exception as e:
        print(f"Error fetching stats: {e}")
        return jsonify({"error": "Could not fetch statistics"}), 500

@app.route('/get_game_details/<player_name>/<float:start_timestamp>', methods=['GET'])
def get_game_details(player_name, start_timestamp):
    """Obtiene todas las operaciones de una sesión de juego específica y la configuración del juego."""
    try:
        print(f"Buscando detalles para: Jugador='{player_name}', Timestamp={start_timestamp} (tipo: {type(start_timestamp)})")
        epsilon = 0.0001
        query = """
            SELECT id, operation, selected_answer, correct_answer, score_change, timestamp,
                   fall_duration_seconds, game_duration_seconds  -- <<< AÑADIR ESTAS COLUMNAS
            FROM results
            WHERE player_name = ? AND game_start_timestamp BETWEEN ? AND ?
            ORDER BY timestamp ASC;
        """
        results_rows = query_db(query, [player_name, start_timestamp - epsilon, start_timestamp + epsilon])

        if results_rows:
            operations_list = [dict(row) for row in results_rows]
            
            # Tomar la configuración del juego de la primera operación (asumimos que es constante)
            game_config = {
                "fall_duration": operations_list[0]['fall_duration_seconds'] if operations_list else None,
                "game_duration": operations_list[0]['game_duration_seconds'] if operations_list else None
            }
            
            # Devolver un objeto que contenga tanto las operaciones como la configuración
            return jsonify({
                "operations": operations_list,
                "game_config": game_config 
            })
        else:
            return jsonify({"error": "Game session not found or no operations recorded"}), 404
    except Exception as e:
        print(f"Error REAL al obtener detalles del juego para {player_name} en {start_timestamp}: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Could not fetch game details"}), 500

@app.route('/save_result', methods=['POST'])
def save_result():
    """Guarda el resultado de una operación en la BD."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid data"}), 400

    player_name = data.get('playerName')
    operation = data.get('operation')
    selected_answer = data.get('selectedAnswer')
    correct_answer = data.get('correctAnswer')
    score_change = data.get('scoreChange') # 1 for correct, 0 for incorrect
    game_start_timestamp = data.get('gameStartTime')
    fall_duration = data.get('fallDuration') # En segundos
    game_duration = data.get('gameDuration') # En segundos

    if None in [player_name, operation, selected_answer, correct_answer, score_change, game_start_timestamp, fall_duration, game_duration]:
         return jsonify({"error": "Missing data fields"}), 400
    if not isinstance(game_start_timestamp, (int, float)):
        return jsonify({"error": "Invalid gameStartTime format"}), 400
    if not isinstance(fall_duration, int) or not (2 <= fall_duration <= 10): # Validar rango
        return jsonify({"error": "Invalid fallDuration"}), 400
    if not isinstance(game_duration, int) or game_duration not in [30, 40, 50, 60]: # Validar opciones
        return jsonify({"error": "Invalid gameDuration"}), 400

    # ... (inserción en BD sin cambios en la lógica, pero asegúrate que `game_start_timestamp` se inserte) ...
    # try:
    #     insert_db(
    #         'INSERT INTO results (player_name, timestamp, operation, selected_answer, correct_answer, score_change, game_start_timestamp, fall_duration_seconds, game_duration_seconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    #         [player_name, time.time(), operation, selected_answer, correct_answer, score_change, game_start_timestamp, fall_duration, game_duration]
    #     )
    #     return jsonify({"success": True}), 201
    # except Exception as e:
    #     print(f"Error saving result: {e}")
    #     return jsonify({"error": "Could not save result"}), 500
    
    try:
        # Para depurar, imprime los datos que estás a punto de insertar
        print(f"Intentando guardar: Player={player_name}, Op={operation}, SelAns={selected_answer}, CorrAns={correct_answer}, ScoreChg={score_change}, StartTime={game_start_timestamp}, FallDur={fall_duration}, GameDur={game_duration}")
        print(f"Tipos: Player={type(player_name)}, Op={type(operation)}, SelAns={type(selected_answer)}, CorrAns={type(correct_answer)}, ScoreChg={type(score_change)}, StartTime={type(game_start_timestamp)}, FallDur={type(fall_duration)}, GameDur={type(game_duration)}")

        insert_db(
            'INSERT INTO results (player_name, timestamp, operation, selected_answer, correct_answer, score_change, game_start_timestamp, fall_duration_seconds, game_duration_seconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [player_name, time.time(), operation, selected_answer, correct_answer, score_change, game_start_timestamp, fall_duration, game_duration]
        )
        return jsonify({"success": True}), 201
    except Exception as e:
        # ¡ESTO ES IMPORTANTE! Imprime el error real de Python en la consola del servidor
        print(f"Error REAL al guardar resultado: {e}")
        import traceback
        traceback.print_exc() # Imprime el traceback completo
        return jsonify({"error": "Could not save result"}), 500

# --- Utility to create DB if it doesn't exist ---
def setup_database():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_name TEXT NOT NULL,
        timestamp REAL NOT NULL,
        operation TEXT NOT NULL,
        selected_answer INTEGER NOT NULL,
        correct_answer INTEGER NOT NULL,
        score_change INTEGER NOT NULL,
        game_start_timestamp REAL NOT NULL,
        fall_duration_seconds INTEGER,
        game_duration_seconds INTEGER
    );
    """)
    conn.commit()
    conn.close()
    print("Database checked/created.")

if __name__ == '__main__':
    setup_database() # Asegúrate que la tabla exista al iniciar
    # init_db() # Descomenta esto si usas schema.sql por primera vez
    app.run(debug=True) # debug=True para desarrollo, cambia a False para producción