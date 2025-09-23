#!/bin/bash
# Development setup script

echo "🚀 Setting up PetroDash development environment..."

# Check if git is available
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Configure git hooks
echo "🔧 Setting up git hooks..."
git config core.hooksPath .githooks
echo "✅ Git hooks configured"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
if [ -f package-lock.json ]; then
    npm ci
else
    npm install
fi
cd ..
echo "✅ Backend dependencies installed"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
if [ -f package-lock.json ]; then
    npm ci
else
    npm install
fi
cd ..
echo "✅ Frontend dependencies installed"

# Create environment files from examples
echo "⚙️ Setting up environment files..."

if [ -f backend/env.example ] && [ ! -f backend/.env ]; then
    cp backend/env.example backend/.env
    echo "✅ Backend .env file created from example"
    echo "⚠️  Please edit backend/.env with your configuration"
fi

if [ -f frontend/env.example ] && [ ! -f frontend/.env.local ]; then
    cp frontend/env.example frontend/.env.local
    echo "✅ Frontend .env.local file created from example"
    echo "⚠️  Please edit frontend/.env.local with your configuration"
fi

# Run initial checks
echo "🧪 Running initial tests..."

cd backend
if npm test > /dev/null 2>&1; then
    echo "✅ Backend tests passed"
else
    echo "⚠️  Backend tests failed (this is expected without proper environment configuration)"
fi
cd ..

cd frontend
if npm run type-check > /dev/null 2>&1; then
    echo "✅ Frontend type check passed"
else
    echo "⚠️  Frontend type check failed (this might be expected)"
fi
cd ..

echo ""
echo "🎉 Development environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure your environment variables in backend/.env and frontend/.env.local"
echo "2. Set up your MongoDB database"
echo "3. Start development with: npm run dev (in both backend and frontend directories)"
echo ""
echo "Useful commands:"
echo "- Backend linting: cd backend && npm run lint"
echo "- Frontend linting: cd frontend && npm run lint"
echo "- Code formatting: npm run format (in respective directories)"
echo "- Run tests: npm test (in respective directories)"