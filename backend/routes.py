from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .models import User, Movie, Review
from . import db

main = Blueprint('main', __name__)

@main.route('/api/reviews', methods=['POST'])
@jwt_required()
def create_review():
    user_identity = get_jwt_identity()
    user = User.query.filter_by(username=user_identity).first()

    data = request.get_json()
    movie_id = data.get('movie_id')
    comment = data.get('comment')
    score = data.get('score')

    if not all([movie_id, comment, score]):
        return jsonify({"msg": "Faltan datos"}), 400

    movie = Movie.query.get(movie_id)
    if not movie:
        return jsonify({"msg": "Película no encontrada"}), 404

    review = Review(user_id=user.id, movie_id=movie_id, comment=comment, score=score)
    db.session.add(review)
    db.session.commit()

    return jsonify({"msg": "Reseña creada"}), 201

@main.route('/api/reviews/movie/<int:movie_id>', methods=['GET'])
def get_reviews_by_movie(movie_id):
    reviews = Review.query.filter_by(movie_id=movie_id).all()
    return jsonify([{
        "id": r.id,
        "user": r.user.username,
        "comment": r.comment,
        "score": r.score,
        "created_at": r.created_at.isoformat()
    } for r in reviews])
