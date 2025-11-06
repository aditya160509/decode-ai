import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { ConsoleLauncher } from "./components/ConsoleLauncher";
import Home from "./pages/Home";
import GitHub from "./pages/GitHub";
import NoCode from "./pages/NoCode";
import AI from "./pages/AI";
import EduPrompt from "./pages/EduPrompt";
import Demos from "./pages/Demos";
import FAQ from "./pages/FAQ";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import Resources from "./pages/Resources";
import ProjectPage from "./pages/Project";
import { GlobalSearchProvider } from "@/contexts/global-search";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ResourcesDataProvider } from "@/features/resources/context/ResourcesDataContext";
import { GlobalSearchModal } from "@/components/faq/GlobalSearchModal";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <Toaster />
        <Sonner />
        <ResourcesDataProvider>
          <GlobalSearchProvider>
            <BrowserRouter>
              <AppLayout />
              <GlobalSearchModal />
            </BrowserRouter>
          </GlobalSearchProvider>
        </ResourcesDataProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

const AppLayout = () => (
  <div className="flex min-h-screen flex-col">
    <Navbar />
    <main className="flex-1">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/github" element={<GitHub />} />
        <Route path="/nocode" element={<NoCode />} />
        <Route path="/ai" element={<AI />} />
        <Route path="/eduprompt" element={<EduPrompt />} />
        <Route path="/demos" element={<Demos />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/project/:slug" element={<ProjectPage />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
    <Footer />
    <ConsoleLauncher />
  </div>
);
