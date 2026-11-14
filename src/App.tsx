import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { PERMISSIONS } from './lib/permissions'
import { Login } from './pages/Login'
import { Profile } from './pages/Profile'
import { Dashboard } from './pages/Dashboard'
import { Documents } from './pages/Documents'
import { CreateDocument } from './pages/CreateDocument'
import { DocumentDetail } from './pages/DocumentDetail'
import { EditDocument } from './pages/EditDocument'
import { VersionDetail } from './pages/VersionDetail'
import { Search } from './pages/Search'
import { Devices } from './pages/Devices'
import { DeviceDetail } from './pages/DeviceDetail'
import { CreateDevice } from './pages/CreateDevice'
import { EditDevice } from './pages/EditDevice'
import { AIKnowledge } from './pages/AIKnowledge'
import { Approvals } from './pages/Approvals'
import { Reports } from './pages/Reports'
import { ActivityLogs } from './pages/ActivityLogs'
import { Administration } from './pages/Administration'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="documents" element={<Documents />} />
          <Route path="documents/create" element={
            <ProtectedRoute requiredPermission={PERMISSIONS.CREATE_DOCUMENTS}>
              <CreateDocument />
            </ProtectedRoute>
          } />
          <Route path="documents/:id" element={<DocumentDetail />} />
          <Route path="documents/:id/edit" element={
            <ProtectedRoute requiredPermission={PERMISSIONS.EDIT_OWN_DOCUMENTS}>
              <EditDocument />
            </ProtectedRoute>
          } />
          <Route path="documents/:id/versions/:versionId" element={<VersionDetail />} />
          <Route path="devices" element={
            <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_DEVICES}>
              <Devices />
            </ProtectedRoute>
          } />
          <Route path="devices/create" element={
            <ProtectedRoute requiredPermission={PERMISSIONS.MANAGE_DEVICES}>
              <CreateDevice />
            </ProtectedRoute>
          } />
          <Route path="devices/:id" element={
            <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_DEVICES}>
              <DeviceDetail />
            </ProtectedRoute>
          } />
          <Route path="devices/:id/edit" element={
            <ProtectedRoute requiredPermission={PERMISSIONS.MANAGE_DEVICES}>
              <EditDevice />
            </ProtectedRoute>
          } />
          <Route path="search" element={
            <ProtectedRoute requiredPermission={PERMISSIONS.SEARCH_KNOWLEDGE}>
              <Search />
            </ProtectedRoute>
          } />
          <Route path="ai-knowledge" element={
            <ProtectedRoute requiredPermission={PERMISSIONS.USE_AI_ASSISTANT}>
              <AIKnowledge />
            </ProtectedRoute>
          } />
          <Route path="approvals" element={
            <ProtectedRoute requiredPermission={PERMISSIONS.REVIEW_DOCUMENTS}>
              <Approvals />
            </ProtectedRoute>
          } />
          <Route path="reports" element={
            <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_TEAM_REPORTS}>
              <Reports />
            </ProtectedRoute>
          } />
          <Route path="activity-logs" element={
            <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_AUDIT_LOGS}>
              <ActivityLogs />
            </ProtectedRoute>
          } />
          <Route path="administration" element={
            <ProtectedRoute requiredPermission={PERMISSIONS.MANAGE_USERS}>
              <Administration />
            </ProtectedRoute>
          } />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
