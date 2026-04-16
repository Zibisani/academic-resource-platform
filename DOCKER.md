## Running the project with Docker

The only thing you need installed is Docker Desktop.

### First time setup

1. Copy the environment template and fill it in:
   cp .env.example .env

   Open .env and set at minimum:
   - DJANGO_SECRET_KEY  (generate one: https://djecrety.ir)
   - MYSQL_PASSWORD     (anything, just be consistent)
   - MYSQL_ROOT_PASSWORD
   - JWT_SIGNING_KEY    (long random string)

2. Build and start everything:
   docker compose up --build

   First run takes a few minutes while Docker pulls images
   and installs dependencies. Subsequent runs are fast.

3. The system is ready when you see Django's
   "Starting development server at http://0.0.0.0:8000/" in the logs.

### Access

| Service        | URL                              |
|----------------|----------------------------------|
| Frontend       | http://localhost:5173            |
| Backend API    | http://localhost:8000/api/       |
| Django Admin   | http://localhost:8000/django-admin/ |
| MySQL          | localhost:3306                   |

### Create an admin account

docker compose exec backend python manage.py createsuperuser

### Useful commands

# Start (after first build)
docker compose up

# Start in background
docker compose up -d

# View live logs
docker compose logs -f

# View logs for one service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db

# Run Django management commands
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py shell

# Install a new Python package
docker compose exec backend pip install package-name
(then add it to requirements.txt and rebuild)

# Install a new npm package
docker compose exec frontend npm install package-name

# Stop everything
docker compose down

# Stop and wipe the database (WARNING: all data lost)
docker compose down -v

# Rebuild after changing a Dockerfile or requirements.txt
docker compose up --build
