import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom'
import AdminAuthenticatedLayout from './components/admin/AdminAuthenticatedLayout'
import RouteError from './components/RouteError'
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
import AdminSettings from './pages/AdminSettings'
import BuyerJabaLayout from './layouts/BuyerJabaLayout'
import BuyerHome from './pages/buyer/BuyerHome'
import BuyerSelectMunicipality from './pages/buyer/BuyerSelectMunicipality'
import BuyerSelectProvince from './pages/buyer/BuyerSelectProvince'
import PublicStoreRoute from './components/buyer/PublicStoreRoute'
import RedirectLegacyStoreRoute from './components/buyer/RedirectLegacyStoreRoute'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Outlet />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Welcome /> },
      {
        path: 'comprar',
        element: <BuyerJabaLayout />,
        children: [
          { index: true, element: <BuyerHome /> },
          { path: 'provincia', element: <BuyerSelectProvince /> },
          { path: 'municipio', element: <BuyerSelectMunicipality /> },
          { path: 'tienda/:storeSlug', element: <RedirectLegacyStoreRoute /> },
        ],
      },
      { path: 'login', element: <Login /> },
      {
        path: 'tienda',
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
      { path: 'registro', element: <RegisterPlan /> },
      { path: 'registro/pago', element: <RegisterPayment /> },
      { path: 'registro/verificacion', element: <RegisterForm /> },
      { path: 'registro/exito', element: <RegisterSuccess /> },
      {
        path: 'admin',
        element: <Outlet />,
        children: [
          { index: true, element: <AdminLogin /> },
          {
            element: <AdminAuthenticatedLayout />,
            children: [
              { path: 'estadisticas', element: <AdminStats /> },
              { path: 'solicitudes', element: <AdminDashboard /> },
              { path: 'notificaciones', element: <AdminNotifications /> },
              { path: 'configuracion', element: <AdminSettings /> },
            ],
          },
        ],
      },
      { path: 'admin/inicio', element: <Navigate to="/admin/estadisticas" replace /> },
      {
        path: ':storeSlug',
        element: <BuyerJabaLayout />,
        children: [{ index: true, element: <PublicStoreRoute /> }],
      },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
