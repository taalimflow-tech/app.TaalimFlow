import React from "react";
import { useLocation } from "wouter";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Toaster } from "@/components/ui/toaster";
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
import AdminVerification from "@/pages/AdminVerification";
import AdminReports from "@/pages/AdminReports";
import Announcements from "@/pages/Announcements";
import SuperAdminSimple from "@/pages/SuperAdminSimple";
import SchoolSelection from "@/pages/SchoolSelection";
import SchoolDirectory from "@/pages/SchoolDirectory";
import PublicHome from "@/pages/PublicHome";
import Profile from "@/pages/Profile";
import Messages from "@/pages/Messages";
import TeacherSpecializations from "@/pages/TeacherSpecializations";
import StudentStatus from "@/pages/StudentStatus";

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [location, navigate] = useLocation();
  
  React.useEffect(() => {
    // If user is authenticated and on a school selection route without a subpage,
    // redirect to the home page within that school
    if (user && location.match(/^\/school\/[^/]+$/)) {
      const schoolCode = location.split('/')[2];
      navigate(`/school/${schoolCode}/home`);
    }
  }, [user, location, navigate]);
  
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



function AppRoutes() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={PublicHome} />
      <Route path="/schools" component={SchoolDirectory} />
      
      {/* Hidden Super Admin Access Route */}
      <Route path="/system/super-admin-access" component={SuperAdminSimple} />
      
      {/* School Selection Route */}
      <Route path="/school/:code">
        {(params) => <SchoolSelection schoolCode={params.code} />}
      </Route>
      
      {/* School-specific authenticated routes */}
      <Route path="/school/:code/:page*">
        {(params) => (
          <AuthWrapper>
            <Layout>
              <Switch>
                <Route path={`/school/${params.code}/home`} component={Home} />
                <Route path={`/school/${params.code}/schedule`} component={Schedule} />
                <Route path={`/school/${params.code}/teachers`} component={Teachers} />
                <Route path={`/school/${params.code}/messages`} component={Messages} />
                <Route path={`/school/${params.code}/suggestions`} component={Suggestions} />
                <Route path={`/school/${params.code}/blog`} component={Blog} />
                <Route path={`/school/${params.code}/groups`} component={Groups} />
                <Route path={`/school/${params.code}/formations`} component={Formations} />
                <Route path={`/school/${params.code}/announcements`} component={Announcements} />
                <Route path={`/school/${params.code}/profile`} component={Profile} />
                <Route path={`/school/${params.code}/student-status`} component={StudentStatus} />
                <Route path={`/school/${params.code}/teacher-specializations`} component={TeacherSpecializations} />
                <Route path={`/school/${params.code}/admin`} component={AdminPanelTest} />
                <Route path={`/school/${params.code}/admin/users`} component={AdminUsers} />
                <Route path={`/school/${params.code}/admin/content`} component={AdminContent} />
                <Route path={`/school/${params.code}/admin/suggestions`} component={AdminSuggestions} />
                <Route path={`/school/${params.code}/admin/verification`} component={AdminVerification} />
                <Route path={`/school/${params.code}/admin/reports`} component={AdminReports} />
                <Route component={NotFound} />
              </Switch>
            </Layout>
          </AuthWrapper>
        )}
      </Route>
      
      {/* Regular App Routes (for backward compatibility) */}
      <Route>
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
              <Route path="/profile" component={Profile} />
              <Route path="/student-status" component={StudentStatus} />
              <Route path="/teacher-specializations" component={TeacherSpecializations} />
              <Route path="/admin" component={AdminPanelTest} />
              <Route path="/admin/users" component={AdminUsers} />
              <Route path="/admin/content" component={AdminContent} />
              <Route path="/admin/suggestions" component={AdminSuggestions} />
              <Route path="/admin/verification" component={AdminVerification} />
              <Route path="/admin/reports" component={AdminReports} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
        </AuthWrapper>
      </Route>
    </Switch>
  );
}



function Router() {
  return <AppRoutes />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-md mx-auto bg-white min-h-screen">
            <Router />
          </div>
          <Toaster />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
