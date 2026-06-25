import React, { useEffect, useState } from "react";
import {
  CalendarDays,
  FileUp,
  Headphones,
  Home,
  Image,
  LayoutDashboard,
  Layers,
  Menu,
  MessageSquare,
  ReceiptText,
  Search,
  Settings,
  ShoppingBag,
  Bell,
  Users,
  Megaphone,
  Wrench,
  ClipboardList,
  History,
  CreditCard,
} from "lucide-react";

import DashboardPage from "./pages/Dashboard";
import ServicesPage from "./pages/Services";
import ServiceRequestsPage from "./pages/ServiceRequests";
import ProjectsPage from "./pages/Projects";
import ProjectDetailsPage from "./pages/ProjectDetails";
import InvoicesPage from "./pages/Invoices";
import TicketsPage from "./pages/Tickets";
import FilesPage from "./pages/Files";
import AppointmentsPage from "./pages/Appointments";
import SettingsPage from "./pages/Settings";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import UsersPage from "./pages/Users";
import UserDetailsPage from "./pages/UserDetails";
import CampaignsPage from "./pages/Campaigns";
import InvoiceDetailsPage from "./pages/InvoiceDetails";
import ChangePassword from "./pages/ChangePassword";
import AdminServicesPage from "./pages/AdminServices";
import AdminRequests from "./pages/AdminRequests";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import MessagesPage from "./pages/Messages";
import MessageLogPage from "./pages/MessageLog";
import AdminPaymentsPage from "./pages/AdminPayments";
import AdminBannerPage from "./pages/AdminBanner";
import { apiGet, apiPatch } from "./lib/api";

const ADMIN_ROLES = ["ADMIN"];
const STAFF_ROLES = ["ADMIN", "STAFF"];

function isAdminRole(role) {
  return ADMIN_ROLES.includes(role);
}
function isStaffRole(role) {
  return STAFF_ROLES.includes(role);
}

function Sidebar({ page, setPage, isLoggedIn, user, serviceGroups, unreadMessages, isOpen, onClose }) {
  if (!isLoggedIn) return null;

  function nav(label) { setPage(label); onClose && onClose(); }

  const role = user?.role;
  const isAdmin = isAdminRole(role);
  const isStaff = isStaffRole(role);

  const clientItems = [
    ["Dashboard", LayoutDashboard],
    ["Request Service", ShoppingBag],
    ["Services", Layers],
    ["Projects", Home],
    ["Invoices", ReceiptText],
    ["Files & Documents", FileUp],
    ["Appointments", CalendarDays],
    ["Messages", MessageSquare],
    ["Settings", Settings],
  ];

  const adminItems = [
    ["Dashboard", LayoutDashboard],
    ["Users", Users],
    ["Request Service", ShoppingBag],
    ["Projects", Home],
    ["Invoices", ReceiptText],
    ["Files & Documents", FileUp],
    ["Appointments", CalendarDays],
    ["Messages", MessageSquare],
    ["Message Log", History],
    ["Email Campaigns", Megaphone],
    ["Admin Services", Wrench],
    ["Admin Requests", ClipboardList],
    ["Banner Editor", Image],
    ["Payments", CreditCard],
    ["Settings", Settings],
  ];

  const items = isStaff ? adminItems : clientItems;

  return (
    <aside className={`sidebar${isOpen ? " open" : ""}`}>
      <img
        src="/assets/JPS%20Core-2.png"
        className="logo"
        alt="JPS Core"
      />

      <nav>
        {items.map(([label, Icon]) => (
          <button
            key={label}
            onClick={() => nav(label)}
            className={page === label ? "active" : ""}
          >
            <Icon size={18} />
            {label}
            {label === "Messages" && unreadMessages > 0 && (
              <span className="nav-unread-badge">{unreadMessages > 99 ? "99+" : unreadMessages}</span>
            )}
          </button>
        ))}

        {serviceGroups && serviceGroups.length > 0 && (
          <div className="sidebar-services">
            <p className="sidebar-services-label">Our Services</p>
            {serviceGroups.map((group) => (
              <button
                key={group.id}
                className="sidebar-service-item"
                onClick={() => setPage("Services")}
                title={group.description || group.name}
              >
                <span className="sidebar-service-dot" />
                {group.name}
              </button>
            ))}
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <button
          onClick={() => nav("Support Tickets")}
          className={page === "Support Tickets" ? "active" : ""}
        >
          <Headphones size={18} />
          Support Tickets
        </button>
      </div>

      <div className="help-card">
        <Headphones />
        <h3>Need Help?</h3>
        <p>Schedule a call or open a support ticket.</p>
        <button className="green-btn" onClick={() => nav("Appointments")}>
          Schedule Appointment
        </button>
      </div>
    </aside>
  );
}

function AccessDenied() {
  return (
    <div className="panel">
      <h2>Access Restricted</h2>
      <p>You do not have permission to view this page.</p>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("page") === "reset-password" && params.get("token")) return "Reset Password";
    if (params.get("page") === "invoice-paid") return "Invoices";
    const token = localStorage.getItem("token");
    return token ? "Dashboard" : "Login";
  });

  const [resetToken, setResetToken] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token") || "";
  });

  const [user, setUser] = useState(() => {
    return JSON.parse(localStorage.getItem("user") || "{}");
  });

  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [serviceGroups, setServiceGroups] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLoggedIn = Boolean(localStorage.getItem("token"));
  const role = user?.role;

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser({});
    setPage("Login");
  }

  // Listen for forced logout from API client
  useEffect(() => {
    function onAuthLogout() {
      handleLogout();
    }
    window.addEventListener("auth:logout", onAuthLogout);
    return () => window.removeEventListener("auth:logout", onAuthLogout);
  }, []);

  async function loadNotifications() {
    if (!user?.id) return;

    try {
      const data = await apiGet(`/notifications/${user.id}`);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    }
  }, [user?.id]);

  useEffect(() => {
    apiGet("/service-catalog/groups")
      .then((data) => setServiceGroups(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  function loadUnreadMessages() {
    if (!localStorage.getItem("token")) return;
    apiGet("/project-messages/unread-count")
      .then((data) => setUnreadMessages(data?.count || 0))
      .catch(() => {});
  }

  useEffect(() => {
    if (user?.id) loadUnreadMessages();
  }, [user?.id]);

  // Refresh unread count when leaving Messages page
  useEffect(() => {
    if (page !== "Messages") loadUnreadMessages();
  }, [page]);

  // Close sidebar on page navigation
  useEffect(() => { setSidebarOpen(false); }, [page]);

  async function markNotificationRead(id) {
    try {
      await apiPatch(`/notifications/${id}/read`, {});
      loadNotifications();
    } catch (error) {
      console.error(error);
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Admin-only pages
  const adminOnlyPages = ["Users", "User Details", "Email Campaigns", "Admin Services", "Admin Requests", "Payments", "Banner Editor"];

  function renderPage() {
    // Auth pages (no login required)
    if (page === "Login") return <LoginPage setPage={setPage} setUser={setUser} />;
    if (page === "Create Account") return <RegisterPage setPage={setPage} setUser={setUser} />;
    if (page === "Forgot Password") return <ForgotPassword setPage={setPage} />;
    if (page === "Reset Password") return <ResetPassword setPage={setPage} resetToken={resetToken} />;

    if (!isLoggedIn) {
      return <LoginPage setPage={setPage} setUser={setUser} />;
    }

    // Role protection for admin pages
    if (adminOnlyPages.includes(page) && !isAdminRole(role)) {
      return <AccessDenied />;
    }

    if (page === "Dashboard") return <DashboardPage user={user} setPage={setPage} />;
    if (page === "Request Service") return <ServiceRequestsPage user={user} />;
    if (page === "Services") return <ServicesPage setPage={setPage} />;
    if (page === "Projects") {
      return (
        <ProjectsPage
          setPage={setPage}
          setSelectedProject={setSelectedProject}
          user={user}
        />
      );
    }
    if (page === "Project Details") {
      return (
        <ProjectDetailsPage
          selectedProject={selectedProject}
          user={user}
        />
      );
    }
    if (page === "Invoices") {
      return (
        <InvoicesPage
          setPage={setPage}
          setSelectedInvoice={setSelectedInvoice}
          user={user}
        />
      );
    }
    if (page === "Invoice Details") {
      return (
        <InvoiceDetailsPage
          selectedInvoice={selectedInvoice}
          user={user}
        />
      );
    }
    if (page === "Support Tickets") return <TicketsPage user={user} />;
    if (page === "Files & Documents") return <FilesPage user={user} />;
    if (page === "Appointments") return <AppointmentsPage user={user} />;
    if (page === "Messages") return <MessagesPage user={user} />;
    if (page === "Message Log") return <MessageLogPage />;
    if (page === "Settings") return <SettingsPage setPage={setPage} user={user} />;
    if (page === "Change Password") return <ChangePassword user={user} />;
    if (page === "Email Campaigns") return <CampaignsPage />;
    if (page === "Admin Services") return <AdminServicesPage />;
    if (page === "Admin Requests") return <AdminRequests />;
    if (page === "Payments") return <AdminPaymentsPage />;
    if (page === "Banner Editor") return <AdminBannerPage />;
    if (page === "Users") {
      return (
        <UsersPage
          setPage={setPage}
          setSelectedUser={setSelectedUser}
        />
      );
    }
    if (page === "User Details") {
      return (
        <UserDetailsPage
          selectedUser={selectedUser}
          setPage={setPage}
        />
      );
    }

    return (
      <div className="panel">
        <h2>Page not found</h2>
        <p>The page you requested doesn't exist.</p>
      </div>
    );
  }

  // Auth pages render full-screen without sidebar/topbar
  const AUTH_PAGES = ["Login", "Create Account", "Forgot Password", "Reset Password"];
  if (AUTH_PAGES.includes(page)) {
    return <>{renderPage()}</>;
  }

  return (
    <main className="app">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar
        page={page}
        setPage={setPage}
        isLoggedIn={isLoggedIn}
        user={user}
        serviceGroups={serviceGroups}
        unreadMessages={unreadMessages}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <section className="content">
        <header className="topbar">
          <button className="menu-toggle" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle menu">
            <Menu size={22} />
          </button>
          <div className="search">
            <Search size={18} />
            <input placeholder="Search anything..." />
          </div>

          <button
            className="icon-btn"
            onClick={() => setPage("Settings")}
            title="Settings"
          >
            <Settings size={20} />
          </button>

          <div className="notification-wrap">
            <button
              className="icon-btn notification-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              title="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>

            {showNotifications && (
              <div className="notification-dropdown">
                <h4>Notifications</h4>

                {notifications.length === 0 ? (
                  <p>No notifications.</p>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`notification-item ${item.isRead ? "read" : ""}`}
                      onClick={() => markNotificationRead(item.id)}
                    >
                      <strong>{item.title}</strong>
                      <p>{item.message}</p>
                      <small>{new Date(item.createdAt).toLocaleString()}</small>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {user?.fullName ? (
            <div className="profile-box">
              <div className="profile">{user.fullName.charAt(0)}</div>
              <div>
                <strong>{user.fullName}</strong>
                <small>{user.role || "CLIENT"}</small>
              </div>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          ) : (
            <div className="profile-box">
              <button className="logout-btn" onClick={() => setPage("Login")}>
                Login
              </button>
              <button
                className="top-create-btn"
                onClick={() => setPage("Create Account")}
              >
                Create Account
              </button>
            </div>
          )}
        </header>

        <div className="page-content">
          {renderPage()}
        </div>

        <footer className="app-footer">
          <span>© {new Date().getFullYear()} JPSCore Inc. All rights reserved.</span>
          <div className="app-footer-links">
            <button className="app-footer-link">Terms of Service</button>
            <button className="app-footer-link">Privacy Policy</button>
          </div>
        </footer>
      </section>
    </main>
  );
}
