import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import Customers from "./pages/Customers";
import Projects from "./pages/Projects";
import Damages from "./pages/Damages";
import Photos from "./pages/Photos";
import Calendar from "./pages/Calendar";
import Estimates from "./pages/Estimates";
import Maps from "./pages/Maps";
import RouteOptimization from "./pages/RouteOptimization";
import Materials from "./pages/Materials";
import ProjectDetail from "./pages/ProjectDetail";
import CrewApp from "./pages/CrewApp";
import Crews from "./pages/Crews";
import Invoices from "@/pages/Invoices";
import InvoiceDetail from "@/pages/InvoiceDetail";
import InvoiceTemplates from "@/pages/InvoiceTemplates";
import FinancialDashboard from "@/pages/FinancialDashboard";
import FinancialReports from "@/pages/FinancialReports";
import CustomerDetail from "@/pages/CustomerDetail";
import CrewDetail from "@/pages/CrewDetail";
import EstimateDetail from "@/pages/EstimateDetail";
import CrewAvailability from "@/pages/CrewAvailability";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/customers"} component={Customers} />
        <Route path={"/customers/:id"} component={CustomerDetail} />
        <Route path={"/projects"} component={Projects} />
        <Route path={"/projects/:id"} component={ProjectDetail} />
        <Route path={"/damages"} component={Damages} />
        <Route path={"/photos/:projectId"} component={Photos} />
        <Route path={"/estimates"} component={Estimates} />
        <Route path={"/estimates/:id"} component={EstimateDetail} />
        <Route path={"/calendar"} component={Calendar} />
        <Route path={"/maps"} component={Maps} />
        <Route path={"/route-optimization"} component={RouteOptimization} />
        <Route path={"/materials"} component={Materials} />
        <Route path={"/crew"} component={CrewApp} />
        <Route path={"/crews"} component={Crews} />
        <Route path={"/crews/:id"} component={CrewDetail} />
        <Route path={"/crew-availability"} component={CrewAvailability} />
        <Route path={"/invoices"} component={Invoices} />
        <Route path={"/invoices/:id"} component={InvoiceDetail} />
        <Route path={"/invoice-templates"} component={InvoiceTemplates} />
        <Route path="/financial-dashboard" component={FinancialDashboard} />
        <Route path="/financial-reports" component={FinancialReports} />
        <Route path="/404" component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
