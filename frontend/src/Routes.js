import React from 'react';
import {Routes, Route, Navigate} from 'react-router-dom';
import RequireRole from "./components/RequireRole.comp.jsx";
import Home from "./pages/Home/Home.page";
import Points from "./pages/Points/Points.page";
import Profile from "./pages/Profile/Profile.page";
import Transactions from "./pages/Transaction/Transactions.page";
import Events from "./pages/Event/Events.page";
import Promotions from "./pages/Promotions/Promotions.page";
import Redemption from "./pages/Redemption/Redemption.page";
import Transfer from "./pages/Transfer/Transfer.page";
import QR from "./pages/QR/QR.page";
import Login from "./pages/Login/Login.page";
import Dashboard from "./pages/Dashboard/Dashboard.page";
import ResetRequest from "./pages/ResetRequest/ResetRequest.page";
import ResetPassword from "./pages/ResetPassword/ResetPassword.page";
import CashierCreate from "./pages/Cashier/CashierCreate.page";
import CashierProcess from "./pages/Cashier/CashierProcess.page";
import ManagerUsers from "./pages/Manager/ManagerUsers.page";
import ManagerTransactions from "./pages/Manager/ManagerTransactions.page";
import ManagerPromotions from "./pages/Manager/ManagerPromotions.page";
import ManagerEvents from "./pages/Manager/ManagerEvents.page";
import EventCreate from "./pages/Event/EventCreate.page";
import EventEdit from "./pages/Event/EventEdit.page";
import Event from "./pages/Event/Event.page";
import CashierCreateUser from "./pages/Cashier/CashierCreateUser.page";

const MyRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/resets" element={<ResetRequest />} />
            <Route path="/auth/resets/:resetToken" element={<ResetPassword />} />
            <Route
                path="/dashboard"
                element={
                    <RequireRole>
                        <Dashboard />
                    </RequireRole>
                }
            />
            <Route
                path="/points"
                element={
                    <RequireRole>
                        <Points />
                    </RequireRole>
                }
            />
            <Route
                path="/qr"
                element={
                    <RequireRole>
                        <QR />
                    </RequireRole>
                }
            />
            <Route
                path="/transfer"
                element={
                    <RequireRole>
                        <Transfer />
                    </RequireRole>
                }
            />
            <Route
                path="/redemption"
                element={
                    <RequireRole>
                        <Redemption />
                    </RequireRole>
                }
            />
            <Route
                path="/promotions"
                element={<Promotions />}
            />
            <Route
                path="/events"
                element={<Events />}
            />
            <Route
                path="/events/create"
                element={
                    <RequireRole allowedRoles={["manager","organizer","superuser"]}>
                        <EventCreate />
                    </RequireRole>
                }
            />
            <Route
                path="/events/:eventId/edit"
                element={
                    <RequireRole allowedRoles={["manager","organizer","superuser"]}>
                        <EventEdit />
                    </RequireRole>
                }
            />
            <Route
                path="/events/:eventId"
                element={
                    <RequireRole>
                        <Event />
                    </RequireRole>
                }
            />
            <Route
                path="/transactions"
                element={
                    <RequireRole>
                        <Transactions />
                    </RequireRole>
                }
            />
            <Route
                path="/profile"
                element={
                    <RequireRole>
                        <Profile />
                    </RequireRole>
                }
            />
            <Route
                path="/cashier/create"
                element={
                    <RequireRole allowedRoles={["cashier", "manager", "superuser"]}>
                        <CashierCreate />
                    </RequireRole>
                }
            />
            <Route
                path="/cashier/users/create"
                element={
                    <RequireRole allowedRoles={["cashier", "manager", "superuser"]}>
                        <CashierCreateUser />
                    </RequireRole>
                }
            />
            <Route
                path="/cashier/process"
                element={
                    <RequireRole allowedRoles={["cashier", "manager", "superuser"]}>
                        <CashierProcess />
                    </RequireRole>
                }
            />
            <Route
                path="/manager/users"
                element={
                    <RequireRole allowedRoles={["manager", "superuser"]}>
                        <ManagerUsers />
                    </RequireRole>
                }
            />
            <Route
                path="/manager/transactions"
                element={
                    <RequireRole allowedRoles={["manager", "superuser"]}>
                        <ManagerTransactions />
                    </RequireRole>
                }
            />
            <Route
                path="/manager/promotions"
                element={
                    <RequireRole allowedRoles={["manager", "superuser"]}>
                        <ManagerPromotions />
                    </RequireRole>
                }
            />
            <Route
                path="/manager/events"
                element={
                    <RequireRole allowedRoles={["manager", "organizer", "superuser"]}>
                        <ManagerEvents />
                    </RequireRole>
                }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

export default MyRoutes;