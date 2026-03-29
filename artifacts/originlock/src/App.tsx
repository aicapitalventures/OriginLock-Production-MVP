import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { AuthProvider, ProtectedRoute } from "@/hooks/use-auth";

import { Landing } from "@/pages/public/Landing";
import { Verify } from "@/pages/public/Verify";
import { VerifyDetail } from "@/pages/public/VerifyDetail";
import { Login } from "@/pages/public/Login";
import { Signup } from "@/pages/public/Signup";
import { Pricing } from "@/pages/public/Pricing";
import { ForgotPassword } from "@/pages/public/ForgotPassword";
import { Terms, Privacy, LegalDisclaimer } from "@/pages/public/Legal";

import { Dashboard } from "@/pages/auth/Dashboard";
import { Upload } from "@/pages/auth/Upload";
import { FileList } from "@/pages/auth/FileList";
import { FileDetail } from "@/pages/auth/FileDetail";
import { Projects } from "@/pages/auth/Projects";
import { ProjectDetail } from "@/pages/auth/ProjectDetail";
import { Profile } from "@/pages/auth/Profile";
import { Settings } from "@/pages/auth/Settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/verify" component={Verify} />
      <Route path="/verify/:certificateId" component={VerifyDetail} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/legal" component={LegalDisclaimer} />

      <Route path="/dashboard">
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      </Route>
      <Route path="/dashboard/upload">
        <ProtectedRoute><Upload /></ProtectedRoute>
      </Route>
      <Route path="/dashboard/files">
        <ProtectedRoute><FileList /></ProtectedRoute>
      </Route>
      <Route path="/dashboard/files/:id">
        <ProtectedRoute><FileDetail /></ProtectedRoute>
      </Route>
      <Route path="/dashboard/projects">
        <ProtectedRoute><Projects /></ProtectedRoute>
      </Route>
      <Route path="/dashboard/projects/:id">
        <ProtectedRoute><ProjectDetail /></ProtectedRoute>
      </Route>
      <Route path="/dashboard/profile">
        <ProtectedRoute><Profile /></ProtectedRoute>
      </Route>
      <Route path="/dashboard/settings">
        <ProtectedRoute><Settings /></ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
