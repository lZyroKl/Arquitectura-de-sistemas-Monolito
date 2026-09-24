import hashlib
import hmac

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from werkzeug.security import generate_password_hash, check_password_hash

from database import db
from models.user import User

class UserService:
    @staticmethod
    def hash_password(password):
        return generate_password_hash(password)

    @staticmethod
    def _is_legacy_hash(password_hash):
        # Las primeras cuentas se guardaron como SHA-256 sin sal (64 caracteres hex)
        return len(password_hash) == 64 and "$" not in password_hash

    @staticmethod
    def verify_password(password_hash, password):
        if UserService._is_legacy_hash(password_hash):
            legacy = hashlib.sha256(password.encode()).hexdigest()
            return hmac.compare_digest(legacy, password_hash)
        return check_password_hash(password_hash, password)

    @staticmethod
    def _find_by_email(email):
        return User.query.filter(func.lower(User.email) == email.strip().lower()).first()

    @staticmethod
    def create_user(name, email, password):
        email = email.strip().lower()
        if UserService._find_by_email(email):
            return None
        try:
            user = User(name=name.strip(), email=email, password_hash=UserService.hash_password(password))
            db.session.add(user)
            db.session.commit()
            return user.to_dict()
        except IntegrityError:
            db.session.rollback()
            return None

    @staticmethod
    def authenticate_user(email, password):
        user = UserService._find_by_email(email)
        if not user or not UserService.verify_password(user.password_hash, password):
            return None

        # Re-hashea las contraseñas antiguas al iniciar sesión
        if UserService._is_legacy_hash(user.password_hash):
            user.password_hash = UserService.hash_password(password)
            db.session.commit()
        return user.to_dict()

    @staticmethod
    def get_user_by_id(user_id):
        user = db.session.get(User, user_id)
        if user:
            return user.to_dict()
        return None
