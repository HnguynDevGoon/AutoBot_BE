"use client";
import "./globals.css";
import Header from "@/components/client/layouts/header";
import Footer from "@/components/client/layouts/footer";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { AnimatePresence } from "framer-motion";
import { Provider } from "react-redux";
import { persistor, store } from "@/redux/store";
import { useAutoLogin } from "@/hooks/useAutoLogin";
import ProtectedRoute from "@/components/auth/protechRoute";
import { PersistGate } from "redux-persist/integration/react";
import { useCallback, useEffect, useState } from "react";
import Sidebar from "@/components/admin/layouts/sidebar";
import HeaderAdmin from "@/components/admin/layouts/header";
import Chat from "@/components/client/chat/chat";

function AppWrapper({ children }: { children: React.ReactNode }) {
  useAutoLogin();
  return <>{children}</>;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [search, setSearch] = useState("");
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthRoute = pathname.startsWith("/auth");
  const isAdminRoute = pathname.startsWith("/admin");
  const isInformationRoute = pathname.startsWith("/information");
  const isUserRoute = !isAdminRoute && !isAuthRoute && !isInformationRoute;
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const applyTheme = useCallback((newTheme: 'light' | 'dark') => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setTheme(newTheme);
  }, []);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const initialTheme = storedTheme === 'dark' ? 'dark' : 'light';
    applyTheme(initialTheme);
  }, [applyTheme]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <html>
      <body>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <AppWrapper>
              <Toaster />

              {isAuthRoute && (
                <AnimatePresence mode="wait">
                  <div key={pathname}>{children}</div>
                </AnimatePresence>
              )}

              {isAdminRoute && (
                <ProtectedRoute roleAllowed="Admin">
                  <AnimatePresence mode="wait">
                    <div className="flex min-h-screen bg-[#f5f5f5] relative overflow-hidden w-full">
                      
                      {mobileMenuOpen && (
                        <div 
                          className="fixed inset-0 z-40 bg-black/50 xl:hidden"
                          onClick={() => setMobileMenuOpen(false)}
                        />
                      )}

                      <aside className={`
                        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg 
                        transform transition-transform duration-300 ease-in-out
                        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                        xl:translate-x-0 
                      `}>
                        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                      </aside>

                      <div className="flex-1 flex flex-col w-full min-w-0 transition-all duration-300 xl:ml-64">
                        
                        <div className="sticky top-0 z-30 bg-[#f5f5f5]">
                            <div className="flex items-center px-4 pt-4 xl:pt-0 xl:px-0">
                                <button 
                                    className="p-2 mr-2 text-gray-600 rounded-md hover:bg-gray-200 xl:hidden cursor-pointer"
                                    onClick={() => setMobileMenuOpen(true)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                    </svg>
                                </button>
                                
                                <div className="flex-1 min-w-0">
                                    <HeaderAdmin search={search} setSearch={setSearch} />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 xl:p-8 overflow-x-auto w-full">
                          {children}
                        </div>
                      </div>
                    </div>
                  </AnimatePresence>
                </ProtectedRoute>
              )}

              {isUserRoute && (
                <ProtectedRoute roleAllowed="User" allowGuest={true}>
                  <div className="dark:bg-[#1C2129] dark:text-white bg-[#f5f5f5] text-gray-700 flex flex-col min-h-screen">
                    <Header />
                    <AnimatePresence mode="wait">
                      <main className="flex-1 w-full max-w-[1920px] mx-auto overflow-x-hidden">
                         <div key={pathname}>{children}</div>
                      </main>
                    </AnimatePresence>
                    <Footer />
                    <Chat />
                  </div>
                </ProtectedRoute>
              )}

              {isInformationRoute && (
                <AnimatePresence mode="wait">
                  <div key={pathname}>{children}</div>
                  <Chat />
                </AnimatePresence>
              )}
            </AppWrapper>
          </PersistGate>
        </Provider>
      </body>
    </html>
  );
}