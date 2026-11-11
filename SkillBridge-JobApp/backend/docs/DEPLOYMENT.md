# SkillBridge Backend - Deployment Guide

## Production Deployment Options

### Option 1: AWS Deployment

#### Prerequisites
- AWS Account
- AWS CLI configured
- Domain name (optional)

#### Services Used
- **EC2**: Application server
- **RDS**: PostgreSQL database
- **DocumentDB**: MongoDB-compatible database
- **ElastiCache**: Redis
- **S3**: File storage
- **ECS/EKS**: Container orchestration (optional)

#### Step-by-Step

1. **Create RDS PostgreSQL Instance**
```bash
aws rds create-db-instance \
    --db-instance-identifier skillbridge-db \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --master-username skillbridge \
    --master-user-password YourSecurePassword \
    --allocated-storage 20
```

2. **Create ElastiCache Redis Cluster**
```bash
aws elasticache create-cache-cluster \
    --cache-cluster-id skillbridge-redis \
    --cache-node-type cache.t3.micro \
    --engine redis \
    --num-cache-nodes 1
```

3. **Launch EC2 Instance**
```bash
# Use Ubuntu 22.04 LTS AMI
# t3.medium or larger recommended
# Configure security groups for ports: 22, 80, 443, 5000
```

4. **Setup on EC2**
```bash
# SSH into instance
ssh ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Python
sudo apt install python3.9 python3.9-venv python3-pip -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Nginx
sudo apt install nginx -y

# Clone repository
git clone https://github.com/yourusername/skillbridge.git
cd skillbridge/backend

# Setup environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# Configure .env with production values
cp .env.example .env
nano .env
# Update DATABASE_URL, MONGODB_URI, REDIS_URL, etc.

# Run Qdrant
docker run -d -p 6333:6333 \
    -v /home/ubuntu/qdrant_storage:/qdrant/storage \
    --restart always \
    --name qdrant \
    qdrant/qdrant

# Initialize databases
flask db upgrade
python scripts/init_qdrant.py
```

5. **Setup Systemd Services**

Create `/etc/systemd/system/skillbridge.service`:
```ini
[Unit]
Description=SkillBridge Flask Application
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/skillbridge/backend
Environment="PATH=/home/ubuntu/skillbridge/backend/venv/bin"
ExecStart=/home/ubuntu/skillbridge/backend/venv/bin/gunicorn \
    --bind 0.0.0.0:5000 \
    --workers 4 \
    --timeout 120 \
    --access-logfile /var/log/skillbridge/access.log \
    --error-logfile /var/log/skillbridge/error.log \
    wsgi:app

[Install]
WantedBy=multi-user.target
```

Create `/etc/systemd/system/skillbridge-celery.service`:
```ini
[Unit]
Description=SkillBridge Celery Worker
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/skillbridge/backend
Environment="PATH=/home/ubuntu/skillbridge/backend/venv/bin"
ExecStart=/home/ubuntu/skillbridge/backend/venv/bin/celery \
    -A celery_app worker --loglevel=info

[Install]
WantedBy=multi-user.target
```

Enable and start services:
```bash
sudo mkdir -p /var/log/skillbridge
sudo chown ubuntu:ubuntu /var/log/skillbridge

sudo systemctl daemon-reload
sudo systemctl enable skillbridge skillbridge-celery
sudo systemctl start skillbridge skillbridge-celery
```

6. **Configure Nginx**

Create `/etc/nginx/sites-available/skillbridge`:
```nginx
server {
    listen 80;
    server_name api.skillbridge.co.ke;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Increase timeouts for file uploads
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    client_max_body_size 16M;
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/skillbridge /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

7. **SSL with Let's Encrypt**
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.skillbridge.co.ke
```

### Option 2: Docker Deployment

#### Using Docker Compose

1. **Update docker-compose.yml for production**
```yaml
# Update environment variables
# Use secrets management
# Configure volume mounts
```

2. **Deploy**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Option 3: Heroku Deployment

1. **Install Heroku CLI**
```bash
curl https://cli-assets.heroku.com/install.sh | sh
```

2. **Create Heroku App**
```bash
heroku login
heroku create skillbridge-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Add Redis
heroku addons:create heroku-redis:hobby-dev

# Add MongoDB (mLab)
heroku addons:create mongolab:sandbox
```

3. **Configure Environment**
```bash
heroku config:set FLASK_ENV=production
heroku config:set SECRET_KEY=your-secret-key
heroku config:set GOOGLE_API_KEY=your-gemini-key
# ... other config vars
```

4. **Create Procfile**
```
web: gunicorn wsgi:app
worker: celery -A celery_app worker --loglevel=info
```

5. **Deploy**
```bash
git push heroku main
heroku run python scripts/init_qdrant.py
heroku run flask db upgrade
```

## Environment Variables for Production

Required:
```bash
FLASK_ENV=production
DEBUG=False
SECRET_KEY=<strong-random-key>
JWT_SECRET_KEY=<strong-random-key>
DATABASE_URL=<production-postgres-url>
MONGODB_URI=<production-mongo-url>
REDIS_URL=<production-redis-url>
GOOGLE_API_KEY=<your-gemini-api-key>
QDRANT_HOST=<qdrant-host>
```

## Security Checklist

- [ ] Use strong SECRET_KEY and JWT_SECRET_KEY
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up firewall rules
- [ ] Use environment variables for secrets
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Regular security updates
- [ ] Database backups
- [ ] Use CDN for static files

## Monitoring

### Application Monitoring

**Using New Relic:**
```bash
pip install newrelic
newrelic-admin generate-config YOUR_LICENSE_KEY newrelic.ini
```

Run with New Relic:
```bash
NEW_RELIC_CONFIG_FILE=newrelic.ini newrelic-admin run-program gunicorn wsgi:app
```

### Log Aggregation

**Using CloudWatch:**
```bash
# Install CloudWatch agent
sudo apt install amazon-cloudwatch-agent

# Configure log streaming
```

## Backup Strategy

### Database Backups

**PostgreSQL:**
```bash
# Automated daily backups
0 2 * * * pg_dump skillbridge > /backups/skillbridge_$(date +\%Y\%m\%d).sql
```

**MongoDB:**
```bash
# Automated daily backups
0 2 * * * mongodump --uri="mongodb://localhost:27017/skillbridge" --out=/backups/mongo_$(date +\%Y\%m\%d)
```

### Qdrant Backups
```bash
# Backup Qdrant storage
0 2 * * * tar -czf /backups/qdrant_$(date +\%Y\%m\%d).tar.gz /path/to/qdrant_storage
```

## Scaling

### Horizontal Scaling

1. **Load Balancer**: Use AWS ALB or Nginx
2. **Multiple App Instances**: Run multiple Gunicorn workers
3. **Celery Workers**: Scale workers based on queue size
4. **Database**: Use read replicas

### Vertical Scaling

1. **Increase EC2 instance size**
2. **Upgrade RDS instance**
3. **Add more Gunicorn workers**

## CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Deploy to EC2
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /home/ubuntu/skillbridge/backend
            git pull
            source venv/bin/activate
            pip install -r requirements.txt
            flask db upgrade
            sudo systemctl restart skillbridge skillbridge-celery
```

## Troubleshooting

### High Memory Usage
- Increase server RAM
- Reduce Gunicorn workers
- Optimize database queries

### Slow API Responses
- Add database indexes
- Implement caching with Redis
- Use CDN for static assets

### Celery Task Failures
- Check Redis connection
- Increase task timeout
- Monitor worker logs

## Maintenance

### Regular Tasks

- **Daily**: Monitor error logs
- **Weekly**: Review performance metrics
- **Monthly**: Update dependencies
- **Quarterly**: Security audit

## Support

For production issues:
- Check logs: `/var/log/skillbridge/`
- Monitor services: `systemctl status skillbridge`
- Database health: Check RDS/DocumentDB metrics
- API health: `curl https://api.skillbridge.co.ke/health`
