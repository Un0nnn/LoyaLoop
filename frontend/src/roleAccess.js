export const roleHomeRoutes = {
    // All roles land on the home page (Overview)
    regular: "/home",
    cashier: "/home",
    manager: "/home",
    organizer: "/home",
    superuser: "/home",
};

const baseNav = [
    { key: "home", label: "Overview", to: "/home" },
    { key: "dashboard", label: "Dashboard", to: "/dashboard" },
    { key: "points", label: "Points", to: "/points" },
    { key: "qr", label: "My QR", to: "/qr?mode=user" },
    { key: "transfer", label: "Transfer", to: "/transfer" },
    { key: "redemption", label: "Redemptions", to: "/redemption" },
    { key: "promotions", label: "Promotions", to: "/promotions" },
    { key: "events", label: "Events", to: "/events" },
    { key: "transactions", label: "Transactions", to: "/transactions" },
    { key: "profile", label: "Profile", to: "/profile" },
];

export const roleNavigation = {
    // Regular users get the base nav
    regular: baseNav,
    // For other roles, ensure Overview is first, then role-specific shortcuts
    cashier: [
        { key: "home", label: "Overview", to: "/home" },
        baseNav[1], // Dashboard
        { key: "cashier-create", label: "Create Transaction", to: "/cashier/create" },
        { key: "cashier-create-user", label: "Create User", to: "/cashier/users/create" },
        { key: "cashier-process", label: "Process Redemption", to: "/cashier/process" },
        baseNav[2], // Points
        { key: "profile", label: "Profile", to: "/profile" },
    ],
    manager: [
        { key: "home", label: "Overview", to: "/home" },
        baseNav[1], // Dashboard
        { key: "users", label: "Users", to: "/manager/users" },
        { key: "transactions", label: "Transactions", to: "/manager/transactions" },
        { key: "promotions", label: "Promotions", to: "/manager/promotions" },
        { key: "events", label: "Events", to: "/events" },
        baseNav[2], // Points
        { key: "profile", label: "Profile", to: "/profile" },
    ],
    organizer: [
        { key: "home", label: "Overview", to: "/home" },
        baseNav[1], // Dashboard
        { key: "events", label: "Events", to: "/events" },
        baseNav[2], // Points
        { key: "profile", label: "Profile", to: "/profile" },
    ],
    superuser: [
        { key: "home", label: "Overview", to: "/home" },
        baseNav[1], // Dashboard
        { key: "users", label: "Users", to: "/manager/users" },
        { key: "transactions", label: "Transactions", to: "/manager/transactions" },
        { key: "promotions", label: "Promotions", to: "/manager/promotions" },
        { key: "events", label: "Events", to: "/events" },
        baseNav[2], // Points
        { key: "profile", label: "Profile", to: "/profile" },
    ],
};

export const getHomeRouteForRole = (role) => roleHomeRoutes[role] || "/home";

export const getNavigationForRole = (role) => roleNavigation[role] || baseNav;
