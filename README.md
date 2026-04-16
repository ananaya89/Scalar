# 📋 TaskFlow - Premium Project Management Application

> A polished, full-featured Trello-style project management platform built with modern web technologies. Manage your projects, organize tasks, collaborate with teams, and track progress with an intuitive drag-and-drop interface.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-ISC-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)

---

## 🎯 Project Overview

TaskFlow is a premium project management application designed to help teams organize, collaborate, and manage their projects efficiently. Inspired by Trello's intuitive interface, it provides a comprehensive suite of features for task management, including boards, lists, cards, labels, and team collaboration tools.

### Key Highlights
- ✅ **Full-featured board management** with drag-and-drop functionality
- ✅ **Rich card details** with descriptions, due dates, members, and checklists
- ✅ **Advanced search and filtering** capabilities
- ✅ **Flexible database support** (MongoDB Atlas or PostgreSQL)
- ✅ **Production-ready** with Vercel deployment support
- ✅ **Cloud-optimized** with automatic data seeding

---

## 🏗️ Technology Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18.3+ | UI framework |
| **Vite** | 6.4+ | Build tool & dev server |
| **React Router** | 7.1+ | Client-side routing |
| @hello-pangea/dnd | 17.0+ | Drag-and-drop library |
| **CSS3** | - | Custom styling (Trello-inspired) |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 20.0+ | Runtime environment |
| **Express** | 4.21+ | Web framework |
| **Mongoose** | 8.18+ | MongoDB ODM |
| **PostgreSQL Driver** | 8.20+ | Database connector |
| **CORS** | 2.8+ | Cross-origin resource sharing |
| **dotenv** | 16.4+ | Environment variable management |

### Database Options
- **MongoDB Atlas** (Recommended for production)
- **PostgreSQL** (Alternative/fallback)

---

## ✨ Features

### Board Management
- 📌 Create, edit, and delete boards
- 🎨 Customize board backgrounds and settings
- ⭐ Mark boards as favorites for quick access
- 📚 Browse recent and pinned boards
- 📋 Board templates for quick setup

### List & Card Organization
- 📇 Organize cards into multiple lists
- 🎯 Drag and drop cards between lists (smooth animations)
- 🔄 Reorder lists and cards with intuitive interface
- 🏷️ Label management and card filtering by labels
- 🔖 Multi-label support per card

### Card Details & Collaboration
- 📝 Rich card descriptions
- 📅 Due date tracking with visual indicators
- 👥 Assign members to cards
- ✓ Checklists with progress tracking
- 💬 Activity tracking
- 🔍 Detailed card view modal

### Search & Filtering
- 🔎 Full-text search across all boards
- 🎯 Filter cards by labels, members, and keywords
- 📈 Advanced filtering options

### User Management
- 👤 Member profiles
- 📊 Team collaboration
- 🔐 Secure access

---

## 📁 Project Structure

```
taskflow-premium/
├── client/                          # Frontend React Application
│   ├── src/
│   │   ├── components/              # React components
│   │   │   ├── AddListForm.jsx
│   │   │   ├── Board.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── CardDetailModal.jsx
│   │   │   ├── FilterPopover.jsx
│   │   │   └── List.jsx
│   │   ├── pages/                   # Page components
│   │   │   ├── BoardPage.jsx
│   │   │   └── HomePage.jsx
│   │   ├── utils/
│   │   │   └── ui.js
│   │   ├── api/
│   │   │   └── index.js             # API client
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── vercel.json                  # Vercel config (SPA rewrites)
│   ├── vite.config.js               # Vite configuration
│   └── package.json
│
├── server/                          # Node.js/Express Backend
│   ├── api/
│   │   └── index.js                 # Vercel serverless entry point
│   ├── routes/                      # RESTful API routes (generic)
│   │   ├── boards.js
│   │   ├── cards.js
│   │   ├── lists.js
│   │   ├── members.js
│   │   └── search.js
│   ├── routes-mongo/                # MongoDB-specific routes
│   │   ├── boards.js
│   │   ├── cards.js
│   │   ├── lists.js
│   │   ├── members.js
│   │   └── search.js
│   ├── routes-pg/                   # PostgreSQL-specific routes
│   │   ├── boards.js
│   │   ├── cards.js
│   │   ├── lists.js
│   │   ├── members.js
│   │   └── search.js
│   ├── database/                    # Database abstraction layer
│   │   └── index.js                 # Provider selection logic
│   ├── app.js                       # Express application setup
│   ├── db.js                        # Database initialization
│   ├── mongo-db.js                  # MongoDB provider
│   ├── pg-db.js                     # PostgreSQL provider
│   ├── seed-data.js                 # Sample data
│   ├── .env.example                 # Environment template
│   └── package.json
│
├── package.json                     # Root package (monorepo scripts)
├── .gitignore
├── VERCEL_DEPLOYMENT_STEPS.md       # Deployment guide
└── README.md                        # This file
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 (or yarn)
- **Git** for version control
- MongoDB Atlas account (or local MongoDB/PostgreSQL)

### Local Development Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/taskflow-premium.git
cd taskflow-premium
```

#### 2. Install Dependencies
```bash
npm run install-all
```

This command installs dependencies for:
- Root directory
- `client/` directory
- `server/` directory

#### 3. Configure Environment Variables

**Backend Configuration:**
```bash
# Copy the example file
cp server/.env.example server/.env
```

Then edit `server/.env`:

**Option A: MongoDB Atlas (Recommended)**
```env
DB_PROVIDER=mongodb
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?appName=Cluster0
```

**Option B: PostgreSQL**
```env
DB_PROVIDER=postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/taskflow
```

#### 4. Start Development Servers
```bash
npm run dev
```

This starts both frontend and backend concurrently:
- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend**: http://localhost:5000 (Express server)

#### 5. Verify Setup
- Open http://localhost:5173 in your browser
- Create a board to verify the API connection
- Check browser console (F12) for any errors

---

## 🗄️ Database Configuration

### MongoDB Atlas (Production)

Best for cloud deployments and scalability.

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster and database
3. Generate connection string for your application user
4. Set `MONGODB_URI` in `.env`

**Advantages:**
- Cloud-hosted, no maintenance required
- Automatic backups
- Built-in scaling
- Free tier available

### PostgreSQL (Alternative)

Suitable for on-premises or traditional deployments.

1. Install PostgreSQL locally or use a managed service
2. Create database: `taskflow`
3. Set `DATABASE_URL` with your connection string
4. Run database migrations (if applicable)

**Advantages:**
- Mature RDBMS
- Strong data integrity
- ACID compliance
- Widely supported

### Database Selection Logic

The server auto-selects based on environment variables (in order):

1. If `DB_PROVIDER=mongodb` → MongoDB
2. If `DB_PROVIDER=postgres` → PostgreSQL
3. If `MONGODB_URI` is set → MongoDB
4. If `DATABASE_URL` is set → PostgreSQL
5. Otherwise → Error (config required)

---

## 📡 API Documentation

### Base URL
Development: `http://localhost:5000/api`
Production: `https://your-backend.vercel.app/api`

### Board Endpoints

```http
GET /api/boards                    # List all boards
POST /api/boards                   # Create new board
GET /api/boards/:id                # Get board details
PUT /api/boards/:id                # Update board
DELETE /api/boards/:id             # Delete board
PUT /api/boards/:id/labels/:labelId  # Update label
```

### List Endpoints

```http
POST /api/lists                    # Create new list
PUT /api/lists/:id                 # Update list
DELETE /api/lists/:id              # Delete list
PUT /api/lists/reorder             # Reorder lists
```

### Card Endpoints

```http
POST /api/cards                    # Create new card
GET /api/cards/:id                 # Get card details
PUT /api/cards/:id                 # Update card
DELETE /api/cards/:id              # Delete card
PUT /api/cards/reorder             # Reorder cards
```

### Card Labels

```http
POST /api/cards/:id/labels         # Add label to card
DELETE /api/cards/:id/labels/:labelId  # Remove label
```

### Card Members

```http
POST /api/cards/:id/members        # Assign member
DELETE /api/cards/:id/members/:memberId  # Remove member
```

### Card Checklists

```http
POST /api/cards/:id/checklists     # Create checklist
DELETE /api/cards/checklists/:id   # Delete checklist
POST /api/cards/checklists/:checklistId/items  # Add checkbox item
PUT /api/cards/checklist-items/:id # Update checkbox item
DELETE /api/cards/checklist-items/:id  # Delete checkbox item
```

### Search & Filter

```http
GET /api/boards/:boardId/search?q=query     # Search cards
GET /api/boards/:boardId/cards/filter       # Filter cards
GET /api/members                             # List members
GET /api/health                              # Health check
```

---

## 🚢 Deployment

### Vercel Deployment (Recommended)

For detailed step-by-step instructions, see [VERCEL_DEPLOYMENT_STEPS.md](./VERCEL_DEPLOYMENT_STEPS.md)

#### Quick Summary:
1. Push code to GitHub
2. Create backend project in Vercel (Root: `server`)
3. Set environment variables for database
4. Create frontend project in Vercel (Root: `client`)
5. Set `VITE_API_BASE` to your backend URL
6. Deploy both projects

#### Deployment URLs:
- **Backend**: `https://your-backend.vercel.app`
- **Frontend**: `https://your-frontend.vercel.app`

### Health Check
```bash
curl https://your-backend.vercel.app/api/health
```

---

## 🛠️ Development Commands

### Root Level Scripts
```bash
npm run install-all          # Install all dependencies
npm run dev                  # Start both frontend and backend
npm run server               # Run only backend
npm run client               # Run only frontend
```

### Frontend Scripts
```bash
cd client
npm run dev                  # Start Vite dev server
npm run build                # Build for production
npm run preview              # Preview production build
```

### Backend Scripts
```bash
cd server
npm start                    # Start server with Node
npm run dev                  # Start with auto-reload (watch mode)
```

---

## 🔍 Troubleshooting

### Issue: Port Already in Use
**Problem**: `Error: listen EADDRINUSE: address already in use :::5000`

**Solution**:
```bash
# Find and kill the process
lsof -i :5000  # Get PID
kill -9 <PID>  # Kill process

# Or use different port
PORT=5001 npm run server
```

### Issue: Database Connection Error
**Problem**: `Error: No database configuration found`

**Solution**:
- Verify `.env` file exists in `server/` directory
- Check `MONGODB_URI` or `DATABASE_URL` is correct
- Test connection string in MongoDB Atlas / PostgreSQL

### Issue: Frontend Cannot Reach Backend
**Problem**: API calls fail with CORS errors

**Solution**:
- Check `VITE_API_BASE` environment variable
- Verify backend is running on expected port
- Check browser console for actual endpoint being called

### Issue: Module Not Found
**Problem**: `Cannot find package 'dotenv'`

**Solution**:
```bash
cd server
npm install
```

---

## 📝 Environment Variables Reference

### Backend (.env)
| Variable | Required | Example |
|----------|----------|---------|
| `DB_PROVIDER` | Yes | `mongodb` or `postgres` |
| `MONGODB_URI` | If MongoDB | `mongodb+srv://user:pass@cluster.net/db` |
| `DATABASE_URL` | If PostgreSQL | `postgresql://user:pass@localhost:5432/taskflow` |
| `PORT` | No | `5000` (default) |

### Frontend (.env)
| Variable | Required | Example |
|----------|----------|---------|
| `VITE_API_BASE` | No | `http://localhost:5000/api` |

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **ISC License** - see LICENSE file for details.

---

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation in VERCEL_DEPLOYMENT_STEPS.md
- Review API endpoints in this README

---

## 🎉 Acknowledgments

- Trello for UI/UX inspiration
- React and Vite communities
- MongoDB and PostgreSQL teams
- All contributors and users

---

**Last Updated**: April 2026
**Version**: 1.0.0
**Status**: ✅ Production Ready
- The active Postgres route files were also corrected so reorder/checklist utility routes are no longer shadowed by `/:id` handlers.
