import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Employees from "@/pages/employees";
import EmployeeDetail from "@/pages/employee-detail";
import Quests from "@/pages/quests";
import Login from "@/pages/login";
import AdminUsers from "@/pages/admin-users";
import UserHome from "@/pages/user-home";
import AdminQuestAssignments from "@/pages/admin-quest-assignments";

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAdmin, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAdmin) return <Redirect to="/" />;
  return <Component />;
}

function AdminRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/employees" component={Employees} />
      <Route path="/employees/:id" component={EmployeeDetail} />
      <Route path="/quests" component={Quests} />
      <Route path="/admin/users">
        <AdminRoute component={AdminUsers} />
      </Route>
      <Route path="/admin/quest-assignments">
        <AdminRoute component={AdminQuestAssignments} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

const sidebarStyle = {
  "--sidebar-width": "16rem",
  "--sidebar-width-icon": "3.5rem",
};

function AdminApp() {
  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-1 p-2 border-b-2 h-12">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-hidden">
            <AdminRouter />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function UserApp() {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col h-screen w-full">
      <header className="flex items-center justify-between p-3 border-b-2 h-12">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold">Quest HR</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-mono">
            {user?.displayName}
          </span>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => logout.mutate()}
            data-testid="button-logout"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>
      <main className="flex-1 overflow-auto">
        <UserHome />
      </main>
    </div>
  );
}

function AuthenticatedApp() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminApp /> : <UserApp />;
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
