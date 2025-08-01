import React from "react";
import Navbar from "../Navbar";
import Footer from "../Footer";
import { Outlet } from "react-router-dom"; 

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-100 p-6">
        <Outlet /> 
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
