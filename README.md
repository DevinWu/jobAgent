# JobAgent - Job Failure Diagnosis Platform

A comprehensive web-based platform for analyzing and troubleshooting failed jobs through configurable diagnostic workflows. The system enables organizations to centralize diagnostic knowledge, automate failure analysis through external tool integration, and maintain quality control through an admin review process.

## 🏗️ Project Architecture

JobAgent is a full-stack application with three main components:

- **Backend**: FastAPI-based Python web server with SQLAlchemy ORM
- **React Frontend**: Modern React + TypeScript + Vite application
- **Vue Frontend**: Alternative Vue 3 + TypeScript + Element Plus interface
- **Database**: SQLite (development) / PostgreSQL (production)

## 👥 User Types

The platform serves three primary user types:

- **End Users**: Analysts who diagnose job failures by selecting diagnostic domains and providing job IDs
- **Domain Creators**: Technical users who design and publish diagnostic workflows ("domains")
- **Administrators**: Users who review and approve newly created diagnostic tools (MCP Tools)

## 🚀 Key Features

- **Job Analysis**: Automated failure diagnosis with categorized results (unknown, userInputError, ThirdPlatformError, PlatformError)
- **Domain Management**: Visual flow designer for creating diagnostic workflows
- **MCP Tool Lifecycle**: Creation, testing, and publication of external diagnostic tools
- **Admin Review Process**: Quality control with commenting and approval workflows
- **User Authentication**: Role-based access control with JWT tokens
- **Caching System**: Avoids redundant processing of previously analyzed jobs

## 📁 Project Structure

```
jobAgent/
├── README.md                     # This file
├── .gitignore                    # Git ignore patterns
├── doc/                          # Project documentation
│   └── dev/
│       └── devinPromote.md      # Comprehensive system documentation
├── jobagent-backend/            # FastAPI Python backend
│   ├── README.md                # Backend-specific documentation
│   ├── pyproject.toml           # Poetry dependency management
│   ├── poetry.lock              # Locked dependencies
│   ├── jobagent.db              # SQLite database (development)
│   ├── app/                     # Main application code
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application entry point
│   │   ├── database.py          # Database configuration
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── crud.py              # Database operations
│   │   ├── auth.py              # Authentication logic
│   │   └── routers/             # API route handlers
│   │       ├── auth.py          # Authentication endpoints
│   │       ├── domains.py       # Domain management endpoints
│   │       ├── mcp_tools.py     # MCP tool endpoints
│   │       └── job_analysis.py  # Job analysis endpoints
│   └── tests/                   # Test files
└── jobagent-frontend/       # Vue 3 + TypeScript frontend
    ├── package.json             # npm dependencies and scripts
    ├── package-lock.json        # Locked npm dependencies
    ├── index.html               # HTML entry point
    ├── vite.config.ts           # Vite configuration
    ├── tsconfig.json            # TypeScript configuration
    └── src/                     # Vue source code
```

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI with uvicorn
- **Database**: SQLAlchemy ORM with SQLite (dev) / PostgreSQL (prod)
- **Authentication**: JWT tokens with bcrypt password hashing
- **Package Management**: Poetry
- **Code Quality**: black (formatting), isort (import sorting), pytest (testing)
- **Environment**: python-dotenv for configuration

### Vue Frontend
- **Framework**: Vue 3 with TypeScript
- **Build Tool**: Vite 7
- **UI Library**: Element Plus with icons
- **State Management**: Pinia
- **Routing**: Vue Router 4
- **HTTP Client**: Axios
- **Flow Designer**: Vue Flow for visual workflow creation

## 🚀 Local Development Setup

### Prerequisites

- **Python**: 3.12 or higher
- **Node.js**: 18 or higher
- **Poetry**: For Python dependency management
- **npm/yarn**: For frontend dependency management

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd jobagent-backend
   ```

2. **Install Poetry** (if not already installed):
   ```bash
   curl -sSL https://install.python-poetry.org | python3 -
   ```

3. **Install dependencies**:
   ```bash
   poetry install
   ```

4. **Activate virtual environment**:
   ```bash
   poetry shell
   ```

5. **Set up database** (SQLite is used by default):
   ```bash
   # Database will be created automatically when you run the server
   # Located at: ./jobagent.db
   ```

6. **Start the development server**:
   ```bash
   poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   The backend API will be available at: `http://localhost:8000`
   API documentation: `http://localhost:8000/docs`


### Frontend Setup

1. **Navigate to Vue frontend directory**:
   ```bash
   cd jobagent-frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

   The Vue frontend will be available at: `http://localhost:5174`

4. **Build for production**:
   ```bash
   npm run build
   # or
   yarn build
   ```

## 🔧 Development Workflow

### Running All Components

1. **Start the backend** (Terminal 1):
   ```bash
   cd jobagent-backend
   poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Start Vue frontend** (Terminal 3, optional):
   ```bash
   cd jobagent-vue-frontend
   npm run dev
   ```

### Default Ports

- **Backend API**: `http://localhost:8000`
- **Vue Frontend**: `http://localhost:5174`
- **API Documentation**: `http://localhost:8000/docs`

### Code Quality

**Backend**:
```bash
cd jobagent-backend
poetry run black .          # Format code
poetry run isort .          # Sort imports
poetry run pytest          # Run tests
```

**Frontend**:
```bash
cd jobagent-frontend
npm run build              # Type check and build
```

## 🗄️ Database Schema

The application uses SQLAlchemy models with the following main entities:

- **Users**: User accounts with role-based access (regular, creator, admin)
- **Domains**: Diagnostic workflow configurations with JSON flow definitions
- **MCPTools**: External diagnostic tool definitions with parameters
- **JobAnalyses**: Cached analysis results for job failures

## 🔑 Environment Configuration

### Backend Environment Variables

Create a `.env` file in the `jobagent-backend` directory:

```env
# Database (optional, defaults to SQLite)
DATABASE_URL=sqlite:///./jobagent.db

# Authentication
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Development
DEBUG=true
```

### Frontend Configuration

The frontends are configured to connect to the backend at `http://localhost:8000` by default. Update the API base URL in the respective frontend configurations if needed.

## 📚 API Documentation

Once the backend is running, visit `http://localhost:8000/docs` for interactive API documentation powered by FastAPI's automatic OpenAPI generation.

### Key API Endpoints

- **Authentication**: `/auth/register`, `/auth/login`
- **Domains**: `/domains/` (CRUD operations)
- **MCP Tools**: `/mcp-tools/` (CRUD operations)
- **Job Analysis**: `/job-analysis/diagnose`
- **Admin**: `/admin/mcp-tools/review`

## 🧪 Testing

### Backend Testing
```bash
cd jobagent-backend
poetry run pytest
```

### Frontend Testing
```bash
cd jobagent-frontend
npm test
```

## 🚀 Production Deployment

### Backend
- Configure PostgreSQL database
- Set production environment variables
- Use a production WSGI server like Gunicorn
- Set up proper authentication secrets

### Frontend
- Build the application: `npm run build`
- Serve the `dist` folder with a web server
- Configure API endpoints for production backend

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -am 'Add some feature'`
5. Push to the branch: `git push origin feature/your-feature-name`
6. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 📞 Support

For questions or support, please refer to the comprehensive documentation in `doc/dev/devinPromote.md` or contact the development team.
