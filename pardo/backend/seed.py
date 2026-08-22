import json
from database import init_db, get_connection

init_db()

products = [
    {
        "name": "Air Max Pulse",
        "brand": "Nike",
        "category": "Running",
        "price": 149990,
        "description": "Zapatillas de running con tecnología Air Max para máxima amortiguación. Diseño moderno con malla transpirable y suela de goma duradera.",
        "image_url": "https://static.nike.com/a/images/t_PDP_936_v1/f_auto,q_auto:eco/b1bcf402-3e15-4543-87c3-u3a86d3c0656/NIKE+AIR+MAX+PULSE.png",
        "stock": 25,
        "sizes": ["38", "39", "40", "41", "42", "43", "44"]
    },
    {
        "name": "Ultraboost Light",
        "brand": "Adidas",
        "category": "Running",
        "price": 189990,
        "description": "La Ultraboost más ligera jamás creada. Con tecnología BOOST para retorno de energía y upper Primeknit+ adaptativo.",
        "image_url": "https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/68af29b2fce9468e9f33af4400f9f1f5_9366/Ultraboost_Light_Running_Shoes_White_GY9352_01_standard.jpg",
        "stock": 18,
        "sizes": ["39", "40", "41", "42", "43", "44", "45"]
    },
    {
        "name": "Suede Classic XXI",
        "brand": "Puma",
        "category": "Casual",
        "price": 79990,
        "description": "El icónico Suede de Puma reinventado para la era moderna. Upper de gamuza premium con suela de goma clásica.",
        "image_url": "https://images.puma.com/image/upload/f_auto,q_auto,b_rgb:fafafa,w_750,h_750/global/374915/01/sv01/fnd/PNA/fmt/png",
        "stock": 30,
        "sizes": ["38", "39", "40", "41", "42", "43"]
    },
    {
        "name": "Classic Leather",
        "brand": "Reebok",
        "category": "Casual",
        "price": 89990,
        "description": "Las Classic Leather de Reebok: un ícono del streetwear. Cuero suave y silueta limpia que combina con todo.",
        "image_url": "https://assets.reebok.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/3613ebaf6ed24a1f93e9ab6c011614e9_9366/Classic_Leather_Shoes_White_49799_01_standard.jpg",
        "stock": 22,
        "sizes": ["39", "40", "41", "42", "43", "44"]
    },
    {
        "name": "574 Core",
        "brand": "New Balance",
        "category": "Casual",
        "price": 109990,
        "description": "Las 574 son el modelo más emblemático de New Balance. Combinación de gamuza y malla con la clásica suela ENCAP.",
        "image_url": "https://nb.scene7.com/is/image/NB/ml574evg_nb_02_i?$pdpFlexH2$&wid=440&hei=440",
        "stock": 15,
        "sizes": ["38", "39", "40", "41", "42", "43", "44"]
    },
    {
        "name": "Chuck Taylor All Star",
        "brand": "Converse",
        "category": "Casual",
        "price": 64990,
        "description": "Las zapatillas más icónicas de la historia. Canvas premium con puntera de goma y parche de estrella clásico.",
        "image_url": "https://www.converse.com/dw/image/v2/BCZC_PRD/on/demandware.static/-/Sites-cnv-master-catalog/default/dw1c018b38/images/a_107/M9160_A_107X1.jpg",
        "stock": 40,
        "sizes": ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"]
    },
    {
        "name": "Old Skool",
        "brand": "Vans",
        "category": "Skate",
        "price": 74990,
        "description": "Las Old Skool de Vans son un clásico del skate y el streetwear. Lona y gamuza con la icónica franja lateral.",
        "image_url": "https://images.vans.com/is/image/Vans/VN000D3HY28-HERO?wid=700&hei=700&fmt=jpeg&qlt=50&resMode=sharp2&op_usm=0.9,1.7,8,0",
        "stock": 35,
        "sizes": ["37", "38", "39", "40", "41", "42", "43", "44"]
    },
    {
        "name": "Gel-Kayano 30",
        "brand": "Asics",
        "category": "Running",
        "price": 179990,
        "description": "Estabilidad superior con tecnología GEL y FF BLAST PLUS para un running suave y cómodo en largas distancias.",
        "image_url": "https://images.asics.com/is/image/asics/1011B548_003_SR_RT_GLB-2?wid=824&hei=824&fmt=jpg",
        "stock": 12,
        "sizes": ["40", "41", "42", "43", "44", "45"]
    },
    {
        "name": "Air Jordan 1 Retro High OG",
        "brand": "Nike",
        "category": "Basketball",
        "price": 199990,
        "description": "Las Air Jordan 1 que cambiaron la historia del basketball y la moda. Cuero premium en un colorway legendario.",
        "image_url": "https://static.nike.com/a/images/t_PDP_936_v1/f_auto,q_auto:eco/u_126ab356-44d8-4a06-89b4-fcdda8000f85,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/b1bcf402-3e15-4543-87c3-u3a86d3c0656/AIR+JORDAN+1+RETRO+HIGH+OG.png",
        "stock": 8,
        "sizes": ["40", "41", "42", "43", "44", "45"]
    },
    {
        "name": "RS-X Reinvention",
        "brand": "Puma",
        "category": "Lifestyle",
        "price": 119990,
        "description": "Diseño futurista con tecnología Running System. Silueta chunky con materiales mixtos y colores vibrantes.",
        "image_url": "https://images.puma.com/image/upload/f_auto,q_auto,b_rgb:fafafa,w_750,h_750/global/369579/17/sv01/fnd/PNA/fmt/png",
        "stock": 20,
        "sizes": ["39", "40", "41", "42", "43", "44"]
    },
    {
        "name": "Forum Low",
        "brand": "Adidas",
        "category": "Basketball",
        "price": 109990,
        "description": "Nacidas en la cancha de basketball en 1984, las Forum Low son un ícono del streetwear con su correa característica.",
        "image_url": "https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/1ae7a45cb5b24f5dbb18af6d0068141a_9366/Forum_Low_Shoes_White_FY7755_01_standard.jpg",
        "stock": 16,
        "sizes": ["38", "39", "40", "41", "42", "43", "44"]
    },
    {
        "name": "Sk8-Hi",
        "brand": "Vans",
        "category": "Skate",
        "price": 84990,
        "description": "Las Sk8-Hi de Vans: la bota alta definitiva del skate. Protección de tobillo con el estilo inconfundible de la marca.",
        "image_url": "https://images.vans.com/is/image/Vans/VN000D5IB8C-HERO?wid=700&hei=700&fmt=jpeg&qlt=50",
        "stock": 28,
        "sizes": ["37", "38", "39", "40", "41", "42", "43", "44"]
    }
]

conn = get_connection()

conn.execute("DELETE FROM order_items")
conn.execute("DELETE FROM orders")
conn.execute("DELETE FROM products")
conn.execute("DELETE FROM users")

for p in products:
    conn.execute(
        """INSERT INTO products (name, brand, category, price, description, image_url, stock, sizes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (p["name"], p["brand"], p["category"], p["price"], p["description"],
         p["image_url"], p["stock"], json.dumps(p["sizes"]))
    )

conn.commit()
conn.close()

print(f"Base de datos poblada con {len(products)} productos.")
