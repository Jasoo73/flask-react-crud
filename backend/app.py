from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import (
    JWTManager, create_access_token,
    jwt_required, get_jwt_identity
)
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

app.config['JWT_SECRET_KEY'] = 'tu_clave_super_segura'
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:sofia123@localhost:5432/Peliculas'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
jwt = JWTManager(app)

# Modelos
class Usuario(db.Model):
    __tablename__ = 'Usuario'
    id = db.Column('id_usuario', db.Integer, primary_key=True)
    username = db.Column('nombre_usuario', db.String(80), unique=True, nullable=False)
    contrasena = db.Column('contrasena', db.String(255), nullable=False)  # Aquí especifica el nombre real en BD
    email = db.Column('email', db.String(255), unique=True, nullable=True)
    resenas = db.relationship('Resena', backref='usuario', lazy=True)    # Cambié 'reseñas' por 'resenas' para evitar problemas con la ñ

    def set_password(self, password):
        self.contrasena = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.contrasena, password)

class Pelicula(db.Model):
    __tablename__ = 'Pelicula'
    id = db.Column('id_pelicula', db.Integer, primary_key=True)
    title = db.Column('titulo', db.String(150), nullable=False)
    year = db.Column('año_lanzamiento', db.Integer)
    metascore = db.Column('metascore', db.Integer)
    userscore = db.Column('userscore', db.Integer)
    resenas = db.relationship('Resena', backref='pelicula', lazy=True)      # Igual, 'resenas'

class Resena(db.Model):
    __tablename__ = 'Resena'
    id = db.Column('id_resena', db.Integer, primary_key=True)
    comment = db.Column('comentario', db.Text, nullable=False)
    puntuacion = db.Column('puntuacion', db.Integer)
    created_at = db.Column('fecha', db.DateTime, default=datetime.utcnow)
    user_id = db.Column('id_usuario', db.Integer, db.ForeignKey('Usuario.id_usuario'), nullable=False)
    movie_id = db.Column('id_pelicula', db.Integer, db.ForeignKey('Pelicula.id_pelicula'), nullable=False)

# Ruta raíz para evitar 404
@app.route('/')
def index():
    return "API Flask funcionando"

# Registro
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')

    if not username or not password:
        return jsonify({"msg": "Faltan datos"}), 400

    if Usuario.query.filter_by(username=username).first():
        return jsonify({"msg": "Usuario ya existe"}), 400

    user = Usuario(username=username, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify({"msg": "Usuario creado"}), 201

# Login
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"msg": "Faltan datos"}), 400

    user = Usuario.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({"msg": "Usuario o contraseña incorrectos"}), 401

    access_token = create_access_token(identity=username)
    return jsonify(access_token=access_token), 200

# Crear reseña (protegido)
@app.route('/api/reviews', methods=['POST'])
@jwt_required()
def create_review():
    user_identity = get_jwt_identity()
    user = Usuario.query.filter_by(username=user_identity).first()

    data = request.get_json()
    movie_id = data.get('movie_id')
    comment = data.get('comment')
    puntuacion = data.get('puntuacion')

    if not all([movie_id, comment, puntuacion]):
        return jsonify({"msg": "Faltan datos"}), 400

    movie = Pelicula.query.get(movie_id)
    if not movie:
        return jsonify({"msg": "Película no encontrada"}), 404

    review = Resena(user_id=user.id, movie_id=movie_id, comment=comment, puntuacion=puntuacion)
    db.session.add(review)
    db.session.commit()

    return jsonify({"msg": "Reseña creada"}), 201

# Obtener reseñas de película
@app.route('/api/reviews/movie/<int:movie_id>', methods=['GET'])
def get_reviews_by_movie(movie_id):
    reviews = Resena.query.filter_by(movie_id=movie_id).all()
    return jsonify([{
        "id": r.id,
        "user": r.usuario.username,
        "comment": r.comment,
        "puntuacion": r.puntuacion,
        "created_at": r.created_at.isoformat()
    } for r in reviews])

# Listar películas
@app.route('/api/movies', methods=['GET'])
def get_movies():
    movies = Pelicula.query.all()
    return jsonify([
        {
            "id": m.id,
            "title": m.title,
            "year": m.year,
            "metascore": m.metascore,
            "userscore": m.userscore
        } for m in movies
    ])


# Crear película (protegido)
@app.route('/api/movies', methods=['POST'])
@jwt_required()
def create_movie():
    data = request.get_json()
    title = data.get('title')
    year = data.get('year')
    metascore = data.get('metascore', 0)
    userscore = data.get('userscore', 0)

    if not title:
        return jsonify({"msg": "Falta título"}), 400

    movie = Pelicula(title=title, year=year, metascore=metascore, userscore=userscore)
    db.session.add(movie)
    db.session.commit()
    return jsonify({"msg": "Película creada"}), 201

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
