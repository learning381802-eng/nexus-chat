import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store'
import { SocketProvider } from './context/SocketContext'
import AuthPage from './components/Auth/AuthPage'
import AppLayout from './components/AppLayout'

function PrivateRoute({ children }) {
  const { token } = useAuthStore()
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { token } = useAuthStore()

  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: '#313338', color: '#DBDEE1', border: '1px solid #404249' },
          success: { iconTheme: { primary: '#57F287', secondary: '#313338' } },
          error: { iconTheme: { primary: '#ED4245', secondary: '#313338' } },
        }}
      />
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/channels/@me" /> : <AuthPage mode="login" />} />
        <Route path="/register" element={token ? <Navigate to="/channels/@me" /> : <AuthPage mode="register" />} />
        <Route path="/channels/*" element={
          <PrivateRoute>
            <SocketProvider>
              <AppLayout />
            </SocketProvider>
          </PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/channels/@me" />} />
      </Routes>
    </>
  )
}
