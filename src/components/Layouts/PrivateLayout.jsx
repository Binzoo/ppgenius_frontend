import React, { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Menu, X, Heart, User, Activity, LogOut, Home } from "lucide-react";

const PrivateLayout = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login"); 
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Navigation items
  const navItems = [
    {
      to: "/dashboard",
      icon: Home,
      label: "Dashboard",
      description: "View health analyses"
    },
    {
      to: "/livemeasurment", 
      icon: Activity,
      label: "Live Heart Measurement",
      description: "Take new measurement"
    },
    {
      to: "/healthProfile",
      icon: User, 
      label: "User Profile",
      description: "Account settings"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo Section - Responsive */}
            <Link to="/dashboard" className="flex items-center space-x-3 group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <Heart className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <div className="text-lg sm:text-xl font-bold text-gray-900">POCKET HEALTH</div>
                <div className="text-xs text-gray-500 -mt-1">Health Analytics</div>
              </div>
              {/* Mobile-only short title */}
              <div className="sm:hidden">
                <div className="text-lg font-bold text-gray-900">PH</div>
              </div>
            </Link>

            {/* Desktop Navigation - Hidden on mobile */}
            <nav className="hidden md:flex space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center space-x-2 px-3 lg:px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                >
                  <item.icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{item.label}</span>
                  <span className="lg:hidden">{item.label.split(' ')[0]}</span>
                </Link>
              ))}
            </nav>

            {/* Desktop Logout & Mobile Menu Button */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Desktop Logout - Hidden on mobile */}
              <button
                onClick={handleLogout}
                className="hidden md:flex items-center space-x-2 px-3 lg:px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:inline">Log Out</span>
                <span className="lg:hidden">Exit</span>
              </button>

              {/* Mobile Menu Button - Only visible on mobile */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu - Only visible when open */}
        {isMobileMenuOpen && (
          <>
            {/* Backdrop for mobile menu */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-25 z-40 md:hidden"
              onClick={closeMobileMenu}
            ></div>

            {/* Mobile Menu Panel */}
            <div className="absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-50 md:hidden">
              <div className="px-4 py-2 space-y-1 max-h-96 overflow-y-auto">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={closeMobileMenu}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 active:bg-blue-100"
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{item.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                    </div>
                  </Link>
                ))}

                {/* Mobile Logout Button */}
                <button
                  onClick={() => {
                    closeMobileMenu();
                    handleLogout();
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 mt-2 pt-4 border-t border-gray-100 active:bg-red-100"
                >
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">Log Out</div>
                    <div className="text-xs text-red-500 mt-0.5">Sign out of account</div>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-h-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
          <Outlet />
        </div>
      </main>

      {/* Footer - Responsive */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
              © {new Date().getFullYear()} Pocket Health - Health Analytics Platform
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 text-xs text-gray-500">
              <span>Version 1.0</span>
              <span>•</span>
              <span className="hidden sm:inline">Secure & Private</span>
              <span className="sm:hidden">Secure</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivateLayout;