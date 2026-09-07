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
import ServiceOrderPage from "@/pages/ServiceOrderPage";

function RedirectToOffreBuilder() {
  if (typeof window !== "undefined") {
    const search = window.location.search || "";
    const params = new URLSearchParams(search);
    params.set("start", "true");
    params.set("ref", "offre");
    window.location.replace("/?" + params.toString());
  }
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/offre" component={RedirectToOffreBuilder} />
      <Route path="/promo" component={RedirectToOffreBuilder} />
      <Route path="/go" component={RedirectToOffreBuilder} />
      <Route path="/offre-landing" component={AdsLanding} />
      <Route path="/service" component={ServiceOrderPage} />
      <Route path="/commande" component={ServiceOrderPage} />
      <Route path="/khadamat" component={ServiceOrderPage} />
      <Route path="/pro-service" component={ServiceOrderPage} />
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
