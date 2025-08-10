import { ToastProvider } from "@/design-system/components/Toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/services/theme-context";
import ProtectedRoute from "@/design-system/components/ProtectedRoute";
import MainAppChrome from "@/design-system/components/MainAppChrome";

import ProductHome from "./pages/ProductHome";

import KnowledgeBase from "./pages/KnowledgeBase";
import SignIn from "./pages/SignIn";
import Profile from "./pages/Profile";
import ContentEditor from "./pages/ContentEditor";
import Posts from "./pages/Posts";
import Welcome from "./pages/Onboarding/Welcome";
import FirstThingsFirst from "./pages/Onboarding/FirstThingsFirst";
import Inspirations from "./pages/Onboarding/Inspirations";
import Goals from "./pages/Onboarding/Goals";
import Guides from "./pages/Onboarding/Guides";
import ContentPillars from "./pages/Onboarding/ContentPillars";
import Pacing from "./pages/Onboarding/Pacing";
import Contact from "./pages/Onboarding/Contact";
import Ready from "./pages/Onboarding/Ready";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<SignIn />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/onboarding/welcome" element={<Welcome />} />
            <Route path="/onboarding/first-things-first" element={<FirstThingsFirst />} />
            <Route path="/onboarding/inspirations" element={<Inspirations />} />
            <Route path="/onboarding/goals" element={<Goals />} />
            <Route path="/onboarding/guides" element={<Guides />} />
            <Route path="/onboarding/content-pillars" element={<ContentPillars />} />
            <Route path="/onboarding/pacing" element={<Pacing />} />
            <Route path="/onboarding/contact" element={<Contact />} />
            <Route path="/onboarding/ready" element={<Ready />} />

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
              <Route path="/knowledge" element={<KnowledgeBase />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/content-editor" element={<ContentEditor />} />
              <Route path="/posts" element={<Posts />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
