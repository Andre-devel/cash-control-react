import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { applyTheme, storeTheme } from '@/styles/theme/dark-mode'

function App() {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.getAttribute('data-theme') === 'dark',
  )

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark'
    storeTheme(next)
    applyTheme(next)
    setIsDark(!isDark)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-4">
      <div className="card" style={{ width: '100%', maxWidth: 360 }}>
        <div className="card-h">
          <h3>Cash Control</h3>
        </div>
        <div className="card-b">
          <Button onClick={toggleTheme} className="w-full">
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default App
