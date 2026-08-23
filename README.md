# E-commerce Click&Buy Sneaker Store

Este es un proyecto de ecommerce de zapatillas que utiliza una arquitectura de Monolito separado en capas lógicas de Frontend y Backend, pero que se corren en conjunto.

## Requisitos Previos

Asegúrate de tener instalado en tu computadora:
- **Python** (versión 3.8 o superior recomendada).
- **Node.js y npm** (necesarios para el frontend).
- **Git** (para clonar este repositorio).

## ¿Cómo levantar el proyecto localmente?

Para correr el proyecto completo necesitas tener en ejecución tanto el **Backend** como el **Frontend** al mismo tiempo, cada uno en una terminal separada.

### Paso 1: Iniciar el Backend (Python)

Abre una terminal en la raíz del proyecto y ejecuta los siguientes comandos:

```bash
# Entrar a la carpeta del backend
cd ecommerce-click-and-buy/backend

# (Opcional pero recomendado) Crear un entorno virtual para no mezclar dependencias
python -m venv .venv

# Activar el entorno virtual:
# En Windows:
.venv\Scripts\activate
# En Mac/Linux:
# source .venv/bin/activate

# Instalar las dependencias de Python
pip install -r requirements.txt

# (Requerido la primera vez) Poblar la base de datos local con las zapatillas
python seed.py

# Iniciar el servidor (correrá en el puerto 5000)
python app.py
```

### Paso 2: Iniciar el Frontend (React/Vite)

Abre una **segunda terminal** (manteniendo la del backend corriendo) y ejecuta:

```bash
# Entrar a la carpeta del frontend
cd ecommerce-click-and-buy/frontend

# Instalar las dependencias de Node
npm install

# Iniciar el servidor de desarrollo
npm run dev
```

Luego, puedes abrir tu navegador en la ruta que te indique Vite (normalmente será `http://localhost:5173`).

---

## Preguntas Frecuentes

### ¿Las zapatillas cambian automáticamente?
**No.** Las zapatillas que ves en la página provienen de una base de datos local (el archivo `store.db` en el backend) que fue poblada a partir de un archivo JSON estático (`sneaks_data.json`). Siempre verás las mismas zapatillas cada vez que abras la página, a menos que actualices esa base de datos.

### ¿Cómo puedo actualizar la lista de zapatillas?
Si deseas obtener zapatillas nuevas o actualizar los precios, existe un script opcional (`sneaks-fetcher`) que consulta una API real. Para usarlo:

```bash
# En una terminal:
cd ecommerce-click-and-buy/sneaks-fetcher
npm install
npm run fetch
```
Esto descargará información nueva y actualizará el archivo `sneaks_data.json` del backend. Después de que termine, debes volver al backend y ejecutar `python seed.py` para cargar esos nuevos datos a tu base de datos local.
