import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout.jsx';
import { RequireAuth, RequireAdmin } from './components/RouteGuards.jsx';
import Home from './pages/Home.jsx';

// Route-level code splitting keeps the first load small (Lighthouse performance)
const Services = lazy(() => import('./pages/Services.jsx'));
const Book = lazy(() => import('./pages/Book.jsx'));
const ManageAppointment = lazy(() => import('./pages/ManageAppointment.jsx'));
const Shop = lazy(() => import('./pages/Shop.jsx'));
const ProductDetail = lazy(() => import('./pages/ProductDetail.jsx'));
const Cart = lazy(() => import('./pages/Cart.jsx'));
const Checkout = lazy(() => import('./pages/Checkout.jsx'));
const CheckoutSuccess = lazy(() => import('./pages/CheckoutSuccess.jsx'));
const CheckoutCancel = lazy(() => import('./pages/CheckoutCancel.jsx'));
const Login = lazy(() => import('./pages/auth/Login.jsx'));
const Register = lazy(() => import('./pages/auth/Register.jsx'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const Contact = lazy(() => import('./pages/Contact.jsx'));
const Faq = lazy(() => import('./pages/Faq.jsx'));
const LegalPage = lazy(() => import('./pages/LegalPage.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

const AccountLayout = lazy(() => import('./pages/account/AccountLayout.jsx'));
const Profile = lazy(() => import('./pages/account/Profile.jsx'));
const Orders = lazy(() => import('./pages/account/Orders.jsx'));
const MyAppointments = lazy(() => import('./pages/account/MyAppointments.jsx'));

const AdminLayout = lazy(() => import('./layouts/AdminLayout.jsx'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard.jsx'));
const AdminProducts = lazy(() => import('./pages/admin/Products.jsx'));
const AdminCategories = lazy(() => import('./pages/admin/Categories.jsx'));
const AdminOrders = lazy(() => import('./pages/admin/Orders.jsx'));
const AdminAppointments = lazy(() => import('./pages/admin/Appointments.jsx'));
const AdminServices = lazy(() => import('./pages/admin/Services.jsx'));
const AdminCustomers = lazy(() => import('./pages/admin/Customers.jsx'));
const AdminReviews = lazy(() => import('./pages/admin/Reviews.jsx'));
const AdminMessages = lazy(() => import('./pages/admin/Messages.jsx'));

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="services" element={<Services />} />
        <Route path="book" element={<Book />} />
        <Route path="appointments/:id" element={<ManageAppointment />} />
        <Route path="shop" element={<Shop />} />
        <Route path="shop/:slug" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="checkout/success" element={<CheckoutSuccess />} />
        <Route path="checkout/cancel" element={<CheckoutCancel />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="faq" element={<Faq />} />
        <Route path="privacy" element={<LegalPage page="privacy" />} />
        <Route path="terms" element={<LegalPage page="terms" />} />
        <Route path="shipping-returns" element={<LegalPage page="shipping" />} />
        <Route
          path="account"
          element={
            <RequireAuth>
              <AccountLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Profile />} />
          <Route path="orders" element={<Orders />} />
          <Route path="appointments" element={<MyAppointments />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route
        path="admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="appointments" element={<AdminAppointments />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="services" element={<AdminServices />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="messages" element={<AdminMessages />} />
      </Route>
    </Routes>
  );
}
