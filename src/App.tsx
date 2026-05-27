import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { applyTheme, storeTheme } from '@/styles/theme/dark-mode'

function App() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark'
    storeTheme(next)
    applyTheme(next)
    setIsDark(!isDark)
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Cash Control</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={toggleTheme} className="w-full">
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default App
