import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { Documents } from './pages/Documents'
import { Search } from './pages/Search'
import { AIKnowledge } from './pages/AIKnowledge'
import { Approvals } from './pages/Approvals'
import { Reports } from './pages/Reports'
import { ActivityLogs } from './pages/ActivityLogs'
import { Administration } from './pages/Administration'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="documents" element={<Documents />} />
          <Route path="search" element={<Search />} />
          <Route path="ai-knowledge" element={<AIKnowledge />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="reports" element={<Reports />} />
          <Route path="activity-logs" element={<ActivityLogs />} />
          <Route path="administration" element={<Administration />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
