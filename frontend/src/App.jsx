import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import ChatPage from './pages/ChatPage'
import AdminDashboard from './pages/AdminDashboard'
import DocumentsPage from './pages/DocumentsPage'
import MCPPage from './pages/MCPPage'
import Layout from './components/Layout'
import { ThemeProvider } from './context/ThemeContext'

function App() {
  return (
    <ThemeProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/mcp" element={<MCPPage />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  )
}

export default App
