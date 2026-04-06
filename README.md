<<<<<<< HEAD
# Community-Driven Academic Resource Ranking and Recommendation System

This project is a full-stack academic resource platform built with **Django 4.2**, **Django REST Framework**, **React 18**, and **PostgreSQL**.

## Features Included
- **User Authentication**: JWT-based login, registration with university Email (`.edu`) validation. Access controls and generic Role mapping (`student`, `admin`).
- **Academic Structure Hierarchy**: Faculty → Programme → Course → Module → Topic relationships.
- **Resource Upload**: Support for PDF documents, Image files, and Video Links.
- **Rating & Reviews**: One rating/review allowed per user, per resource. 
- **Recommendation & Ranking Engine**: Dynamic weighted calculation `(score = rating*0.4 + count*0.2 + views*0.1 + recency*0.2 + verified*0.1)` on every view/rating.
- **Trending Dashboards**: Top recommended resources mapped by modules or global engagement tracking.

---

## 🚀 How to Run - Docker (Recommended for Production/Demonstration)

The absolute easiest way to spin up the entire application (Database, Backend API, Frontend React App) is using the included `docker-compose`.

### Prerequisites
- Docker Engine & Docker Compose installed.

### Steps
1. Open a terminal in the root `academic_resources` folder (where `docker-compose.yml` is).
2. Run the build and detach:
   ```bash
   docker-compose up -d --build
   ```
3. That's it! Docker will pull Postgres, install Python dependencies, build the React app via Node, and start Gunicorn + Nginx.
   - Frontend is mapped exclusively to Nginx: `http://localhost:80` (or just `http://localhost`)
   - Backend API is proxied through Nginx: `http://localhost/api/` (Django runs internally on `8000`)
   - Django Admin: `http://localhost/api/admin/`

---

## 🛠 How to Run - Local Development

If you prefer running the servers natively for development, follow these steps.

### Prerequisites
- Python 3.10+
- Node.js (v18+)
- PostgreSQL installed and running locally.

### 1. Database Setup
Create a PostgreSQL database matching the settings:
```sql
CREATE DATABASE academic_db;
CREATE USER postgres WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE academic_db TO postgres;
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
   python manage.py makemigrations api
   python manage.py migrate
   ```
5. Create a superuser (Admin):
   ```bash
   python manage.py createsuperuser
   # Follow prompts. Ensure you use an email.
   ```
6. Start the server:
   ```bash
   python manage.py runserver
   ```
*(The backend runs on `http://localhost:8000`)*

### 3. Frontend Setup (React/Vite)
1. Open a *new* terminal and navigate to the `frontend/` directory.
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
*(The frontend runs on `http://localhost:5173` typically. It is pre-configured to use `http://localhost:8000/api/` as its backend proxy).*


## Testing the System
1. Go to the frontend URL.
2. **Register** a new account (Wait to see error if you don't use `.edu` email. E.g., Use `student@test.edu`).
3. You will be redirected to the **Dashboard**.
4. Log into the Django Admin (`/admin`) using your superuser account and create some `Faculty`, `Course`, and `Module` instances so the upload forms can populate.
5. Back on the Dashboard, click **Upload Resource**. Select the structures you just made and upload a file.
6. Click into the Resource on the dashboard to view it, add a review, and see the Ranking score change instantly.
