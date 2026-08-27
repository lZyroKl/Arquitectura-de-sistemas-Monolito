from models.product import Product

class ProductService:
    @staticmethod
    def get_all_products(brand=None, category=None, min_price=None, max_price=None, search=None):
        query = Product.query

        if brand:
            query = query.filter(Product.brand == brand)
        if category:
            query = query.filter(Product.category == category)
        if min_price:
            query = query.filter(Product.price >= float(min_price))
        if max_price:
            query = query.filter(Product.price <= float(max_price))
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (Product.name.ilike(search_term)) |
                (Product.brand.ilike(search_term)) |
                (Product.colorway.ilike(search_term)) |
                (Product.style_id.ilike(search_term))
            )

        # For grouping by name, we could use group_by(Product.name) but SQLite's behavior 
        # with group_by and selecting other columns isn't fully standard SQL.
        # However, for this use case, group_by(Product.name) is acceptable.
        query = query.group_by(Product.name).order_by(Product.created_at.desc())
        
        products = query.all()
        return [p.to_dict() for p in products]

    @staticmethod
    def get_product_by_id(product_id):
        from database import db
        product = db.session.get(Product, product_id)
        if product:
            return product.to_dict()
        return None

    @staticmethod
    def get_brands():
        from database import db
        brands = db.session.query(Product.brand).distinct().order_by(Product.brand).all()
        return [b[0] for b in brands]

    @staticmethod
    def get_categories():
        from database import db
        categories = db.session.query(Product.category).distinct().order_by(Product.category).all()
        return [c[0] for c in categories]

    @staticmethod
    def get_product_variants(product_id):
        from database import db
        base_product = db.session.get(Product, product_id)
        if not base_product:
            return []
            
        variants = Product.query.filter(Product.name == base_product.name).order_by(Product.colorway.asc()).all()
        return [v.to_dict() for v in variants]
