import { createHashRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom'
import AdminRoute from './components/AdminRoute'
import AdminLayout from './components/admin/AdminLayout'
import SellerRoute from './components/SellerRoute'
import SellerLayout from './components/seller/SellerLayout'
import Welcome from './pages/Welcome'
import Login from './pages/Login'
import SellerGeneral from './pages/seller/SellerGeneral'
import SellerCatalog from './pages/seller/SellerCatalog'
import SellerOrders from './pages/seller/SellerOrders'
import SellerProfile from './pages/seller/SellerProfile'
import SellerCompleteProfile from './pages/SellerCompleteProfile'
import RegisterPlan from './pages/RegisterPlan'
import RegisterPayment from './pages/RegisterPayment'
import RegisterForm from './pages/RegisterForm'
import RegisterSuccess from './pages/RegisterSuccess'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import AdminStats from './pages/AdminStats'
import AdminNotifications from './pages/AdminNotifications'
import BuyerJabaLayout from './layouts/BuyerJabaLayout'
import BuyerHome from './pages/buyer/BuyerHome'
import BuyerSelectMunicipality from './pages/buyer/BuyerSelectMunicipality'
import BuyerSelectProvince from './pages/buyer/BuyerSelectProvince'

const router = createHashRouter([
  { path: '/', element: <Welcome /> },
  {
    path: '/comprar',
    element: <BuyerJabaLayout />,
    children: [
      { index: true, element: <BuyerHome /> },
      { path: 'provincia', element: <BuyerSelectProvince /> },
      { path: 'municipio', element: <BuyerSelectMunicipality /> },
    ],
  },
  { path: '/login', element: <Login /> },
  {
    path: '/tienda',
    element: (
      <SellerRoute>
        <SellerLayout />
      </SellerRoute>
    ),
    children: [
      { index: true, element: <SellerGeneral /> },
      { path: 'catalogo', element: <SellerCatalog /> },
      { path: 'pedidos', element: <SellerOrders /> },
      { path: 'perfil', element: <SellerProfile /> },
      { path: 'completar-perfil', element: <SellerCompleteProfile /> },
    ],
  },
  { path: '/registro', element: <RegisterPlan /> },
  { path: '/registro/pago', element: <RegisterPayment /> },
  { path: '/registro/verificacion', element: <RegisterForm /> },
  { path: '/registro/exito', element: <RegisterSuccess /> },
  {
    path: '/admin',
    element: <Outlet />,
    children: [
      { index: true, element: <AdminLogin /> },
      {
        element: (
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        ),
        children: [
          { path: 'estadisticas', element: <AdminStats /> },
          { path: 'solicitudes', element: <AdminDashboard /> },
          { path: 'notificaciones', element: <AdminNotifications /> },
        ],
      },
    ],
  },
  { path: '/admin/inicio', element: <Navigate to="/admin/estadisticas" replace /> },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
