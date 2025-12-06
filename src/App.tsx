import { ToastProvider } from "./design-system/components/Toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Outlet } from "react-router-dom";

import { ThemeProvider } from "@/services/theme-context";
import { HelpProvider } from "./services/help-context";
import { I18nProvider } from "./services/i18n-context";
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
import Guides from "./pages/Onboarding/Guides";
import ContentPillars from "./pages/Onboarding/ContentPillars";
import Pacing from "./pages/Onboarding/Pacing";
import Goals from "./pages/Onboarding/Goals";
import Pillars from "./pages/Onboarding/Pillars";
import Format from "./pages/Onboarding/Format";
import Knowledge from "./pages/Onboarding/Knowledge";
import Contact from "./pages/Onboarding/Contact";
import WhatsAppSetup from "./pages/Onboarding/WhatsAppSetup";
import WhatsAppInput from "./pages/Onboarding/WhatsAppInput";
import Ready from "./pages/Onboarding/Ready";
import LoadingPage from "./pages/LoadingPage";
import NotFound from "./pages/NotFound";
import GoogleCalendarCallback from "./pages/GoogleCalendarCallback";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import LinkedInAnalyzer from "./pages/LinkedInAnalyzer";
import LinkedInWrapped from "./pages/LinkedInWrapped";
import MyWrapped from "./pages/MyWrapped";
import ThankYou from "./pages/ThankYou";
import WrappedProtectedRoute from "./design-system/components/WrappedProtectedRoute";

const queryClient = new QueryClient();

const App = () => {


  return (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
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
          <Route path="/onboarding/whatsapp" element={<WhatsAppInput />} />
          <Route path="/onboarding/guides" element={<Guides />} />
          <Route path="/onboarding/content-pillars" element={<ContentPillars />} />
          <Route path="/onboarding/pacing" element={<Pacing />} />
          <Route path="/onboarding/goals" element={<Goals />} />
          <Route path="/onboarding/pillars" element={<Pillars />} />
          <Route path="/onboarding/format" element={<Format />} />
          <Route path="/onboarding/knowledge" element={<Knowledge />} />
          <Route path="/onboarding/contact" element={<Contact />} />
          <Route path="/onboarding/whatsapp-setup" element={<WhatsAppSetup />} />
          <Route path="/onboarding/ready" element={<Ready />} />
          {/* Public legal pages */}
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          
          {/* Public Lead Magnet Tools */}
          <Route path="/linkedin-analyzer" element={<LinkedInAnalyzer />} />
          <Route path="/linkedin-wrapped" element={<LinkedInWrapped />} />
          <Route path="/thank-you" element={<ThankYou />} />
          
          {/* Protected Wrapped Route */}
          <Route 
            path="/my-wrapped" 
            element={
              <WrappedProtectedRoute>
                <MyWrapped />
              </WrappedProtectedRoute>
            } 
          />
          
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
    </I18nProvider>
  </QueryClientProvider>
  );
};

export default App;
