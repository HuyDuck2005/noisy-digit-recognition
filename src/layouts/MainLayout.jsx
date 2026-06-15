import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Layout/Sidebar";
import Header from "../components/Layout/Header";

const MainLayout = () => {
  return (
    <div className="flex w-full min-h-screen bg-[#071526] overflow-x-hidden">
      <Sidebar />
      <main className="flex flex-col flex-1 h-screen overflow-hidden min-w-0">
        <Header />
        <div className="flex-1 overflow-y-auto overflow-x-hidden page-wrap">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;