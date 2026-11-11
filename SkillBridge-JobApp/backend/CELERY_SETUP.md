# Celery Periodic Tasks Setup Guide

## Overview

The SkillBridge application uses Celery Beat to run periodic background tasks, including automatic daily snapshots for dashboard trend calculations.

## Periodic Tasks

### 1. Daily Dashboard Snapshots
**Task:** `tasks.save_daily_dashboard_snapshots`
**Schedule:** Daily at 01:00 UTC
**Purpose:** Automatically saves dashboard statistics for all employers to enable trend calculation

**What it does:**
- Iterates through all employer users
- Calculates current stats (active jobs, applications, shortlisted, filled positions)
- Saves a snapshot to the database with timestamp
- Logs success/failure for each employer

### 2. Job Deadline Enforcement
**Task:** `tasks.enforce_job_deadlines`
**Schedule:** Daily at 00:00 UTC
**Purpose:** Closes jobs that have passed their application deadline

### 3. Daily Job Digest
**Task:** `tasks.send_daily_job_digest`
**Schedule:** Daily at 08:00 UTC
**Purpose:** Sends email digest of new job matches to candidates

### 4. Weekly Job Digest
**Task:** `tasks.send_weekly_job_digest`
**Schedule:** Every Monday at 08:00 UTC
**Purpose:** Sends weekly summary email to candidates

## Running Celery

### Prerequisites
- Redis server running (default: `redis://localhost:6379/0`)
- Python virtual environment activated
- All dependencies installed

### Start Celery Worker
```bash
cd backend
celery -A celery_app worker --loglevel=info
```

### Start Celery Beat (Periodic Task Scheduler)
```bash
cd backend
celery -A celery_app beat --loglevel=info
```

### Run Both Together
```bash
cd backend
celery -A celery_app worker --beat --loglevel=info
```

## Testing the Snapshot Task

### Option 1: Manual API Call
You can manually trigger a snapshot save for the current user:

```bash
# Login as employer first to get JWT token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "employer@example.com",
    "password": "password123"
  }'

# Use the token to create a snapshot
curl -X POST http://localhost:5000/api/analytics/dashboard/snapshot \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Option 2: Manually Invoke Celery Task
```bash
cd backend
python -c "from tasks.analytics_tasks import save_daily_dashboard_snapshots; save_daily_dashboard_snapshots.delay()"
```

### Option 3: Test with Celery Call
```python
from celery_app import celery
result = celery.send_task('tasks.save_daily_dashboard_snapshots')
print(result.get())
```

### Option 4: Trigger Immediately via Celery Beat
Temporarily change the schedule to run every minute for testing:

```python
# In celery_app.py (for testing only!)
'save-daily-dashboard-snapshots': {
    'task': 'tasks.save_daily_dashboard_snapshots',
    'schedule': 60.0,  # Every 60 seconds
},
```

## Verifying Snapshots

### Check MongoDB
```bash
# Connect to MongoDB
mongo

# Use your database
use skillbridge

# View snapshots
db.dashboard_snapshots.find().pretty()

# Count snapshots
db.dashboard_snapshots.count()

# Find snapshots for specific employer
db.dashboard_snapshots.find({ user_id: "EMPLOYER_ID" }).pretty()
```

### Via API
```bash
# Get snapshots for last 30 days
curl -X GET "http://localhost:5000/api/analytics/dashboard/snapshots?days=30" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get trends (requires at least one snapshot older than 7 days)
curl -X GET "http://localhost:5000/api/analytics/dashboard/trends?days=7" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Monitoring

### View Celery Logs
When running Celery worker/beat, you'll see logs like:

```
[2025-01-23 01:00:00,000: INFO/MainProcess] Task tasks.save_daily_dashboard_snapshots[...] received
[2025-01-23 01:00:00,500: INFO/ForkPoolWorker-1] Starting daily dashboard snapshot task
[2025-01-23 01:00:01,200: INFO/ForkPoolWorker-1] Saved snapshot for employer 507f1f77bcf86cd799439011: {...}
[2025-01-23 01:00:01,800: INFO/ForkPoolWorker-1] Daily dashboard snapshot task completed. Saved 5 snapshots for 5 employers
[2025-01-23 01:00:02,000: INFO/MainProcess] Task tasks.save_daily_dashboard_snapshots[...] succeeded
```

### Flower (Web-based Monitoring)
```bash
# Install flower
pip install flower

# Start flower
celery -A celery_app flower
```

Visit `http://localhost:5555` to see:
- Active tasks
- Task history
- Worker status
- Task statistics

## Troubleshooting

### Task Not Running
1. **Check Redis is running:**
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

2. **Check Celery Beat is running:**
   ```bash
   ps aux | grep celery
   ```

3. **Check beat schedule file exists:**
   ```bash
   ls -la celerybeat-schedule
   ```

4. **Verify task is registered:**
   ```python
   from celery_app import celery
   print(celery.tasks)
   ```

### Task Failing
1. **Check worker logs** for error messages
2. **Verify MongoDB connection** in task code
3. **Test task directly** in Python shell:
   ```python
   from tasks.analytics_tasks import save_daily_dashboard_snapshots
   result = save_daily_dashboard_snapshots()
   print(result)
   ```

### No Historical Data for Trends
- Trends require at least one snapshot older than the comparison period (default: 7 days)
- Create manual snapshots for testing:
  ```bash
  # Create snapshot today
  curl -X POST http://localhost:5000/api/analytics/dashboard/snapshot \
    -H "Authorization: Bearer YOUR_JWT_TOKEN"

  # Manually insert an older snapshot in MongoDB for testing
  db.dashboard_snapshots.insertOne({
    user_id: "EMPLOYER_ID",
    user_role: "employer",
    active_jobs: 5,
    total_applications: 100,
    shortlisted: 20,
    filled_positions: 2,
    snapshot_date: ISODate("2025-01-16T00:00:00Z")  # 7 days ago
  })
  ```

## Production Deployment

### Using Supervisor (Recommended)
Create supervisor config files:

**celery_worker.conf:**
```ini
[program:skillbridge_celery_worker]
command=/path/to/venv/bin/celery -A celery_app worker --loglevel=info
directory=/path/to/backend
user=www-data
autostart=true
autorestart=true
stdout_logfile=/var/log/celery/worker.log
stderr_logfile=/var/log/celery/worker_err.log
```

**celery_beat.conf:**
```ini
[program:skillbridge_celery_beat]
command=/path/to/venv/bin/celery -A celery_app beat --loglevel=info
directory=/path/to/backend
user=www-data
autostart=true
autorestart=true
stdout_logfile=/var/log/celery/beat.log
stderr_logfile=/var/log/celery/beat_err.log
```

### Using Systemd
Create systemd service files in `/etc/systemd/system/`:

**celery-worker.service:**
```ini
[Unit]
Description=SkillBridge Celery Worker
After=network.target redis.service

[Service]
Type=forking
User=www-data
Group=www-data
WorkingDirectory=/path/to/backend
ExecStart=/path/to/venv/bin/celery -A celery_app worker --loglevel=info
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

**celery-beat.service:**
```ini
[Unit]
Description=SkillBridge Celery Beat
After=network.target redis.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/path/to/backend
ExecStart=/path/to/venv/bin/celery -A celery_app beat --loglevel=info
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable celery-worker celery-beat
sudo systemctl start celery-worker celery-beat
sudo systemctl status celery-worker celery-beat
```

## Environment Variables

Ensure these are set in your `.env` file:

```env
REDIS_URL=redis://localhost:6379/0
MONGODB_URI=mongodb://localhost:27017/skillbridge
```

## Backup Considerations

Since snapshots accumulate daily, consider:

1. **Retention Policy:** Delete snapshots older than 1 year
   ```python
   # Add to periodic tasks
   @celery.task(name='tasks.cleanup_old_snapshots')
   def cleanup_old_snapshots():
       cutoff_date = datetime.utcnow() - timedelta(days=365)
       result = db.dashboard_snapshots.delete_many({
           'snapshot_date': {'$lt': cutoff_date}
       })
       return {'deleted_count': result.deleted_count}
   ```

2. **Database Indexing:** Create index on frequently queried fields
   ```javascript
   db.dashboard_snapshots.createIndex({ user_id: 1, snapshot_date: -1 })
   db.dashboard_snapshots.createIndex({ user_role: 1, snapshot_date: -1 })
   ```

## Summary

The daily snapshot task is now fully configured and will run automatically at 01:00 UTC every day. You can:
- Test it manually using the API endpoint
- View historical data in MongoDB
- Monitor execution via Celery logs or Flower
- Calculate trends based on historical snapshots
