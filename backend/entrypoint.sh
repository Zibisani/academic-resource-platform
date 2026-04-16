#!/bin/bash
set -e

echo "Waiting for MySQL..."
while ! python -c "
import MySQLdb
MySQLdb.connect(
    host='$MYSQL_HOST',
    user='$MYSQL_USER',
    passwd='$MYSQL_PASSWORD',
    db='$MYSQL_DATABASE'
)
" 2>/dev/null; do
  echo "MySQL not ready, retrying in 2s..."
  sleep 2
done

echo "MySQL ready."

echo "Running migrations..."
python manage.py migrate --noinput

echo "Starting Django development server..."
exec "$@"
