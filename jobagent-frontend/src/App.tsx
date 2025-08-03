import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import MainPage from './pages/MainPage'
import CreateDomainPage from './pages/CreateDomainPage'
import MCPToolsPage from './pages/MCPToolsPage'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/LoginPage'
import Navbar from './components/Navbar'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/create-domain" element={<CreateDomainPage />} />
            <Route path="/mcp-tools" element={<MCPToolsPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
