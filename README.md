# E-commerce Click&Buy Sneaker Store

E-commerce de zapatillas construido con **arquitectura monolito**: un frontend en **Vite (JavaScript vanilla)** y un backend en **Python (Flask)** que se comunican por una **API REST** documentada con **Swagger**, con persistencia en **SQL (SQLite)** y pagos reales en ambiente de pruebas con **Webpay Plus (Transbank)**.

```
┌──────────────────────┐   REST (JSON) /api/*   ┌───────────────────────────────┐      ┌──────────────┐
│  FRONTEND            │ ─────────────────────▶ │  BACKEND (Flask)              │ ───▶ │ SQLite (SQL) │
│  Vite + JS vanilla   │                        │  routes → services → models   │      └──────────────┘
│  (router por hash)   │ ◀───────────────────── │  Swagger UI en /apidocs       │
└──────────────────────┘                        └──────────────┬────────────────┘
          ▲                                                    │ create / commit
          │        redirección del usuario (token_ws)          ▼
          └──────────────────────────────────────────── Webpay Plus (Transbank)
```

En producción ambos se empaquetan en **una sola imagen Docker**: Flask sirve la API y también el build de Vite, así todo queda en el mismo origen.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Vite 6 + JavaScript vanilla |
| Backend | Python 3.12, Flask, Gunicorn |
| Base de datos | SQLite (SQL) |
| API | REST + Swagger (Flasgger) en `/apidocs` |
| Pagos | Webpay Plus (`transbank-sdk`, ambiente de integración) |
| Tests | pytest + pytest-cov (mínimo exigido 60 %) |
| Contenedores | Docker (multi-stage) + docker-compose |
| CI/CD | GitHub Actions → Render |

## Estructura del backend

```
backend/
├── app.py              # create_app(): configura Flask, CORS, Swagger y blueprints
├── config.py           # configuración por variables de entorno
├── database.py         # conexión SQLite, esquema y migraciones
├── models/             # acceso a datos (SQL)
├── services/           # reglas de negocio: cálculo de pedido y cliente Webpay
├── routes/             # endpoints REST (products, auth, orders, payments)
├── swagger.py          # definiciones OpenAPI
├── seed.py             # carga el catálogo y la cuenta demo
└── tests/              # pytest
```

## Levantar con Docker (recomendado)

Requiere Docker Desktop.

```bash
cd ecommerce-click-and-buy
docker compose up --build
```

- Tienda: <http://localhost:5000>
- Swagger: <http://localhost:5000/apidocs>
- Cuenta demo: `demo@clickandbuy.cl` / `demo1234`

La base de datos queda en el volumen `db-data`. Al arrancar, el contenedor carga el catálogo y la cuenta demo solo si la base está vacía.

## Levantar en modo desarrollo (sin Docker)

Requiere Python 3.10+ y Node.js 20+. Usa dos terminales.

**Terminal 1: backend** (puerto 5000)

```bash
cd ecommerce-click-and-buy/backend
python -m venv .venv
# Windows: .venv\Scripts\activate    |    Mac/Linux: source .venv/bin/activate
pip install -r requirements-dev.txt
python seed.py          # la primera vez: catálogo + cuenta demo
python app.py
```

**Terminal 2: frontend** (puerto 5173)

```bash
cd ecommerce-click-and-buy/frontend
npm install
npm run dev
```

Abre <http://localhost:5173>.

## Probar un pago con Webpay

El proyecto usa el **ambiente de integración** de Transbank, que no cobra dinero real.

1. Inicia sesión (o usa la cuenta demo), agrega productos al carrito y ve a **Ir a Pagar**.
2. Completa los datos de despacho y presiona **Pagar con Webpay**. Serás redirigido al formulario de Webpay.
3. Usa una tarjeta de prueba:

| Tarjeta | Número | CVV | Resultado |
|---|---|---|---|
| VISA crédito | `4051 8856 0044 6623` | `123` | Aprobada |
| Mastercard crédito | `5186 0595 5959 0568` | `123` | Rechazada |

   Cualquier fecha de expiración futura sirve. Cuando pida autenticación, usa RUT `11.111.111-1` y clave `123`.
4. Volverás a la página de resultado. En **Mi cuenta** el pedido aparece como *Pagado* y el stock del producto se descuenta.

Si anulas el pago en Webpay, el pedido queda *Anulado* y el carrito se mantiene.

### Flujo del pago

1. `POST /api/payments/webpay/create`: el backend valida el carrito contra la base de datos (precio, talla y stock), calcula el envío (gratis desde $69.990, si no $4.990), crea el pedido `pending` e inicia la transacción en Webpay. **Los precios que envía el cliente se ignoran.**
2. El frontend envía el `token_ws` por POST a la URL de Webpay.
3. Webpay devuelve al usuario a `/api/payments/webpay/return`. El backend confirma la transacción (`commit`), verifica monto y orden de compra, y marca el pedido como `paid`, `rejected` o `cancelled`.
4. El backend redirige a `/#/checkout/result?order=<id>`.

## API

La documentación interactiva está en `/apidocs` (JSON en `/apispec.json`).

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/products` | Catálogo (filtros: `brand`, `category`, `min_price`, `max_price`, `search`) |
| GET | `/api/products/{id}` | Detalle de producto |
| GET | `/api/products/{id}/variants` | Variantes del modelo |
| GET | `/api/products/brands` | Marcas |
| GET | `/api/products/categories` | Categorías |
| POST | `/api/auth/register` | Registro |
| POST | `/api/auth/login` | Inicio de sesión |
| GET | `/api/auth/me` | Usuario actual |
| POST | `/api/auth/logout` | Cierre de sesión |
| GET | `/api/orders` | Pedidos del usuario |
| GET | `/api/orders/{id}` | Detalle de un pedido |
| POST | `/api/payments/webpay/create` | Crear pedido e iniciar pago |
| GET/POST | `/api/payments/webpay/return` | Retorno desde Webpay |
| GET | `/api/health` | Estado del servicio |

## Tests y coverage

```bash
cd ecommerce-click-and-buy/backend
pytest
```

`pytest` mide el coverage automáticamente y falla si baja del 60 % (configurado en `pyproject.toml`). Los tests usan una base SQLite temporal y reemplazan las llamadas a Transbank, así que no necesitan red.

## CI/CD

El workflow [.github/workflows/ci.yml](.github/workflows/ci.yml) se ejecuta en cada push y pull request:

1. **backend-tests**: instala dependencias y ejecuta `pytest` con coverage mínimo de 60 %.
2. **frontend-build**: `npm ci && npm run build`.
3. **docker**: construye la imagen, la levanta y verifica `/api/health`, `/api/products`, `/apidocs` y el frontend.
4. **deploy** (solo en `main` y si todo lo anterior pasó): llama al Deploy Hook de Render.

### Configurar el despliegue en Render (una sola vez)

1. Crea una cuenta en <https://render.com> y conecta tu GitHub.
2. **New → Blueprint** y elige este repositorio; Render lee [render.yaml](render.yaml) y crea el servicio Docker gratuito.
3. En el servicio: **Settings → Deploy Hook** y copia la URL.
4. En GitHub: **Settings → Secrets and variables → Actions → New repository secret**, con nombre `RENDER_DEPLOY_HOOK` y la URL como valor.

Desde ese momento, cada push a `main` con tests verdes se despliega solo.

> En el plan gratuito de Render el disco no persiste: la base SQLite se recrea (catálogo + cuenta demo) en cada despliegue o reinicio, y el servicio se suspende tras 15 minutos sin uso (la primera visita tarda unos 30 segundos).

## Variables de entorno

| Variable | Por defecto | Uso |
|---|---|---|
| `SECRET_KEY` | `dev-secret-change-me` | Firma de la cookie de sesión. **Cámbiala en producción.** |
| `DB_PATH` | `backend/store.db` | Ruta del archivo SQLite |
| `FRONTEND_URL` | `RENDER_EXTERNAL_URL` o `http://localhost:5173` | A dónde vuelve el usuario después de Webpay; también se usa para CORS |
| `CORS_ORIGINS` | `FRONTEND_URL` | Orígenes permitidos, separados por coma |
| `COOKIE_SECURE` | `false` | `true` en producción con HTTPS |
| `TBK_ENV` | `integration` | `production` para usar `TBK_COMMERCE_CODE` y `TBK_API_KEY` reales |
| `VITE_API_URL` | `http://localhost:5000/api` | URL de la API para el frontend (en Docker: `/api`) |

## Actualizar el catálogo

Los productos vienen de `backend/sneaks_data.json`. Para descargar datos nuevos:

```bash
cd ecommerce-click-and-buy/sneaks-fetcher
npm install
npm run fetch
cd ../backend
python seed.py --force   # recarga el catálogo (borra los pedidos existentes)
```
