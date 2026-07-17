import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { EventConfigPage } from './pages/EventConfigPage'
import { CheckinPage } from './pages/CheckinPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/events/:eventId" element={<EventConfigPage />} />
        <Route path="/events/:eventId/pointage" element={<CheckinPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
