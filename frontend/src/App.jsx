/** All routes. Each role's pages sit behind ProtectedRoute, so e.g. a student can't open /admin. */
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { Spinner } from "./components/ui";
import { ROLE_HOME } from "./config";
import { useAuth } from "./context/AuthContext";
import AppLayout from "./layouts/AppLayout";
import PublicLayout from "./layouts/PublicLayout";
import AdminHome from "./pages/admin/Home";
import AdminResources from "./pages/admin/Resources";
import Questions from "./pages/admin/Questions";
import Users from "./pages/admin/Users";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Alerts from "./pages/counsellor/Alerts";
import CounsellorAppointments from "./pages/counsellor/Appointments";
import Availability from "./pages/counsellor/Availability";
import CounsellorHome from "./pages/counsellor/Home";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import StudentAppointments from "./pages/student/Appointments";
import Assessments from "./pages/student/Assessments";
import AssessmentTake from "./pages/student/AssessmentTake";
import Chat from "./pages/student/Chat";
import CheckIn from "./pages/student/CheckIn";
import Help from "./pages/student/Help";
import StudentHome from "./pages/student/Home";
import Resources from "./pages/student/Resources";
import Trends from "./pages/student/Trends";

// The design page exists only in development; it is not part of the production build
const DesignSystem = import.meta.env.DEV ? lazy(() => import("./pages/DesignSystem")) : null;

const ALL_ROLES = ["student", "counsellor", "admin"];

/** Login and register: already logged-in users go straight to their home. */
function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to={ROLE_HOME[user.role]} replace /> : children;
}

/** A role's pages, inside the app layout, protected by role. */
const RoleArea = ({ roles }) => (
  <ProtectedRoute roles={roles}>
    <AppLayout />
  </ProtectedRoute>
);

export default function App() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-brand-500"><Spinner size="lg" /></div>}>
      <Routes>
        {/* Public */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
          <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
        </Route>

        {/* Crisis screen: open to every logged-in role (the "Need help now?" pill is on every page) */}
        <Route element={<RoleArea roles={ALL_ROLES} />}>
          <Route path="/app/help" element={<Help />} />
        </Route>

        {/* Student */}
        <Route path="/app" element={<RoleArea roles={["student"]} />}>
          <Route index element={<StudentHome />} />
          <Route path="checkin" element={<CheckIn />} />
          <Route path="trends" element={<Trends />} />
          <Route path="assessments" element={<Assessments />} />
          <Route path="assessments/:type" element={<AssessmentTake />} />
          <Route path="resources" element={<Resources />} />
          <Route path="appointments" element={<StudentAppointments />} />
          <Route path="chat" element={<Chat />} />
        </Route>

        {/* Counsellor */}
        <Route path="/counsellor" element={<RoleArea roles={["counsellor"]} />}>
          <Route index element={<CounsellorHome />} />
          <Route path="availability" element={<Availability />} />
          <Route path="appointments" element={<CounsellorAppointments />} />
          <Route path="alerts" element={<Alerts />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<RoleArea roles={["admin"]} />}>
          <Route index element={<AdminHome />} />
          <Route path="users" element={<Users />} />
          <Route path="resources" element={<AdminResources />} />
          <Route path="questions" element={<Questions />} />
        </Route>

        {DesignSystem && <Route path="/design" element={<DesignSystem />} />}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
