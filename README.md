# Community-Driven Academic Resource Ranking and Recommendation System

This project is a full-stack academic resource platform built with **Django 5.1**, **Django REST Framework**, **React 18 (Vite)**, and **MySQL 8.0**.

## Features Included
- **User Authentication**: JWT-based login (HTTPOnly cookies), registration with university Email (`.edu`) validation. Access controls and generic Role mapping (`student`, `admin`).
- **Admin Portal**: Fully functional dashboard for managing users, tracking analytical metrics, and moderating resource content.
- **Academic Structure Hierarchy**: Faculty → Programme → Course → Module → Topic relationships.
- **Resource Upload**: Support for PDF documents, Image files, and Video Links. Secured with server-side MIME-type payload validation.
- **Rating & Reviews**: One rating/review allowed per user, per resource. Student-initiated self-deletion included.
- **Recommendation & Ranking Engine**: Dynamic weighted calculation `(score = rating*0.4 + count*0.2 + views*0.1 + recency*0.2 + verified*0.1)` on every view/rating.
- **Trending Dashboards**: Top recommended resources mapped by modules or global engagement tracking.

---

## 🚀 How to Run - Docker (Recommended for All Users)

The absolute easiest way to spin up the entire application (MySQL Database, Django Backend API, React Frontend App) is using the included `docker-compose.yml` file.

### Prerequisites
- Docker Desktop (or Docker Engine & Docker Compose plugins) installed and running on your system.

### Steps
1. Open a terminal in the root `academic_resources` folder (where `docker-compose.yml` is located).
2. Run the compose build command:
   ```bash
   docker compose up --build
   ```
3. That's it! Docker will automatically handle building the isolated environments. It pulls MySQL, correctly provisions your database schemas, builds standard Python dependencies locally, and caches node modules.

**Access Points:**
- **Frontend App**: [http://localhost:5173](http://localhost:5173) (Your main point of interaction, features hot-reloading)
- **Backend API**: [http://localhost:8000](http://localhost:8000) (Django runs silently in the background)
- **Admin App Portal**: [http://localhost:5173/admin-portal](http://localhost:5173/admin-portal)

To shut everything down cleanly, press `CTRL + C` in the running terminal, or execute `docker compose down`. Wait for the network containers to fully drop before closing Docker Desktop.

---

## 🛠 How to Run - Traditional Local Development (Without Docker)

If you prefer running the servers natively for development without containers.

### Prerequisites
- Python 3.10+
- Node.js (v20+)
- Local MySQL instance running (e.g. XAMPP)

### 1. Database Setup
Ensure you have a local MySQL root user set up, or change `.env` to match your credentials:
```sql
CREATE DATABASE academic_db;
```

### 2. Backend Setup (Django)
1. Navigate to the `backend/` directory.
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run migrations:
   ```bash
   python manage.py makemigrations 
   python manage.py migrate
   ```
5. Start the server:
   ```bash
   python manage.py runserver
   ```
*(The backend runs on `http://localhost:8000`)*

### 3. Frontend Setup (React/Vite)
1. Open a *new* terminal and navigate to the `frontend/` directory.
2. Install Node dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
*(The frontend runs on `http://localhost:5173`. It is pre-configured to proxy `/api` calls directly to Django)*
