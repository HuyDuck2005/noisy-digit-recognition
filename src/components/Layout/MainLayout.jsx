import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const MainLayout = () => {
  return (
    <div className="flex w-full min-h-screen bg-slate-50 dark:bg-[#071526] transition-colors duration-300 overflow-x-hidden">
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
