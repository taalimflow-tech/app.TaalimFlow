import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Schedule from "@/pages/Schedule";
import Teachers from "@/pages/Teachers";
import Suggestions from "@/pages/Suggestions";
import Blog from "@/pages/Blog";
import Groups from "@/pages/Groups";
import Formations from "@/pages/Formations";
import AdminPanel from "@/pages/AdminPanel";
import AdminUsers from "@/pages/AdminUsers";
import AdminContent from "@/pages/AdminContent";
import AdminPanelTest from "@/pages/AdminPanelTest";
import AdminSuggestions from "@/pages/AdminSuggestions";
import Announcements from "@/pages/Announcements";
import AdminLogin from "@/pages/AdminLogin";
import Profile from "@/pages/Profile";
import Messages from "@/pages/Messages";

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Show login page if user is not authenticated
  if (!user) {
    return <Login />;
  }
  
  return <>{children}</>;
}

function AuthenticatedRoutes() {
  return (
    <AuthWrapper>
      <Layout>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/schedule" component={Schedule} />
          <Route path="/teachers" component={Teachers} />
          <Route path="/messages" component={Messages} />
          <Route path="/suggestions" component={Suggestions} />
          <Route path="/blog" component={Blog} />
          <Route path="/groups" component={Groups} />
          <Route path="/formations" component={Formations} />
          <Route path="/announcements" component={Announcements} />
          <Route path="/admin" component={AdminPanelTest} />
          <Route path="/admin/users" component={AdminUsers} />
          <Route path="/admin/content" component={AdminContent} />
          <Route path="/admin/suggestions" component={AdminSuggestions} />
          <Route path="/profile" component={Profile} />
          <Route component={NotFound} />
        </Switch>
      </Layout>
    </AuthWrapper>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/admin-login" component={AdminLogin} />
      <Route component={AuthenticatedRoutes} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-md mx-auto bg-white min-h-screen">
            <Router />
          </div>
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
