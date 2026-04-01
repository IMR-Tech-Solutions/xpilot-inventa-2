export USE_CELERY=true
export DJANGO_SETTINGS_MODULE=newproject.settings

echo "🚀 Starting Production Services..."

if pgrep redis-server > /dev/null; then
    echo "✅ Redis is already running"
else
    echo "🚀 Starting Redis..."
    redis-server --daemonize yes
    sleep 2
fi

if pgrep -f "celery.*worker" > /dev/null; then
    echo "🔄 Stopping existing Celery worker..."
    pkill -f "celery.*worker"
fi

if pgrep -f "celery.*beat" > /dev/null; then
    echo "🔄 Stopping existing Celery beat..."
    pkill -f "celery.*beat"
fi

sleep 2

echo "🚀 Starting Celery Worker..."
celery -A newproject worker -l info --detach --pidfile=celery_worker.pid

echo "🚀 Starting Celery Beat (Scheduler)..."
celery -A newproject beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler --detach --pidfile=celery_beat.pid

# Wait for services to start
sleep 3

echo "✅ All services started successfully!"
echo "📧 Password reset emails will be sent asynchronously"
echo "⏰ Periodic tasks scheduled via Django admin"
echo "🛑 Press Ctrl+C to stop Django (Redis, Celery worker & beat will keep running)"
