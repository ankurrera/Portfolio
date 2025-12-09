import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./hooks/useAuth";
import { useEffect } from "react";
import Index from "./pages/Index";
import About from "./pages/About";
import Project from "./pages/Project";
import CategoryGallery from "./pages/CategoryGallery";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

/**
 * Component to manage body classes based on route.
 * 
 * Note: Uses two separate useEffect hooks to prevent flash:
 * 1. First effect manages class based on route changes (no cleanup on dependency change)
 * 2. Second effect only cleans up on component unmount
 * 
 * This prevents the class from being briefly removed when navigating between admin routes
 * (e.g., /admin/login -> /admin), which would cause a visual flash.
 */
const BodyClassManager = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Add or remove 'admin-dashboard' class to body based on route
    const isAdminRoute = location.pathname.startsWith('/admin');
    
    if (isAdminRoute) {
      document.body.classList.add('admin-dashboard');
    } else {
      document.body.classList.remove('admin-dashboard');
    }
  }, [location.pathname]);
  
  // Separate cleanup effect that only runs on component unmount
  // This ensures the class is removed when the app unmounts, but doesn't
  // interfere with route changes (which would cause a flash)
  useEffect(() => {
    return () => {
      document.body.classList.remove('admin-dashboard');
    };
  }, []);
  
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <AuthProvider>
          <ErrorBoundary>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <BodyClassManager />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<About />} />
                <Route path="/category/:category" element={<CategoryGallery />} />
                <Route path="/project/:slug" element={<Project />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ErrorBoundary>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
