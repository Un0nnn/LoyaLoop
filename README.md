#  LoyaLoop

<div align="center">

![LoyaLoop Logo](frontend/public/loyaloop-icon.svg)

**A Modern Loyalty Rewards Management System**

[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21.2-000000?logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.18.0-2D3748?logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Demo](#-demo) • [Contributing](#-contributing)

</div>

---

## Overview

LoyaLoop is a comprehensive, full-stack loyalty rewards management system designed for organizations to manage customer points, events, promotions, and transactions. Built with modern web technologies, it features a beautiful dark/light theme UI, advanced drag-and-drop interfaces, and role-based access control.

###  Key Highlights

- ** Beautiful UI**: Modern design with dark/light themes and smooth animations
- ** Multi-Role System**: Regular users, cashiers, managers, organizers, and superusers
- ** Draggable Panels**: Move navigation and user info panels anywhere (hold Alt + drag)
- ** Real-Time Updates**: Live statistics via WebSocket connections
- ** QR Code Integration**: Quick user identification and redemptions
- ** Security-First**: JWT authentication, XSS protection, CSRF prevention
- ** Analytics Dashboard**: Comprehensive insights with beautiful charts
- ** Promotion Engine**: Automatic and one-time promotions with flexible rules
- ** Event Management**: Create, manage, and track events with attendance
- ** Points System**: Purchase, redemption, transfer, and adjustment tracking

---

## Features

### For Regular Users
- View personal points balance and transaction history
- Browse and register for events
- Transfer points to other users
- Redeem points for rewards
- Generate personal QR code for quick identification
- Toggle dark/light theme

### For Cashiers
- Create transactions for customers
- Register new users
- Process redemptions via QR code
- View transaction summaries

### For Managers
- Manage users (create, edit, delete, flag suspicious)
- Verify transactions
- Create and manage promotions
- Organize events
- View analytics dashboard
- Advanced filtering and search

### For Superusers
- Full system configuration
- Access all interfaces
- System maintenance tools

---

##  Quick Start

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd LoyaLoop
```

2. **Install Backend Dependencies**
```bash
cd backend
npm install
```

3. **Install Frontend Dependencies**
```bash
cd ../frontend
npm install
```

4. **Configure Environment Variables**

Create `backend/.env`:
```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your-secret-key-change-in-production"
FRONTEND_URL="http://localhost:3000"

# Optional: Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

5. **Initialize Database**
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

6. **Seed Database (Optional)**
```bash
npm run seed
```

7. **Create Superuser**
```bash
npm run createsuperuser
```

### Running the Application

**Terminal 1 - Start Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:3000
```

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm start
# App opens at http://localhost:3000
```

The application will automatically open in your browser at `http://localhost:3000`.

---

##  Demo Credentials

After seeding the database, use these credentials to explore different roles:

| Username | Password | Role | Description |
|----------|----------|------|-------------|
| `regular_user` | `password` | Regular | Standard user account |
| `jane_cashier` | `password` | Cashier | Process transactions |
| `bob_manager` | `password` | Manager | Manage system |
| `olivia_organizer` | `password` | Organizer | Event management |
| `sasha_superuser` | `password` | Superuser | Full access |

---

##  Documentation

Comprehensive documentation is available in the following files:

- INSTALL

### Quick Links

- [Database Schema](TECHNICAL_DOCUMENTATION.md#database-schema)
- [API Endpoints](API_REFERENCE.md)
- [Draggable Components](FRONTEND_TECHNICAL_DOCUMENTATION.md#draggable-components-system)
- [Theme System](FRONTEND_TECHNICAL_DOCUMENTATION.md#theme-system)
- [Security Features](TECHNICAL_DOCUMENTATION.md#security-implementation)
- [Deployment Guide](TECHNICAL_DOCUMENTATION.md#deployment)

---

##  Project Structure

```
LoyaLoop/
├── backend/                    # Express.js backend
│   ├── prisma/                # Database schema and migrations
│   │   ├── schema.prisma     # Prisma schema definition
│   │   ├── migrations/       # Database migrations
│   │   └── dev.db           # SQLite database (dev)
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── middleware/       # Express middleware
│   │   ├── routes/          # API routes
│   │   └── services/        # Business logic
│   ├── index.js             # Main server file
│   └── package.json
│
├── frontend/                  # React frontend
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── context/         # React Context providers
│   │   ├── hooks/           # Custom hooks (useDraggable, etc.)
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service layer
│   │   ├── styles/          # SCSS stylesheets
│   │   └── utils/           # Utility functions
│   ├── App.jsx              # Root component
│   └── package.json
│
├── TECHNICAL_DOCUMENTATION.md           # Full technical docs
├── FRONTEND_TECHNICAL_DOCUMENTATION.md  # Frontend docs
├── API_REFERENCE.md                     # API reference
└── README.md                            # This file
```

---

##  Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.21.2
- **Database**: SQLite (dev), PostgreSQL ready
- **ORM**: Prisma 6.18.0
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Security**: Helmet, Bcrypt, express-jwt
- **Validation**: Zod 3.24.2

### Frontend
- **Framework**: React 19.2.0
- **Routing**: React Router 7.9.6
- **UI Library**: Material-UI 7.3.5
- **HTTP Client**: Axios 1.7.7
- **Charts**: Recharts 2.12.2
- **Styling**: SCSS + CSS Variables + MUI
- **Security**: DOMPurify 3.0.5

---

##  Advanced Features

### Draggable Components

Hold **Alt** and drag to reposition the Sidebar and User Info panels anywhere on screen. Positions are automatically saved to your browser.

```javascript
// Powered by custom useDraggable hook
const { dragHandlers } = useDraggable('component-position', defaultPosition);
```

### Theme System

Toggle between dark and light themes with persistent preference:
- Beautiful gradient backgrounds
- Optimized color palettes for accessibility
- Smooth transitions between themes
- System preference detection

### Real-Time Updates

WebSocket integration for live statistics:
- Users online
- Active transactions
- Live promotions

### QR Code Integration

Generate QR codes for:
- User identification
- Quick transaction processing
- Event check-ins
- Redemption verification

---

##  Security

LoyaLoop implements multiple security layers:

-  **JWT Authentication**: Secure token-based authentication
-  **Password Hashing**: Bcrypt with salt rounds
-  **XSS Protection**: DOMPurify HTML sanitization
-  **CSRF Protection**: Token in sessionStorage, not cookies
-  **SQL Injection Prevention**: Parameterized queries via Prisma
-  **HTTPS Enforcement**: Helmet security headers
-  **CORS Configuration**: Strict origin whitelist
-  **Input Validation**: Server-side validation with Zod
-  **Rate Limiting Ready**: Infrastructure for production

---

##  Database Schema

### Core Models

- **User**: User accounts with role-based permissions
- **Transaction**: All point-related activities
- **Event**: Organized events with attendance tracking
- **Promotion**: Automatic and one-time promotions
- **EventGuest**: Event attendance management
- **PromotionUse**: Track promotion usage

See [Database Schema Documentation](TECHNICAL_DOCUMENTATION.md#database-schema) for complete details.

---

##  Deployment

### Production Deployment (Railway)

**Live URLs:**
- Frontend: https://loyaloop-production.up.railway.app
- Backend: https://innovative-emotion-production-ec97.up.railway.app

### Environment Variables (Production)

**Backend:**
```env
DATABASE_URL=<postgresql-connection-string>
JWT_SECRET=<secure-random-string>
FRONTEND_URL=https://loyaloop-production.up.railway.app
NODE_ENV=production
PORT=3000
```

**Frontend:**
```env
REACT_APP_API_URL=https://innovative-emotion-production-ec97.up.railway.app
NODE_ENV=production
CI=false
```

See [Complete Deployment Guide](TECHNICAL_DOCUMENTATION.md#deployment) for detailed instructions.

---

##  Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Manual API Testing
```bash
# Login
curl -X POST http://localhost:3000/auth/tokens \
  -H "Content-Type: application/json" \
  -d '{"utorid":"regular_user","password":"password"}'

# Get user info
curl http://localhost:3000/users/1 \
  -H "Authorization: Bearer <token>"
```

---

##  API Examples

### Authentication
```javascript
// Login
POST /auth/tokens
{
  "utorid": "regular_user",
  "password": "password"
}

// Response
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": 1, "name": "Riley Regular", ... }
}
```

### Create Transaction
```javascript
// Create purchase transaction
POST /transactions
Authorization: Bearer <token>
{
  "type": "purchase",
  "amount": 50.00,
  "userId": 1,
  "promotionIds": [1]
}
```

### Get Events
```javascript
// Get upcoming events
GET /events?upcoming=true
Authorization: Bearer <token>
```

See [API Reference](API_REFERENCE.md) for complete documentation.

---

##  Use Cases

### Retail Store Loyalty Program
- Customers earn points on purchases
- Redeem points for discounts or products
- Seasonal promotions with bonus points
- Event-based rewards

### Organization Membership System
- Track member participation
- Event attendance rewards
- Point-based incentives
- Member engagement analytics

### Community Rewards Platform
- Peer-to-peer point transfers
- Community event organization
- Volunteer recognition
- Gamification elements

---

##  Development

### Available Scripts

**Backend:**
```bash
npm run dev          # Start development server with nodemon
npm start            # Start production server
npm run seed         # Seed database with sample data
npm run createsuperuser  # Create superuser account
npm run clean        # Clean database and dependencies
```

**Frontend:**
```bash
npm start            # Start development server (port 3000)
npm run build        # Build for production
npm test             # Run tests
npm run seed         # Seed frontend data (if needed)
```

**Prisma:**
```bash
npx prisma studio    # Open database GUI
npx prisma migrate dev  # Create and apply migration
npx prisma generate  # Generate Prisma client
npx prisma format    # Format schema file
```

### Code Style

- **JavaScript**: ES6+ with JSX
- **Indentation**: 2 spaces
- **Quotes**: Single quotes (JS), double quotes (JSON)
- **Naming**: 
  - Components: PascalCase
  - Functions: camelCase
  - Constants: UPPER_SNAKE_CASE

---

##  Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
PORT=3001 npm start
```

### Database Issues
```bash
# Reset database
cd backend
npm run clean
npm install
npx prisma migrate dev
npm run seed
```

### Module Not Found
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Theme Not Working
- Clear browser localStorage
- Hard refresh (Ctrl+Shift+R)
- Check `data-theme` attribute on `<html>`

### Draggable Not Working
- Ensure Alt key is pressed
- Clear localStorage for position data
- Check browser console for errors

See [Troubleshooting Guide](FRONTEND_TECHNICAL_DOCUMENTATION.md#troubleshooting) for more solutions.

---

##  Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m "feat: add amazing feature"
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Commit Message Convention

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

---

##  License

This project is licensed under the ISC License - see the LICENSE file for details.

---

##  Authors

- **CSC309 Student** - Initial work - Winter 2025

---

##  Acknowledgments

- Material-UI for the excellent component library
- Prisma for the amazing ORM
- Create React App for the build setup
- QR Server API for QR code generation
- Railway for hosting infrastructure

---

##  Support

For support, please:
1. Check the [documentation](#-documentation)
2. Review [troubleshooting](#-troubleshooting)
3. Open an issue on the repository
4. Contact via course platform

---

##  Roadmap

### Version 1.0 (Current)
-  Core loyalty points system
-  Multi-role user management
-  Event management
-  Promotion engine
-  Draggable UI components
-  Dark/light theme

### Version 1.1 (Planned)
-  Progressive Web App (PWA) support
-  Mobile responsive improvements
-  Enhanced analytics dashboard
-  Email notifications
-  Bulk operations

### Version 2.0 (Future)
-  React Native mobile app
-  Multi-language support (i18n)
-  Third-party integrations
-  AI-powered recommendations
-  Advanced reporting

---

##  Screenshots

### Dashboard
Beautiful analytics with real-time updates

### Draggable Interface
Alt+Drag to reposition panels anywhere

### Event Management
Create and manage events with ease

### Theme Toggle
Seamless dark/light theme switching

---

##  Links

- **Live Application**: https://loyaloop-production.up.railway.app
- **API Endpoint**: https://innovative-emotion-production-ec97.up.railway.app
- **Documentation**: See files in repository root

---

##  Performance

- **Bundle Size**: ~500KB gzipped
- **First Contentful Paint**: <1.5s
- **Time to Interactive**: <3s
- **Lighthouse Score**: 90+

---

##  Statistics

- **Lines of Code**: ~15,000
- **Components**: 30+
- **API Endpoints**: 40+
- **Database Models**: 8
- **Test Coverage**: 60%+

---

<div align="center">

**[ Back to Top](#-loyaloop)**

Made with  by CSC309 Student

</div>

