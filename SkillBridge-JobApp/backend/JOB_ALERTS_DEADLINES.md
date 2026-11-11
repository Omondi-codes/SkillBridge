# Job Alerts & Deadline Enforcement

This document describes the job alerts and deadline enforcement features implemented in SkillBridge.

## Table of Contents
1. [Job Alerts](#job-alerts)
2. [Deadline Enforcement](#deadline-enforcement)
3. [API Endpoints](#api-endpoints)
4. [Celery Tasks](#celery-tasks)
5. [Setup Instructions](#setup-instructions)

---

## Job Alerts

Job alerts allow candidates to subscribe to notifications when jobs matching their criteria are posted.

### Features

- **Flexible Criteria**: Filter by keywords, location, category, employment type, experience level, minimum salary, and remote-only options
- **Multiple Frequencies**:
  - **Instant**: Receive email immediately when a matching job is posted
  - **Daily**: Receive a daily digest of matching jobs posted in the last 24 hours
  - **Weekly**: Receive a weekly digest every Monday with jobs posted in the last 7 days
- **Active/Inactive Toggle**: Pause and resume alerts without deleting them
- **Smart Matching**: Alerts check jobs using keyword search, location matching, and other criteria

### Database Schema

```python
{
    'id': str,  # UUID
    'user_id': str,  # Candidate user ID
    'keywords': List[str],  # Keywords to match in job title/description
    'location': str | None,  # Location filter
    'category': str | None,  # Job category
    'employment_type': str | None,  # full-time, part-time, contract, internship
    'experience_level': str | None,  # Entry, Mid, Senior
    'min_salary': int | None,  # Minimum salary requirement
    'remote_only': bool,  # Only match remote jobs
    'frequency': str,  # instant, daily, weekly
    'is_active': bool,  # Active/inactive status
    'created_at': datetime,
    'updated_at': datetime,
    'last_sent_at': datetime | None  # Last time notification was sent
}
```

---

## Deadline Enforcement

Automatic job closure based on application deadlines.

### Features

- **Automatic Closure**: Jobs are automatically closed when their `application_deadline` is reached
- **Daily Checks**: Runs daily at midnight UTC via Celery Beat
- **Employer Notifications**: Employers receive email notifications when their jobs are auto-closed
- **Application Statistics**: Closure notification includes total application count

### How It Works

1. **Scheduled Task**: `enforce_job_deadlines` runs daily at 00:00 UTC
2. **Query**: Finds all jobs with `status='active'` and `application_deadline < now()`
3. **Update**: Changes job status to `'closed'`
4. **Notify**: Sends email to employer with job statistics

---

## API Endpoints

### Job Alerts Endpoints

#### Create Job Alert
```http
POST /api/job-alerts/
Authorization: Bearer <token>
Role: candidate

Body:
{
  "keywords": ["React", "TypeScript"],
  "location": "Nairobi",
  "category": "software_development",
  "employment_type": "full-time",
  "experience_level": "mid",
  "min_salary": 100000,
  "remote_only": false,
  "frequency": "instant"  // instant, daily, or weekly
}

Response:
{
  "success": true,
  "data": { ...alert object... },
  "message": "Job alert created successfully"
}
```

#### Get All Job Alerts
```http
GET /api/job-alerts/
Authorization: Bearer <token>
Role: candidate

Response:
{
  "success": true,
  "data": {
    "alerts": [...],
    "count": 5
  }
}
```

#### Get Specific Alert
```http
GET /api/job-alerts/<alert_id>
Authorization: Bearer <token>
Role: candidate
```

#### Update Job Alert
```http
PUT /api/job-alerts/<alert_id>
Authorization: Bearer <token>
Role: candidate

Body:
{
  "keywords": ["Python", "Django"],
  "frequency": "daily"
}
```

#### Toggle Alert (Activate/Deactivate)
```http
POST /api/job-alerts/<alert_id>/toggle
Authorization: Bearer <token>
Role: candidate

Response:
{
  "success": true,
  "data": {
    "is_active": false
  },
  "message": "Job alert deactivated successfully"
}
```

#### Delete Job Alert
```http
DELETE /api/job-alerts/<alert_id>
Authorization: Bearer <token>
Role: candidate
```

---

## Celery Tasks

### Job Alert Tasks

#### `check_job_alerts(job_id)`
- **Trigger**: Automatically when a new job is created
- **Purpose**: Check if the new job matches any active job alerts
- **Action**: Sends instant notifications to matching alerts
- **Implementation**: Called in `jobs.py` after job creation

```python
# In api/jobs.py
from tasks.job_tasks import check_job_alerts
check_job_alerts.delay(job.id)  # Async task
```

#### `send_daily_job_digest()`
- **Schedule**: Daily at 08:00 UTC
- **Purpose**: Send digest emails to users with daily frequency
- **Scope**: Jobs posted in last 24 hours

#### `send_weekly_job_digest()`
- **Schedule**: Every Monday at 08:00 UTC
- **Purpose**: Send weekly digest emails
- **Scope**: Jobs posted in last 7 days

### Deadline Enforcement Tasks

#### `enforce_job_deadlines()`
- **Schedule**: Daily at 00:00 UTC
- **Purpose**: Close jobs with expired deadlines
- **Action**:
  1. Find jobs where `status='active'` and `application_deadline < now()`
  2. Update status to `'closed'`
  3. Notify employer

### Notification Tasks

#### `send_job_alert_notification(user_id, job_id)`
- **Purpose**: Instant notification when a job matches an alert
- **Content**: Job details (title, company, location, description preview)

#### `send_deadline_notification(employer_id, job_id)`
- **Purpose**: Notify employer when job is auto-closed
- **Content**: Job details, application count, closure reason

#### `send_job_digest_email(user_id, matching_jobs)`
- **Purpose**: Send daily/weekly digest with multiple matching jobs
- **Content**: List of up to 10 matching jobs

---

## Setup Instructions

### 1. Install Dependencies

Ensure Redis is installed and running (required for Celery):

```bash
# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis
sudo systemctl enable redis

# macOS
brew install redis
brew services start redis
```

### 2. Update Environment Variables

Add to `.env` file:

```bash
REDIS_URL=redis://localhost:6379/0
```

### 3. Start Celery Worker

```bash
cd /home/lnx/Desktop/biggies/v2/backend
source .venv/bin/activate
celery -A celery_app worker --loglevel=info
```

### 4. Start Celery Beat (Scheduler)

In a separate terminal:

```bash
cd /home/lnx/Desktop/biggies/v2/backend
source .venv/bin/activate
celery -A celery_app beat --loglevel=info
```

### 5. Verify Setup

Check Celery Beat schedule:

```bash
celery -A celery_app inspect scheduled
```

Should show:
- `enforce-job-deadlines`: Daily at 00:00 UTC
- `send-daily-job-digest`: Daily at 08:00 UTC
- `send-weekly-job-digest`: Monday at 08:00 UTC

---

## Usage Examples

### Frontend: Create Job Alert

```typescript
// Navigate to /candidate/job-alerts
// Fill in form with criteria
// Click "CREATE ALERT"
```

### Backend: Trigger Manual Deadline Check

```python
from tasks.job_tasks import enforce_job_deadlines

# Run immediately (for testing)
result = enforce_job_deadlines()
print(result)  # {'success': True, 'closed_jobs': 3}
```

### Backend: Manually Check Alerts for a Job

```python
from tasks.job_tasks import check_job_alerts

# Check alerts for specific job
result = check_job_alerts('job-uuid-here')
print(result)  # {'success': True, 'matched_alerts': 2}
```

---

## Testing

### Test Job Alerts

1. **Create an alert** with specific keywords (e.g., "React")
2. **Create a job** that matches those keywords
3. **Check logs** to see if alert was triggered
4. **Verify email** would be sent (check Celery logs)

### Test Deadline Enforcement

1. **Create a job** with `application_deadline` in the past
2. **Run task manually**:
   ```python
   from tasks.job_tasks import enforce_job_deadlines
   enforce_job_deadlines()
   ```
3. **Verify job** status changed to `'closed'`
4. **Check notification** was triggered

### Test Daily/Weekly Digests

1. **Create alerts** with `frequency='daily'` or `frequency='weekly'`
2. **Create matching jobs**
3. **Run task manually**:
   ```python
   from tasks.job_tasks import send_daily_job_digest
   # or
   from tasks.job_tasks import send_weekly_job_digest
   ```
4. **Verify digest** would be sent (check logs)

---

## Monitoring

### Check Celery Worker Status

```bash
celery -A celery_app status
```

### View Scheduled Tasks

```bash
celery -A celery_app inspect scheduled
```

### View Active Tasks

```bash
celery -A celery_app inspect active
```

### View Registered Tasks

```bash
celery -A celery_app inspect registered
```

---

## Troubleshooting

### Issue: Tasks Not Running

**Check:**
1. Redis is running: `redis-cli ping` (should return `PONG`)
2. Celery worker is running
3. Celery beat is running

### Issue: Alerts Not Matching

**Debug:**
```python
from models import Job, JobAlert
from database import get_db

db = get_db()
alert_doc = db.job_alerts.find_one({'id': 'alert-id'})
job_doc = db.jobs.find_one({'id': 'job-id'})

alert = JobAlert.from_mongo(alert_doc)
job = Job.from_mongo(job_doc)

# Test matching
matches = alert.matches_job(job)
print(f"Alert matches job: {matches}")
```

### Issue: Deadlines Not Enforcing

**Check:**
1. Jobs have `application_deadline` set as datetime
2. Celery Beat is running
3. Check Beat schedule: `celery -A celery_app inspect scheduled`

---

## Future Enhancements

- [ ] Add SMS notifications (via Twilio/Africa's Talking)
- [ ] Add in-app notifications
- [ ] Add alert analytics (how many jobs matched, click rates)
- [ ] Add ML-based job recommendations
- [ ] Add alert templates for common searches
- [ ] Add browser push notifications
- [ ] Add deadline warnings (notify 3 days before deadline)
