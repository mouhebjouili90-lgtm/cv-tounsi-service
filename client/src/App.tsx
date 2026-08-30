import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { AuthModal } from "./components/auth/AuthModal";
import { FloatingWhatsApp } from "./components/FloatingWhatsApp";
import Home from "./pages/Home";

import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import AdsLanding from "@/pages/AdsLanding";
import AdminDashboard from "@/pages/AdminDashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/offre" component={AdsLanding} />
      <Route path="/promo" component={AdsLanding} />
      <Route path="/go" component={AdsLanding} />
      <Route path="/politique-de-confidentialite" component={Privacy} />
      <Route path="/conditions-utilisation" component={Terms} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster position="top-center" />
            <AuthModal />
            <FloatingWhatsApp />
            <div dir="ltr" lang="fr">
              <Router />
            </div>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
