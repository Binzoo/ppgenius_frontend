import React from "react";
import { Outlet } from "react-router-dom";

const PrivateLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-900 text-white p-4">
        <h2>Admin Dashboard</h2>
      </header>
      <main className="flex-grow p-6 bg-gray-100">
        <Outlet />
      </main>
      <footer className="bg-gray-800 text-white text-center p-4">
        &copy; {new Date().getFullYear()} Admin Panel
      </footer>
    </div>
  );
};

export default PrivateLayout;
