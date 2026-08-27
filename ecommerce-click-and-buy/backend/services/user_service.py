import hashlib
from database import db
from models.user import User

class UserService:
    @staticmethod
    def hash_password(password):
        return hashlib.sha256(password.encode()).hexdigest()

    @staticmethod
    def create_user(name, email, password):
        try:
            hashed_pw = UserService.hash_password(password)
            user = User(name=name, email=email, password_hash=hashed_pw)
            db.session.add(user)
            db.session.commit()
            return user.to_dict()
        except Exception:
            db.session.rollback()
            return None

    @staticmethod
    def authenticate_user(email, password):
        hashed_pw = UserService.hash_password(password)
        user = User.query.filter_by(email=email, password_hash=hashed_pw).first()
        if user:
            return user.to_dict()
        return None

    @staticmethod
    def get_user_by_id(user_id):
        user = db.session.get(User, user_id)
        if user:
            return user.to_dict()
        return None
