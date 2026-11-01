import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom'
import ScrollToTopButton from './components/ScrollToTopButton'
import AdminAuthenticatedLayout from './components/admin/AdminAuthenticatedLayout'
import RouteError from './components/RouteError'
import SellerRoute from './components/SellerRoute'
import SellerLayout from './components/seller/SellerLayout'
import WelcomeGate from './pages/WelcomeGate'
import Login from './auth/pages/Login'
import CreateAccount from './auth/pages/CreateAccount'
import ForgotPassword from './auth/pages/ForgotPassword'
import ForgotPasswordOtp from './auth/pages/ForgotPasswordOtp'
import ForgotPasswordNew from './auth/pages/ForgotPasswordNew'
import SellerGeneral from './pages/seller/SellerGeneral'
import SellerStats from './SellerStatistics/pages/SellerStats'
import SellerCatalog from './products/pages/SellerCatalog'
import SellerCatalogPreview from './products/pages/SellerCatalogPreview'
import SellerOrders from './pages/seller/SellerOrders'
import SellerCustomers from './pages/seller/SellerCustomers'
import SellerGestores from './pages/seller/SellerGestores'
import SellerProfile from './pages/seller/SellerProfile'
import GestorRoute from './components/gestor/GestorRoute'
import GestorLogin from './pages/gestor/GestorLogin'
import GestorSetup from './pages/gestor/GestorSetup'
import GestorPanel from './pages/gestor/GestorPanel'
import SellerCompleteProfile from './pages/SellerCompleteProfile'
import RegisterEntry from './auth/pages/RegisterEntry'
import RegisterForm from './auth/pages/RegisterForm'
import RegisterOtp from './auth/pages/RegisterOtp'
import RegisterPlan from './auth/pages/RegisterPlan'
import RegisterPayment from './auth/pages/RegisterPayment'
import RegisterSuccess from './auth/pages/RegisterSuccess'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import AdminStats from './AdminStatistics/pages/AdminStats'
import AdminInbox from './pages/AdminInbox'
import AdminProducts from './products/pages/AdminProducts'
import AdminBanners from './pages/AdminBanners'
import AdminDiscountCodes from './pages/AdminDiscountCodes'
import AdminSettings from './pages/AdminSettings'
import AdminFinance from './pages/AdminFinance'
import BuyerJabaLayout from './layouts/BuyerJabaLayout'
import { BuyerDisplayCurrencyProvider, BuyerJabaProvider } from './buyer/context.js'
import BuyerMarketplaceLayout from './layouts/BuyerMarketplaceLayout'
import BuyerHome from './buyer/pages/BuyerHome'
import BuyerCategoryPage from './buyer/pages/BuyerCategoryPage'
import BuyerBusinessesPage from './buyer/pages/BuyerBusinessesPage'
import { BUYER_BUSINESSES_SECTION_ENABLED } from './buyer/constants.js'
import BuyerSelectMunicipality from './buyer/pages/BuyerSelectMunicipality'
import BuyerSelectProvince from './buyer/pages/BuyerSelectProvince'
import CustomerRegister from './buyer/pages/CustomerRegister'
import CustomerAccount from './buyer/pages/CustomerAccount'
import CustomerPasswordReset from './buyer/pages/CustomerPasswordReset'
import CustomerRoute from './buyer/components/CustomerRoute'
import PublicStoreRoute from './buyer/components/PublicStoreRoute'
import RedirectLegacyStoreRoute from './buyer/components/RedirectLegacyStoreRoute'
import DownloadAppPage from './pages/DownloadAppPage'
import Remesas from './pages/Remesas'
import AppDevicePresence from './lib/appDevicePresence'
import { disableBuyerLocationPersistence } from './lib/buyerLocation'

if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('vista') === 'preview') {
  disableBuyerLocationPersistence()
  document.documentElement.classList.add('buyer-preview-static')
}

function RootLayout() {
  return (
    <>
      <Outlet />
      <ScrollToTopButton />
    </>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
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
              { path: ':categorySlug', element: <BuyerCategoryPage /> },
            ],
          },
        ],
      },
      { path: 'login', element: <Login /> },
      { path: 'cliente/registro', element: <CustomerRegister /> },
      { path: 'cliente/recuperar', element: <CustomerPasswordReset /> },
      { path: 'cliente/*', element: <CustomerRoute><BuyerDisplayCurrencyProvider><BuyerJabaProvider><CustomerAccount /></BuyerJabaProvider></BuyerDisplayCurrencyProvider></CustomerRoute> },
      { path: 'recuperar', element: <ForgotPassword /> },
      { path: 'recuperar/codigo', element: <ForgotPasswordOtp /> },
      { path: 'recuperar/nueva', element: <ForgotPasswordNew /> },
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
          { path: 'clientes', element: <SellerCustomers /> },
          { path: 'estadisticas', element: <SellerStats /> },
          { path: 'perfil', element: <SellerProfile /> },
          { path: 'completar-perfil', element: <SellerCompleteProfile /> },
        ],
      },
      { path: 'registro', element: <RegisterEntry /> },
      { path: 'registro/planes', element: <RegisterPlan /> },
      { path: 'crear-cuenta', element: <CreateAccount /> },
      { path: 'registro/promo/datos', element: <Navigate to="/registro" replace /> },
      { path: 'registro/pago', element: <RegisterPayment /> },
      { path: 'registro/verificacion', element: <RegisterForm /> },
      { path: 'registro/otp', element: <RegisterOtp /> },
      { path: 'registro/exito', element: <RegisterSuccess /> },
      { path: 'aplicacion', element: <DownloadAppPage /> },
      {
        path: 'remesas',
        element: <BuyerJabaLayout />,
        children: [{ index: true, element: <Remesas /> }],
      },
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
              { path: 'mensajes', element: <AdminInbox /> },
              { path: 'notificaciones', element: <Navigate to="/admin/mensajes" replace /> },
              { path: 'productos', element: <AdminProducts /> },
              { path: 'banners', element: <AdminBanners /> },
              { path: 'finanzas', element: <AdminFinance /> },
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
          { path: ':gestorUsername/:categorySlug', element: <PublicStoreRoute /> },
        ],
      },
    ],
  },
])

function App() {
  return (
    <>
      <AppDevicePresence />
      <RouterProvider router={router} />
    </>
  )
}

export default App
