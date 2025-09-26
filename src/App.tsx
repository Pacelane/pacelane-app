import { ToastProvider } from "./design-system/components/Toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Outlet } from "react-router-dom";

import { ThemeProvider } from "@/services/theme-context";
import { HelpProvider } from "./services/help-context";
import ProtectedRoute from "./design-system/components/ProtectedRoute";
import MainAppChrome from "./design-system/components/MainAppChrome";
import HelpModal from "./design-system/components/HelpModal";
 

import ProductHome from "./pages/ProductHome";
import Templates from "./pages/Templates";

import KnowledgeBase from "./pages/KnowledgeBase";
import SignIn from "./pages/SignIn";
import Profile from "./pages/Profile";
import ContentEditor from "./pages/ContentEditor";
import Posts from "./pages/Posts";
import PacingPage from "./pages/PacingPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import PlanBillingPage from "./pages/PlanBillingPage";
import NotificationsPage from "./pages/NotificationsPage";
import Welcome from "./pages/Onboarding/Welcome";
import FirstThingsFirst from "./pages/Onboarding/FirstThingsFirst";
import LinkedInSummary from "./pages/Onboarding/LinkedInSummary";
import Pacing from "./pages/Onboarding/Pacing";
import Contact from "./pages/Onboarding/Contact";
import WhatsAppSetup from "./pages/Onboarding/WhatsAppSetup";
import Ready from "./pages/Onboarding/Ready";
import LoadingPage from "./pages/LoadingPage";
import NotFound from "./pages/NotFound";
import GoogleCalendarCallback from "./pages/GoogleCalendarCallback";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";

const queryClient = new QueryClient();

const App = () => {


  return (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <HelpProvider>
        <ToastProvider>
          <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<SignIn />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/onboarding/welcome" element={<Welcome />} />
          <Route path="/onboarding/first-things-first" element={<FirstThingsFirst />} />
          <Route path="/onboarding/linkedin-summary" element={<LinkedInSummary />} />
          <Route path="/onboarding/pacing" element={<Pacing />} />
          <Route path="/onboarding/contact" element={<Contact />} />
          <Route path="/onboarding/whatsapp-setup" element={<WhatsAppSetup />} />
          <Route path="/onboarding/ready" element={<Ready />} />
          {/* Public legal pages */}
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          
          {/* OAuth callbacks */}
          <Route path="/auth/google/callback" element={<GoogleCalendarCallback />} />
          {/* Some environments use a different path; support both to avoid 404 */}
          <Route path="/auth/google-calendar/callback" element={<GoogleCalendarCallback />} />

          {/* Protected app chrome with sidebar and centered content */}
          <Route
            element={
              <ProtectedRoute>
                <MainAppChrome>
                  <Outlet />
                </MainAppChrome>
              </ProtectedRoute>
            }
          >
            <Route path="/product-home" element={<ProductHome />} />
            {/* Alias for historical navigation */}
            <Route path="/dashboard" element={<ProductHome />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/knowledge" element={<KnowledgeBase />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/content-editor" element={<ContentEditor />} />
            <Route path="/posts" element={<Posts />} />
            <Route path="/pacing" element={<PacingPage />} />
            <Route path="/integrations" element={<IntegrationsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/plan-billing" element={<PlanBillingPage />} />
            <Route path="/loading" element={<LoadingPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        
        {/* Global Help Modal */}
        <HelpModal />
      </BrowserRouter>
      </ToastProvider>
      </HelpProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
};

export default App;
