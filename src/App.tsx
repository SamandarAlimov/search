import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Helmet, HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import Search from "./pages/Search";
import Images from "./pages/Images";
import Videos from "./pages/Videos";
import News from "./pages/News";
import Shopping from "./pages/Shopping";
import Maps from "./pages/Maps";
import Academic from "./pages/Academic";
import ReadingList from "./pages/ReadingList";
import SearchHistory from "./pages/SearchHistory";
import SavedSearches from "./pages/SavedSearches";
import Advanced from "./pages/Advanced";
import AuthCallback from "./pages/AuthCallback";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Helmet>
          <title>Alsamos Search - AI-Powered Search Engine</title>
          <meta name="description" content="Alsamos Search is the official elite, premium, fully AI-powered search engine of Alsamos Corporation. Search the web with AI assistance." />
          <meta property="og:title" content="Alsamos Search - AI-Powered Search Engine" />
          <meta property="og:description" content="The official elite, premium search engine by Alsamos Corporation." />
          <meta property="og:type" content="website" />
          <link rel="canonical" href="https://search.alsamos.com" />
        </Helmet>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/search" element={<Search />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/news" element={<News />} />
            <Route path="/shopping" element={<Shopping />} />
            <Route path="/maps" element={<Maps />} />
            <Route path="/academic" element={<Academic />} />
            <Route path="/reading-list" element={<ReadingList />} />
            <Route path="/history" element={<SearchHistory />} />
            <Route path="/saved" element={<SavedSearches />} />
            <Route path="/advanced" element={<Advanced />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/profile" element={<Profile />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
