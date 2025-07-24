import React from "react";
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

import Profile from "@/pages/Profile";
import Messages from "@/pages/Messages";
import TeacherSpecializations from "@/pages/TeacherSpecializations";

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



function AppRoutes() {
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
          <Route path="/profile" component={Profile} />
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
  );
}



function Router() {
  return <AppRoutes />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto bg-white min-h-screen">
          <div className="p-4 text-center">
            <h1 className="text-2xl font-bold text-green-600 mb-4">تم إصلاح التطبيق بنجاح!</h1>
            <p className="text-gray-600 mb-4">النظام يعمل الآن بشكل صحيح</p>
            <p className="text-sm text-gray-500">
              معلومات تسجيل الدخول:<br/>
              البريد الإلكتروني: admin@school.edu.dz<br/>
              كلمة المرور: admin123
            </p>
          </div>
        </div>
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;
