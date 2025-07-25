import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
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
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
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
            <Route
              path="/product-home" 
              element={
                <ProtectedRoute>
                  <ProductHome />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/knowledge" 
              element={
                <ProtectedRoute>
                  <KnowledgeBase />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/content-editor" 
              element={
                <ProtectedRoute>
                  <ContentEditor />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/posts" 
              element={
                <ProtectedRoute>
                  <Posts />
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
