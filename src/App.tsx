import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./hooks/useAuth";
import About from "./pages/About";
import Technical from "./pages/Technical";
import Artistic from "./pages/Artistic";
import Achievement from "./pages/Achievement";
import Photoshoots from "./pages/Photoshoots";
import ProjectShowcaseDemo from "./pages/ProjectShowcaseDemo";
import Admin from "./pages/Admin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPhotoshootsEdit from "./pages/AdminPhotoshootsEdit";
import AdminArtisticEdit from "./pages/AdminArtisticEdit";
import AdminTechnicalEdit from "./pages/AdminTechnicalEdit";
import AdminSkillsEdit from "./pages/AdminSkillsEdit";
import AdminExperienceEdit from "./pages/AdminExperienceEdit";
import AdminAchievementEdit from "./pages/AdminAchievementEdit";
import AdminHeroEdit from "./pages/AdminHeroEdit";
import AdminAboutEdit from "./pages/AdminAboutEdit";
import AdminLogin from "./pages/AdminLogin";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <AuthProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/" element={<About />} />
                <Route path="/technical" element={<Technical />} />
                <Route path="/artistic" element={<Artistic />} />
                <Route path="/achievement" element={<Achievement />} />
                <Route path="/about" element={<About />} />
                <Route path="/photoshoots" element={<Photoshoots />} />
                <Route path="/demo/project-showcase" element={<ProjectShowcaseDemo />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/photoshoots/edit" element={<AdminPhotoshootsEdit />} />
                <Route path="/admin/artistic/edit" element={<AdminArtisticEdit />} />
                <Route path="/admin/technical/edit" element={<AdminTechnicalEdit />} />
                <Route path="/admin/technical/skills/edit" element={<AdminSkillsEdit />} />
                <Route path="/admin/technical/experience/edit" element={<AdminExperienceEdit />} />
                <Route path="/admin/achievement/edit" element={<AdminAchievementEdit />} />
                <Route path="/admin/hero/edit" element={<AdminHeroEdit />} />
                <Route path="/admin/about/edit" element={<AdminAboutEdit />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
