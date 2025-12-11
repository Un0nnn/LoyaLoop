import './App.css';
import '../src/styles/main.scss'
import '../src/styles/__variables.scss'
import {BrowserRouter, useLocation, useNavigate} from 'react-router-dom'
import {ThemeProvider} from "@mui/material";
import { useMemo, useEffect } from 'react';
import { buildTheme } from "./theme";
import MyRoutes from "./Routes"
import {AuthProvider, useAuth} from './context/auth';
import Sidebar from "./components/Sidebar.comp.jsx";
import { NotificationProvider } from './context/notification';
import { ThemeModeProvider, useThemeMode } from './context/themeMode';
import UserInfo from "./components/UserInfo.comp";
import DragHintPopup from "./components/DragHintPopup.comp";
import { getNavigationForRole, getHomeRouteForRole } from "./roleAccess";

const Shell = () => {
    const { currentUser, activeInterface } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const isLoginRoute = location.pathname === '/login';
    const isResetRoute = location.pathname.startsWith('/auth/reset');
    const { mode } = useThemeMode();
    const theme = useMemo(() => buildTheme(mode), [mode]);

    // Watch for interface changes and validate current route
    useEffect(() => {
        if (!currentUser || !activeInterface) return;

        const effectiveRole = activeInterface || currentUser?.role;
        const allowedRoutes = getNavigationForRole(effectiveRole);
        const currentPath = location.pathname;

        // Always allow these common routes regardless of interface
        const alwaysAllowedRoutes = [
            '/',
            '/home',
            '/login',
            '/profile',
            '/dashboard',
            '/points',
        ];

        // Check if it's an always allowed route
        if (alwaysAllowedRoutes.includes(currentPath)) {
            return;
        }

        // Check if it's a login or reset route
        if (isLoginRoute || isResetRoute) {
            return;
        }

        // Always allow event-related routes if user has access to events
        // This includes /events, /events/:id, /events/:id/edit, /events/create, etc.
        if (currentPath.startsWith('/events')) {
            // Check if user has access to ANY events route (regular or manager)
            const hasEventsAccess = allowedRoutes.some(route => {
                const routePath = route.to.split('?')[0];
                return routePath === '/events' || routePath === '/manager/events';
            });

            if (hasEventsAccess) {
                return; // Allow all event routes
            }
        }

        // Always allow manager routes for users with manager access
        if (currentPath.startsWith('/manager/')) {
            const hasManagerAccess = allowedRoutes.some(route => {
                const routePath = route.to.split('?')[0];
                return routePath.startsWith('/manager/');
            });

            if (hasManagerAccess) {
                return; // Allow all manager routes
            }
        }

        // Always allow cashier routes for users with cashier access
        if (currentPath.startsWith('/cashier/')) {
            const hasCashierAccess = allowedRoutes.some(route => {
                const routePath = route.to.split('?')[0];
                return routePath.startsWith('/cashier/');
            });

            if (hasCashierAccess) {
                return; // Allow all cashier routes
            }
        }

        // Check if current path is in the allowed routes for this interface
        const isRouteAllowed = allowedRoutes.some(route => {
            // Extract pathname from route.to (remove query params)
            const routePath = route.to.split('?')[0];

            // Check exact match
            if (currentPath === routePath) {
                return true;
            }

            // Check if current path is a nested route under this base route
            if (currentPath.startsWith(routePath + '/')) {
                return true;
            }

            return false;
        });

        // If current route is not allowed for this interface, redirect to home
        if (!isRouteAllowed) {
            console.log(`Route ${currentPath} not available for ${effectiveRole} interface, redirecting to home`);
            navigate(getHomeRouteForRole(effectiveRole), { replace: true });
        }
    }, [activeInterface, currentUser, location.pathname, navigate, isLoginRoute, isResetRoute]);

    let mainClass = currentUser ? 'container container--authed' : 'container container--guest';
    if (!currentUser && isLoginRoute) {
        mainClass = 'container container--public';
    }

    return (
        <ThemeProvider theme={theme}>
            <div className="app-shell-blur" />
            {currentUser && (
                <>
                    <Sidebar />
                    <UserInfo />
                    <DragHintPopup />
                </>
            )}
            <main className={mainClass}>
                {currentUser ? (
                    <div className="app-main__viewport">
                        <MyRoutes />
                    </div>
                ) : (
                    <>
                        <MyRoutes />
                    </>
                )}
            </main>
        </ThemeProvider>
    );
};

function App() {
  return (
      <BrowserRouter>
          <ThemeModeProvider>
              <NotificationProvider>
                  <AuthProvider>
                      <Shell />
                  </AuthProvider>
              </NotificationProvider>
          </ThemeModeProvider>
      </BrowserRouter>
  );
}

export default App;
