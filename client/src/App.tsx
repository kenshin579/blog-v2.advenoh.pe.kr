import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "@/lib/theme-provider";
import { Header } from "@/components/Header";
import { SearchModal } from "@/components/SearchModal";
import Home from "@/pages/Home";
import Series from "@/pages/Series";
import Article from "@/pages/Article";
import NotFound from "@/pages/not-found";
import { loadArticles } from "@/lib/articles";
import { Article as ArticleType } from "@/lib/markdown";

function Router() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [articles, setArticles] = useState<ArticleType[]>([]);

  // Only load articles when search modal is opened
  useEffect(() => {
    if (searchOpen && articles.length === 0) {
      loadArticles().then(setArticles).catch(err => {
        console.error('Failed to load articles for search:', err);
      });
    }
  }, [searchOpen, articles.length]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header onSearchClick={() => setSearchOpen(true)} />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/series" component={Series} />
          <Route path="/article/:slug" component={Article} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <SearchModal 
        open={searchOpen} 
        onOpenChange={setSearchOpen} 
        articles={articles}
      />
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
