
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/Navbar';
import Index from '@/pages/Index';
import Orders from '@/pages/Orders';
import Children from '@/pages/Children';
import Auth from '@/pages/Auth';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import FoodManagement from '@/pages/admin/FoodManagement';
import OrderManagement from '@/pages/admin/OrderManagement';
import OrderRecap from '@/pages/admin/OrderRecap';
import Reports from '@/pages/admin/Reports';
import ScheduleManagement from '@/pages/admin/ScheduleManagement';
import PopulateDailyMenus from '@/pages/admin/PopulateDailyMenus';
import UserManagement from '@/pages/admin/UserManagement';
import MidtransScript from '@/components/MidtransScript';
import CashierDashboard from '@/pages/cashier/CashierDashboard';
import CashierReports from '@/pages/cashier/CashierReports';
import { useUserRole } from '@/hooks/useUserRole';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { role: userRole, loading: roleLoading } = useUserRole();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!user);
  }, [user]);

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();
  
    if (authLoading || roleLoading) {
      return <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500"></div>
      </div>;
    }
  
    if (!isLoggedIn) {
      return <Navigate to="/login" replace state={{ from: location }} />;
    }
  
    return <>{children}</>;
  };

  if (authLoading || roleLoading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MidtransScript />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth />} />
        <Route path="/menu" element={<><Navbar /><Index /></>} />
        
        {/* Protected routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Routes>
                {/* Role-based default route */}
                <Route path="/" element={
                  userRole === 'admin' ? <Navigate to="/admin" replace /> :
                  userRole === 'cashier' ? <Navigate to="/cashier" replace /> :
                  <><Navbar /><Index /></>
                } />
                
                {/* Parent routes */}
                {userRole === 'parent' && (
                  <>
                    <Route path="/orders" element={<><Navbar /><Orders /></>} />
                    <Route path="/children" element={<><Navbar /><Children /></>} />
                  </>
                )}
                
                {/* Admin routes */}
                {userRole === 'admin' && (
                  <>
                    <Route path="/admin" element={<><Navbar /><AdminDashboard /></>} />
                    <Route path="/admin/food-management" element={<><Navbar /><FoodManagement /></>} />
                    <Route path="/admin/order-management" element={<><Navbar /><OrderManagement /></>} />
                    <Route path="/admin/order-recap" element={<><Navbar /><OrderRecap /></>} />
                    <Route path="/admin/reports" element={<><Navbar /><Reports /></>} />
                    <Route path="/admin/schedule-management" element={<><Navbar /><ScheduleManagement /></>} />
                    <Route path="/admin/populate-daily-menus" element={<><Navbar /><PopulateDailyMenus /></>} />
                    <Route path="/admin/user-management" element={<><Navbar /><UserManagement /></>} />
                  </>
                )}
                
                {/* Cashier routes */}
                {userRole === 'cashier' && (
                  <>
                    <Route path="/cashier" element={<><Navbar /><CashierDashboard /></>} />
                    <Route path="/cashier/reports" element={<><Navbar /><CashierReports /></>} />
                  </>
                )}
                
                {/* Default route - redirect to appropriate dashboard */}
                <Route path="*" element={
                  <Navigate to={
                    userRole === 'admin' ? '/admin' :
                    userRole === 'cashier' ? '/cashier' :
                    '/'
                  } replace />
                } />
              </Routes>
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
