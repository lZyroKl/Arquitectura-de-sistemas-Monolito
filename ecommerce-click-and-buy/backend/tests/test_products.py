def test_list_products_groups_variants_by_name(client):
    response = client.get("/api/products")
    assert response.status_code == 200
    names = [p["name"] for p in response.get_json()]
    assert sorted(names) == ["Air Jordan 1 Retro High", "Yeezy Boost 350"]


def test_list_products_returns_lowest_price_of_model(client):
    products = client.get("/api/products?brand=Air Jordan").get_json()
    assert len(products) == 1
    assert products[0]["price"] == 50000
    assert isinstance(products[0]["sizes"], list)


def test_filter_by_category_and_price(client):
    assert len(client.get("/api/products?category=Lifestyle").get_json()) == 1
    assert len(client.get("/api/products?min_price=100000").get_json()) == 1
    assert len(client.get("/api/products?max_price=55000").get_json()) == 1


def test_search_by_colorway(client):
    products = client.get("/api/products?search=Zebra").get_json()
    assert [p["name"] for p in products] == ["Yeezy Boost 350"]


def test_invalid_price_filter_returns_400(client):
    response = client.get("/api/products?min_price=abc")
    assert response.status_code == 400


def test_get_product_detail(client):
    product = client.get("/api/products/1").get_json()
    assert product["colorway"] == "Chicago"
    assert product["sizes"] == ["40", "41", "42"]


def test_get_product_not_found(client):
    assert client.get("/api/products/999").status_code == 404


def test_get_variants(client):
    variants = client.get("/api/products/1/variants").get_json()
    assert [v["colorway"] for v in variants] == ["Bred", "Chicago"]


def test_get_variants_not_found(client):
    assert client.get("/api/products/999/variants").status_code == 404


def test_brands_and_categories(client):
    assert client.get("/api/products/brands").get_json() == ["Air Jordan", "adidas"]
    assert client.get("/api/products/categories").get_json() == ["Basketball", "Lifestyle"]


def test_health_and_swagger(client):
    assert client.get("/api/health").get_json() == {"status": "ok"}
    spec = client.get("/apispec.json").get_json()
    assert "/api/payments/webpay/create" in spec["paths"]
    assert client.get("/apidocs/").status_code == 200


def test_serves_frontend_build_when_present(tmp_path):
    from app import create_app

    dist = tmp_path / "dist"
    (dist / "assets").mkdir(parents=True)
    (dist / "index.html").write_text("<html>click&buy</html>")
    (dist / "assets" / "app.js").write_text("console.log(1)")

    client = create_app({"DB_PATH": str(tmp_path / "db.sqlite"), "FRONTEND_DIST": str(dist)}).test_client()
    assert b"click&buy" in client.get("/").data
    assert client.get("/assets/app.js").data == b"console.log(1)"
    assert b"click&buy" in client.get("/cualquier/ruta").data
    assert client.get("/api/no-existe").status_code == 404
    assert client.get("/api/health").status_code == 200
    assert client.get("/apidocs/").status_code == 200
