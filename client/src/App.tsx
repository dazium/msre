import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
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

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/customers"} component={Customers} />
      <Route path={"/projects"} component={Projects} />
      <Route path={"/damages"} component={Damages} />
      <Route path={"/photos/:projectId"} component={Photos} />
      <Route path={"/estimates"} component={Estimates} />
      <Route path={"/calendar"} component={Calendar} />
      <Route path={"/maps"} component={Maps} />
      <Route path={"/route-optimization"} component={RouteOptimization} />
      <Route path={"/materials"} component={Materials} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
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
