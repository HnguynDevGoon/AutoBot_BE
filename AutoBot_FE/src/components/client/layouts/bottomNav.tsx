"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaHome, FaUser, FaSearch, FaBars } from "react-icons/fa"; 

export default function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        { href: "/", icon: FaHome, label: "Trang chủ" },
        { href: "/menu", icon: FaBars, label: "Menu" },
        { href: "/information", icon: FaUser, label: "Tài khoản" },
    ];

    const ACCENT_COLOR_CLASS = "text-blue-500";
    const DARK_BG_CLASS = "bg-[#2A2C31]"; 
    const DARK_BORDER_CLASS = "border-[#3A3C42]"; 

    return (
        <div
            className={`
                fixed bottom-4 left-0 right-0 mx-4 xs:mx-6 sm:mx-10
                ${DARK_BG_CLASS} 
                ${DARK_BORDER_CLASS}
                border 
                flex items-center justify-around
                px-4 py-3
                rounded-3xl // Tăng độ cong
                shadow-2xl shadow-black/50 // Shadow đậm hơn cho Dark Mode
                z-50
                md:hidden
            `}
        >
            {navItems.map((item) => {
                const isActive = pathname === item.href;

                if (item.href === "/") {
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`
                                absolute left-1/2 -translate-x-1/2 -top-5 
                                bg-linear-to-r from-blue-400 to-teal-500 text-white
                                w-16 h-16
                                rounded-full
                                flex items-center justify-center
                                shadow-xl shadow-blue-500/50
                                transition-all duration-300
                                hover:scale-105 active:scale-95
                                border-4 border-[#2A2C31]
                            `}
                        >
                            <item.icon size={24} />
                        </Link>
                    );
                }

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`
                            flex flex-col items-center text-xs font-medium transition duration-300 space-y-1
                            ${isActive ? ACCENT_COLOR_CLASS : "text-white hover:text-white"}
                        `}
                    >
                        <item.icon size={22} />
                    </Link>
                );
            })}
        </div>
    );
}
