# LoyalLoop - Quick Installation Reference

## For Development (5 minutes)

```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 2. Setup backend
cd backend
echo 'JWT_SECRET="supersecretkey123"' > .env
npx prisma generate && npx prisma migrate dev
npm run seed

# 3. Start servers
# Terminal 1: cd backend && npm start
# Terminal 2: cd frontend && npm start

# 4. Login at http://localhost:3001
# User: superuser / Password123!
```

## For Production (30 minutes)

```bash
# 1. Install system packages
sudo apt update
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx certbot python3-certbot-nginx
npm install -g pm2

# 2. Setup application
cd backend && npm install
cd ../frontend && npm install

# 3. Configure environment
# Edit backend/.env with strong JWT_SECRET
cd frontend && npm run build

# 4. Configure Nginx
# Copy config from INSTALL file section 5.1
sudo nano /etc/nginx/sites-available/loyalloop
sudo ln -s /etc/nginx/sites-available/loyalloop /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 5. Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# 6. Deploy
sudo cp -r frontend/build/* /var/www/loyalloop/
cd backend
pm2 start index.js --name loyalloop-backend -- 3000
pm2 save && pm2 startup

# 7. Open https://yourdomain.com
```

## Key Files
- **INSTALL** - Complete deployment guide (this covers everything)
- **backend/.env** - Backend configuration
- **frontend/.env.production** - Frontend API URL

## Default Credentials (Seed Data)
- Superuser: `superuser` / `Password123!`
- Manager: `manager1` / `Password123!`
- Cashier: `cashier1` / `Password123!`

## Troubleshooting
- Backend logs: `pm2 logs loyalloop-backend`
- Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Test backend: `curl http://localhost:3000/`
- Restart: `pm2 restart loyalloop-backend`

See INSTALL file for complete details!

