import { useEffect } from 'react'
import { createBrowserRouter, Navigate, Outlet, RouterProvider, useLocation } from 'react-router-dom'
import RouteMotion, { isBuyerMotionPath } from './motion/RouteMotion'
import { useHorizontalSwipeNav } from './motion/useHorizontalSwipeNav.js'
import BootSplash from './shared/componentes/BootSplash.jsx'
import ScrollToTopButton from './shared/componentes/ScrollToTopButton.jsx'
import CustomerNoticeToasts from './buyer/componentes/CustomerNoticeToasts.jsx'
import AdminAuthenticatedLayout from './admin/componentes/AdminAuthenticatedLayout.jsx'
import RouteError from './shared/componentes/RouteError.jsx'
import SellerRoute from './seller/componentes/SellerRoute.jsx'
import SellerLayout from './seller/componentes/SellerLayout.jsx'
import WelcomeGate from './onboarding/pages/WelcomeGate.jsx'
import Login from './auth/pages/Login'
import CreateAccount from './auth/pages/CreateAccount'
import ForgotPassword from './auth/pages/ForgotPassword'
import ForgotPasswordOtp from './auth/pages/ForgotPasswordOtp'
import ForgotPasswordNew from './auth/pages/ForgotPasswordNew'
import SellerGeneral from './seller/pages/SellerGeneral.jsx'
import SellerStats from './SellerStatistics/pages/SellerStats'
import SellerCatalog from './products/pages/SellerCatalog'
import SellerCatalogPreview from './products/pages/SellerCatalogPreview'
import SellerOrders from './seller/pages/SellerOrders.jsx'
import SellerCustomers from './seller/pages/SellerCustomers.jsx'
import SellerNotifications from './seller/pages/SellerNotifications.jsx'
import SellerGestores from './seller/pages/SellerGestores.jsx'
import SellerMensajeros from './mensajeros/pages/SellerMensajeros.jsx'
import MensajeroLogin from './mensajeros/pages/MensajeroLogin.jsx'
import MensajeroSetup from './mensajeros/pages/MensajeroSetup.jsx'
import MensajeroPanel from './mensajeros/pages/MensajeroPanel.jsx'
import MensajeroRouteGuard from './mensajeros/componentes/MensajeroRouteGuard.jsx'
import SellerProfile from './seller/pages/SellerProfile.jsx'
import SellerPlanCustomize from './seller/pages/SellerPlanCustomize.jsx'
import GestorRoute from './gestor/componentes/GestorRoute.jsx'
import GestorLogin from './gestor/pages/GestorLogin.jsx'
import GestorSetup from './gestor/pages/GestorSetup.jsx'
import GestorPanel from './gestor/pages/GestorPanel.jsx'
import SellerCompleteProfile from './seller/pages/SellerCompleteProfile.jsx'
import RegisterEntry from './auth/pages/RegisterEntry'
import RegisterForm from './auth/pages/RegisterForm'
import RegisterOtp from './auth/pages/RegisterOtp'
import RegisterPlan from './auth/pages/RegisterPlan'
import RegisterCustomize from './auth/pages/RegisterCustomize'
import RegisterPayment from './auth/pages/RegisterPayment'
import RegisterSuccess from './auth/pages/RegisterSuccess'
import AdminLogin from './admin/pages/AdminLogin.jsx'
import AdminDashboard from './admin/pages/AdminDashboard.jsx'
import AdminStats from './admin/pages/AdminStats'
import AdminInbox from './admin/pages/AdminInbox.jsx'
import AdminDisputes from './admin/pages/AdminDisputes.jsx'
import AdminProducts from './products/pages/AdminProducts'
import AdminBanners from './admin/pages/AdminBanners.jsx'
import AdminApps from './appReleases/pages/AdminApps'
import AdminDiscountCodes from './admin/pages/AdminDiscountCodes.jsx'
import AdminSettings from './admin/pages/AdminSettings.jsx'
import AdminFinance from './admin/pages/AdminFinance.jsx'
import RejectSellerMarketplace from './buyer/componentes/RejectSellerMarketplace.jsx'
import BuyerJabaLayout from './layouts/BuyerJabaLayout'
import BuyerCartPage from './buyer/componentes/BuyerJabaPanel.jsx'
import { BuyerDisplayCurrencyProvider, BuyerJabaProvider } from './buyer/context/context.js'
import BuyerMarketplaceLayout from './layouts/BuyerMarketplaceLayout'
import BuyerHome from './buyer/pages/BuyerHome'
import BuyerPitchPage from './buyer/pages/BuyerPitchPage.jsx'
import OfertaEspecialPage from './buyer/pages/OfertaEspecialPage.jsx'
import BuyerCategoryPage from './buyer/pages/BuyerCategoryPage'
import BuyerBusinessesPage from './buyer/pages/BuyerBusinessesPage'
import { BUYER_BUSINESSES_SECTION_ENABLED } from './buyer/utils/constants.js'
import BuyerSelectMunicipality from './buyer/pages/BuyerSelectMunicipality'
import BuyerSelectProvince from './buyer/pages/BuyerSelectProvince'
import CustomerRegister from './buyer/pages/CustomerRegister'
import CustomerAccountLayout from './customer/pages/CustomerAccountLayout'
import CustomerProfilePage from './customer/pages/CustomerProfilePage'
import CustomerOrdersPage from './customer/pages/CustomerOrdersPage'
import CustomerFavoritesPage from './customer/pages/CustomerFavoritesPage'
import CustomerAddressesPage from './customer/pages/CustomerAddressesPage'
import CustomerNoticesPage from './customer/pages/CustomerNoticesPage'
import CustomerPasswordReset from './buyer/pages/CustomerPasswordReset'
import CustomerRoute from './buyer/componentes/CustomerRoute.jsx'
import PublicStoreRoute from './buyer/componentes/PublicStoreRoute.jsx'
import RedirectLegacyStoreRoute from './buyer/componentes/RedirectLegacyStoreRoute.jsx'
import DownloadAppPage from './appReleases/pages/DownloadAppPage'
import PlatformFaq from './platform/pages/PlatformFaq.jsx'
import PlatformPrivacy from './platform/pages/PlatformPrivacy.jsx'
import PlatformTerms from './platform/pages/PlatformTerms.jsx'
import QvaPayReturn from './subscriptions/pages/QvaPayReturn.jsx'
import AppReleasePromptGate from './appReleases/componentes/AppReleasePromptGate.jsx'
import AppDevicePresence from './appReleases/componentes/AppDevicePresence.jsx'
import SyncNoticeHost from './accountSync/SyncNoticeHost.jsx'
import { NativeDeepLinkBridge } from './appReleases/utils/nativeDeepLinks.js'
import { disableBuyerLocationPersistence } from './buyer/utils/buyerLocation.js'
import { markFrontendReady } from './shared/utils/frontendReady.js'
import { startAnonymousNativePush } from './live/utils'
import { isInNativeApp } from './appReleases/utils/releases.js'

if (typeof window !== 'undefined' && isInNativeApp()) {
  document.documentElement.classList.add('native-app')
}

if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('vista') === 'preview') {
  disableBuyerLocationPersistence()
  document.documentElement.classList.add('buyer-preview-static')
}

function RootLayout() {
  const location = useLocation()
  const motionPath = isBuyerMotionPath(location.pathname)
  useHorizontalSwipeNav()

  useEffect(() => {
    const waitsForOffers =
      location.pathname === '/' ||
      location.pathname === '/comprar' ||
      location.pathname === '/comprar/provincia' ||
      location.pathname === '/comprar/municipio'
    if (waitsForOffers) return
    markFrontendReady()
  }, [location.pathname])

  return (
    <>
      <BootSplash />
      <NativeDeepLinkBridge />
      {motionPath ? <RouteMotion /> : <Outlet />}
      <AppReleasePromptGate />
      <CustomerNoticeToasts />
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
      { path: 'sucess', element: <QvaPayReturn result="success" /> },
      { path: 'success', element: <QvaPayReturn result="success" /> },
      { path: 'cancel', element: <QvaPayReturn result="cancel" /> },
      {
        path: 'comprar',
        element: (
          <RejectSellerMarketplace>
            <BuyerJabaLayout />
          </RejectSellerMarketplace>
        ),
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
      {
        path: 'cart',
        element: <BuyerJabaLayout />,
        children: [{ index: true, element: <BuyerCartPage /> }],
      },
      { path: 'login', element: <Login /> },
      { path: 'cliente/registro', element: <CustomerRegister /> },
      { path: 'cliente/recuperar', element: <CustomerPasswordReset /> },
      {
        path: 'cliente',
        element: (
          <CustomerRoute>
            <BuyerDisplayCurrencyProvider>
              <BuyerJabaProvider>
                <CustomerAccountLayout />
              </BuyerJabaProvider>
            </BuyerDisplayCurrencyProvider>
          </CustomerRoute>
        ),
        children: [
          { index: true, element: <CustomerProfilePage /> },
          { path: 'perfil', element: <CustomerProfilePage /> },
          { path: 'pedidos', element: <CustomerOrdersPage /> },
          { path: 'favoritos', element: <CustomerFavoritesPage /> },
          { path: 'direcciones', element: <CustomerAddressesPage /> },
          { path: 'avisos', element: <CustomerNoticesPage /> },
          { path: '*', element: <Navigate to="/cliente/perfil" replace /> },
        ],
      },
      { path: 'recuperar', element: <ForgotPassword /> },
      { path: 'recuperar/codigo', element: <ForgotPasswordOtp /> },
      { path: 'recuperar/nueva', element: <ForgotPasswordNew /> },
      {
        path: 'tienda',
        element: <SellerRoute />,
        children: [
          {
            element: <SellerLayout />,
            children: [
              { index: true, element: <SellerGeneral /> },
              { path: 'catalogo', element: <SellerCatalog /> },
              { path: 'catalogo/vista-previa', element: <SellerCatalogPreview /> },
              { path: 'gestores', element: <SellerGestores /> },
              { path: 'mensajeros', element: <SellerMensajeros /> },
              { path: 'pedidos', element: <SellerOrders /> },
              { path: 'notificaciones', element: <SellerNotifications /> },
              { path: 'clientes', element: <SellerCustomers /> },
              { path: 'estadisticas', element: <SellerStats /> },
              { path: 'perfil', element: <SellerProfile /> },
              { path: 'completar-perfil', element: <SellerCompleteProfile /> },
            ],
          },
          { path: 'perfil/personalizacion', element: <SellerPlanCustomize /> },
        ],
      },
      { path: 'registro', element: <RegisterEntry /> },
      { path: 'registro/planes', element: <RegisterPlan /> },
      { path: 'registro/planes/personalizar', element: <RegisterCustomize /> },
      { path: 'crear-cuenta', element: <CreateAccount /> },
      { path: 'registro/promo/datos', element: <Navigate to="/registro" replace /> },
      { path: 'registro/pago', element: <RegisterPayment /> },
      { path: 'registro/verificacion', element: <RegisterForm /> },
      { path: 'registro/otp', element: <RegisterOtp /> },
      { path: 'registro/exito', element: <RegisterSuccess /> },
      { path: 'aplicacion', element: <DownloadAppPage /> },
      {
        path: 'inicio',
        element: <BuyerJabaLayout />,
        children: [{ index: true, element: <BuyerPitchPage /> }],
      },
      {
        path: 'oferta-especial',
        element: <BuyerJabaLayout />,
        children: [{ index: true, element: <OfertaEspecialPage /> }],
      },
      { path: 'terminos', element: <PlatformTerms /> },
      { path: 'privacidad', element: <PlatformPrivacy /> },
      { path: 'preguntas', element: <PlatformFaq /> },
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
              { path: 'disputas', element: <AdminDisputes /> },
              { path: 'notificaciones', element: <Navigate to="/admin/mensajes" replace /> },
              { path: 'productos', element: <AdminProducts /> },
              { path: 'banners', element: <AdminBanners /> },
              { path: 'apps', element: <AdminApps /> },
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
      { path: 'mensajero/:alias', element: <MensajeroLogin /> },
      { path: 'mensajero/:alias/setup', element: <MensajeroSetup /> },
      {
        path: 'mensajero/:alias/panel',
        element: (
          <MensajeroRouteGuard>
            <MensajeroPanel />
          </MensajeroRouteGuard>
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

if (typeof window !== 'undefined') {
  void startAnonymousNativePush()
}

function App() {
  return (
    <>
      <AppDevicePresence />
      <SyncNoticeHost />
      <RouterProvider router={router} />
    </>
  )
}

export default App
