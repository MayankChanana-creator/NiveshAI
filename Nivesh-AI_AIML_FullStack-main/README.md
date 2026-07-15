# ArthSaarthi Fintech (NiveshAI)

ArthSaarthi is a comprehensive financial technology platform designed to provide users with a unified dashboard for managing and analyzing their investment portfolio across multiple asset classes, including stocks, mutual funds, and cryptocurrencies. The platform integrates advanced AI capabilities to provide personalized financial insights, risk assessments, and educational tools.

## Technical Architecture

The project is built using a modern decoupled architecture consisting of a high-performance frontend and a specialized financial backend.

### Frontend
- Framework: Next.js 15
- Styling: Tailwind CSS, Framer Motion
- Authentication: Auth0
- Data Visualization: Recharts, OGL
- State Management: React Context API

### Backend
- Framework: FastAPI (Python)
- Database: SQLite (Primary), MongoDB (Optional support)
- Financial Data: Yahoo Finance (yfinance)
- Machine Learning: Scikit-learn (Behavioral modeling)
- Media Generation: MoviePy, gTTS (Audio/Video insights)

### AI Integration
- Models: OpenAI GPT-4o, Google Gemini 2.0 (via OpenRouter)
- Features: Investment report generation, automated fund summarization, multilingual financial chatbot (AI Dost)

## Prerequisites

Ensure the following software is installed on your system before proceeding with the setup:

- Node.js (Version 18.0.0 or higher)
- Python (Version 3.9 or higher)
- npm (Node Package Manager)
- Git (Optional, for version control)

## Installation and Setup

Follow these steps to set up the project on a local machine.

### 1. Repository Preparation
Extract the project files or clone the repository to your local directory.
```bash
cd ArthSaarthi-Fintech
```

### 2. Frontend Configuration
Install the required Node.js dependencies and configure the environment variables.
```bash
# Install dependencies
npm install

# Create environment file
touch .env
```
Open the `.env` file and populate it with the following required keys:
```text
AUTH0_SECRET=your_auth0_secret
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=your_auth0_issuer_url
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key
```

### 3. Backend Configuration
Navigate to the backend directory, create a virtual environment, and install the Python dependencies.
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Create backend environment file
touch .env
```
Populate the `backend/.env` file:
```text
PORT=8000
MONGODB_URI=your_mongodb_uri (Optional)
JWT_SECRET=your_jwt_secret
ASI_API_KEY=your_asi_api_key
```

## Running the Application

Both the backend and frontend servers must be running concurrently for the application to function correctly.

### Start Backend Server
From the `backend` directory (with the virtual environment activated):
```bash
uvicorn main:app --reload --port 8000
```
The API documentation will be available at `http://127.0.0.1:8000/docs`.

### Start Frontend Server
From the root directory:
```bash
npm run dev
```
The application will be accessible at `http://localhost:3000`.

## Project Structure

- /app: Next.js pages and application routes.
- /components: Reusable React components.
- /public: Static assets (images, logos).
- /backend: FastAPI application, routers, and data models.
- /backend/routers: Domain-specific API endpoints (stocks, crypto, portfolio).
- /backend/Generation: Scripts for AI-driven asset generation (images, voice, video).

## Key Features

1. Unified Dashboard: Real-time tracking of Stocks, Mutual Funds, and Cryptocurrency.
2. AI Dost: A multilingual financial assistant powered by GPT-4 and Gemini for answering user queries.
3. Sandbox Environment: A risk-free trading terminal with behavioral analysis to help users learn trading strategies.
4. Professional Reports: AI-generated investment summaries and performance reports in PDF format.
5. Multilingual Support: Localized interface and AI responses for diverse regional user bases.

## Maintenance and Updates

### Adding New Dependencies
- Frontend: `npm install <package-name>`
- Backend: `pip install <package-name>` followed by `pip freeze > requirements.txt`

### Database Management
By default, the application uses local SQLite databases found in the `backend` folder (`portfolio.db`, `sandbox.db`, `tradeverse.db`). For production scaling, configure the `MONGODB_URI` in the backend environment variables.
