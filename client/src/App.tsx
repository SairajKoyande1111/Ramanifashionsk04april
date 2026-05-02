import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthUIProvider } from "@/contexts/AuthUIContext";
import ScrollToTop from "@/components/ScrollToTop";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import PaymentCallback from "@/pages/PaymentCallback";
import Admin from "@/pages/Admin";
import Occasions from "@/pages/Occasions";
import Collections from "@/pages/Collections";
import AboutUs from "@/pages/AboutUs";
import Sale from "@/pages/Sale";
import NewArrivals from "@/pages/NewArrivals";
import TrendingCollection from "@/pages/TrendingCollection";
import BestSeller from "@/pages/BestSeller";
import Profile from "@/pages/Profile";
import Orders from "@/pages/Orders";
import Wishlist from "@/pages/Wishlist";
import NotFound from "@/pages/not-found";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import ProductManagement from "@/pages/admin/ProductManagement";
import InventoryManagement from "@/pages/admin/InventoryManagement";
import OrderManagement from "@/pages/admin/OrderManagement";
import CustomerManagement from "@/pages/admin/CustomerManagement";
import CustomerDetail from "@/pages/admin/CustomerDetail";
import ReviewManagement from "@/pages/admin/ReviewManagement";
import Analytics from "@/pages/admin/Analytics";
import MediaManagement from "@/pages/admin/MediaManagement";
import Settings from "@/pages/admin/Settings";
import CategoryManagement from "@/pages/admin/CategoryManagement";
import AnnouncementManagement from "@/pages/admin/AnnouncementManagement";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Shipping from "@/pages/Shipping";
import Returns from "@/pages/Returns";
import FAQ from "@/pages/FAQ";
import SizeGuide from "@/pages/SizeGuide";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/products" component={Products} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/payment-callback" component={PaymentCallback} />
      <Route path="/categories" component={Products} />
      <Route path="/new-arrivals" component={NewArrivals} />
      <Route path="/trending-collection" component={TrendingCollection} />
      <Route path="/bestseller" component={BestSeller} />
      <Route path="/occasions" component={Occasions} />
      <Route path="/collections" component={Collections} />
      <Route path="/about" component={AboutUs} />
      <Route path="/sale" component={Sale} />
      <Route path="/profile" component={Profile} />
      <Route path="/orders" component={Orders} />
      <Route path="/wishlist" component={Wishlist} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/shipping" component={Shipping} />
      <Route path="/returns" component={Returns} />
      <Route path="/faq" component={FAQ} />
      <Route path="/size-guide" component={SizeGuide} />
      <Route path="/admin/ramanifashionlogin" component={AdminLogin} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/products" component={ProductManagement} />
      <Route path="/admin/inventory" component={InventoryManagement} />
      <Route path="/admin/orders" component={OrderManagement} />
      <Route path="/admin/customers" component={CustomerManagement} />
      <Route path="/admin/customers/:id" component={CustomerDetail} />
      <Route path="/admin/reviews" component={ReviewManagement} />
      <Route path="/admin/analytics" component={Analytics} />
      <Route path="/admin/categories" component={CategoryManagement} />
      <Route path="/admin/media" component={MediaManagement} />
      <Route path="/admin/announcement" component={AnnouncementManagement} />
      <Route path="/admin/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthUIProvider>
          <ScrollToTop />
          <Toaster />
          <Router />
        </AuthUIProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
