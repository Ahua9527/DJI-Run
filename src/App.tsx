// src/App.tsx
import DJIUploader from './components/DJIUploader'
import PWAUpdatePrompt from './components/PWAUpdatePrompt'
import { ThemeProvider } from './context/ThemeContext'

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <DJIUploader />
        <PWAUpdatePrompt />
      </div>
    </ThemeProvider>
  )
}

export default App