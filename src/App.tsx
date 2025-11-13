import { ToastProvider } from "./design-system/components/Toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Outlet } from "react-router-dom";

import { ThemeProvider } from "@/services/theme-context";
import { HelpProvider } from "./services/help-context";
import { I18nProvider } from "@/services/i18n-context";
import ProtectedRoute from "./design-system/components/ProtectedRoute";
import MainAppChrome from "./design-system/components/MainAppChrome";
import HelpModal from "./design-system/components/HelpModal";
 

import Home from "./pages/Home";

import KnowledgeBase from "./pages/KnowledgeBase";
import SignIn from "./pages/SignIn";
import Profile from "./pages/Profile";
import ContentEditor from "./pages/ContentEditor";
import Posts from "./pages/Posts";
import PacingPage from "./pages/PacingPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import Welcome from "./pages/Onboarding/Welcome";
import LinkedInInput from "./pages/Onboarding/LinkedInInput";
import WhatsAppInput from "./pages/Onboarding/WhatsAppInput";
import ProfileReview from "./pages/Onboarding/ProfileReview";
import PacingInput from "./pages/Onboarding/PacingInput";
import GoalsInput from "./pages/Onboarding/GoalsInput";
import PillarsInput from "./pages/Onboarding/PillarsInput";
import WritingFormatInput from "./pages/Onboarding/WritingFormatInput";
import KnowledgeInput from "./pages/Onboarding/KnowledgeInput";
import ReadyPage from "./pages/Onboarding/ReadyPage";
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
      <I18nProvider>
        <HelpProvider>
          <ToastProvider>
            <BrowserRouter>
          <Routes>
          {/* Public routes */}
          <Route path="/" element={<SignIn />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/onboarding/welcome" element={<Welcome />} />
          <Route path="/onboarding/first-things-first" element={<LinkedInInput />} />
          <Route path="/onboarding/whatsapp" element={<WhatsAppInput />} />
          <Route path="/onboarding/profile-review" element={<ProfileReview />} />
          <Route path="/onboarding/pacing" element={<PacingInput />} />
          <Route path="/onboarding/goals" element={<GoalsInput />} />
          <Route path="/onboarding/pillars" element={<PillarsInput />} />
          <Route path="/onboarding/writing-format" element={<WritingFormatInput />} />
          <Route path="/onboarding/knowledge" element={<KnowledgeInput />} />
          <Route path="/onboarding/ready" element={<ReadyPage />} />
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
            <Route path="/product-home" element={<Home />} />
            {/* Alias for historical navigation */}
            <Route path="/dashboard" element={<Home />} />
            <Route path="/knowledge" element={<KnowledgeBase />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/content-editor" element={<ContentEditor />} />
            <Route path="/posts" element={<Posts />} />
            <Route path="/pacing" element={<PacingPage />} />
            <Route path="/integrations" element={<IntegrationsPage />} />
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
      </I18nProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
};

export default App;
