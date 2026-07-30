import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom'
import AdminAuthenticatedLayout from './components/admin/AdminAuthenticatedLayout'
import RouteError from './components/RouteError'
import SellerRoute from './components/SellerRoute'
import SellerLayout from './components/seller/SellerLayout'
import WelcomeGate from './pages/WelcomeGate'
import Login from './pages/Login'
import SellerGeneral from './pages/seller/SellerGeneral'
import SellerCatalog from './pages/seller/SellerCatalog'
import SellerCatalogPreview from './pages/seller/SellerCatalogPreview'
import SellerOrders from './pages/seller/SellerOrders'
import SellerGestores from './pages/seller/SellerGestores'
import SellerProfile from './pages/seller/SellerProfile'
import GestorRoute from './components/gestor/GestorRoute'
import GestorLogin from './pages/gestor/GestorLogin'
import GestorSetup from './pages/gestor/GestorSetup'
import GestorPanel from './pages/gestor/GestorPanel'
import SellerCompleteProfile from './pages/SellerCompleteProfile'
import RegisterEntry from './pages/RegisterEntry'
import RegisterPayment from './pages/RegisterPayment'
import RegisterForm from './pages/RegisterForm'
import RegisterSuccess from './pages/RegisterSuccess'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import AdminStats from './pages/AdminStats'
import AdminNotifications from './pages/AdminNotifications'
import AdminFeedback from './pages/AdminFeedback'
import AdminDiscountCodes from './pages/AdminDiscountCodes'
import AdminSettings from './pages/AdminSettings'
import BuyerJabaLayout from './layouts/BuyerJabaLayout'
import BuyerMarketplaceLayout from './layouts/BuyerMarketplaceLayout'
import BuyerHome from './pages/buyer/BuyerHome'
import BuyerBusinessesPage from './pages/buyer/BuyerBusinessesPage'
import { BUYER_BUSINESSES_SECTION_ENABLED } from './constants/buyerMarketplaceNav'
import BuyerSelectMunicipality from './pages/buyer/BuyerSelectMunicipality'
import BuyerSelectProvince from './pages/buyer/BuyerSelectProvince'
import PublicStoreRoute from './components/buyer/PublicStoreRoute'
import RedirectLegacyStoreRoute from './components/buyer/RedirectLegacyStoreRoute'
import DownloadAppPage from './pages/DownloadAppPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Outlet />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <WelcomeGate /> },
      {
        path: 'comprar',
        element: <BuyerJabaLayout />,
        children: [
          { path: 'provincia', element: <BuyerSelectProvince /> },
          { path: 'municipio', element: <BuyerSelectMunicipality /> },
          { path: 'tienda/:storeSlug', element: <RedirectLegacyStoreRoute /> },
          {
            element: <BuyerMarketplaceLayout />,
            children: [
              { index: true, element: <BuyerHome /> },
              {
                path: 'negocios',
                // Página conservada; el flag solo oculta la sección temporalmente.
                element: BUYER_BUSINESSES_SECTION_ENABLED ? (
                  <BuyerBusinessesPage />
                ) : (
                  <Navigate to="/comprar" replace />
                ),
              },
            ],
          },
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
          { path: 'catalogo/vista-previa', element: <SellerCatalogPreview /> },
          { path: 'gestores', element: <SellerGestores /> },
          { path: 'pedidos', element: <SellerOrders /> },
          { path: 'perfil', element: <SellerProfile /> },
          { path: 'completar-perfil', element: <SellerCompleteProfile /> },
        ],
      },
      { path: 'registro', element: <RegisterEntry /> },
      { path: 'registro/promo/datos', element: <Navigate to="/registro" replace /> },
      { path: 'registro/pago', element: <RegisterPayment /> },
      { path: 'registro/verificacion', element: <RegisterForm /> },
      { path: 'registro/exito', element: <RegisterSuccess /> },
      { path: 'aplicacion', element: <DownloadAppPage /> },
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
              { path: 'descuentos', element: <AdminDiscountCodes /> },
              { path: 'mensajes', element: <AdminFeedback /> },
              { path: 'notificaciones', element: <AdminNotifications /> },
              { path: 'configuracion', element: <AdminSettings /> },
            ],
          },
        ],
      },
      { path: 'admin/inicio', element: <Navigate to="/admin/estadisticas" replace /> },
      { path: 'g/:storeSlug/gestor', element: <GestorLogin /> },
      { path: 'g/:storeSlug/gestor/setup', element: <GestorSetup /> },
      {
        path: 'g/:storeSlug/gestor/panel',
        element: (
          <GestorRoute>
            <GestorPanel />
          </GestorRoute>
        ),
      },
      {
        path: ':storeSlug',
        element: <BuyerJabaLayout />,
        children: [
          { index: true, element: <PublicStoreRoute /> },
          { path: ':gestorUsername', element: <PublicStoreRoute /> },
        ],
      },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
