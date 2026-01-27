"use client";

import Image from "next/image";
import { FaBookmark, FaBox, FaChartPie, FaHistory, FaMoneyBill, FaMoneyBillWave, FaRobot, FaUserLock, FaUsers } from "react-icons/fa";
import { IoChatbox, IoExtensionPuzzle, IoGrid } from "react-icons/io5";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MdOutlineAttachMoney, MdOutlineKeyboardArrowRight } from "react-icons/md";
import { GrTransaction } from "react-icons/gr";
import { RiHome7Fill, RiRobot3Fill } from "react-icons/ri";
import { FaCartShopping } from "react-icons/fa6";
import { IoIosHelpCircle, IoIosSend, IoIosSettings } from "react-icons/io";
import { AiFillRobot } from "react-icons/ai";
import { GiPayMoney, GiReceiveMoney } from "react-icons/gi";
import { LuFileJson2 } from "react-icons/lu";

interface NavItem {
    name: string;
    key: string;
    icon: React.FC<any>;
    section: "MAIN MENU" | "ACCOUNT";
    link?: string;
    children?: NavItem[];
}

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
    const router = useRouter();
    const pathname = usePathname();
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    const NAV_ITEMS: NavItem[] = [
        { name: "Bảng điều khiển", key: "dashboard", icon: IoGrid, section: "MAIN MENU", link: "/admin/dashboard" },
        { name: "Đặt lệnh", key: "bot-order", icon: IoIosSend, section: "MAIN MENU", link: "/admin/placeorder" },
        { name: "Thống kê", key: "statistic", icon: FaChartPie, section: "MAIN MENU", link: "/admin/statistic" },
        {
            name: "Người dùng",
            key: "users",
            icon: FaUsers,
            section: "MAIN MENU",
            children: [
                { name: "Người dùng", key: "user-manage", icon: FaUsers, section: "MAIN MENU", link: "/admin/user/management" },
                { name: "Người dùng bot", key: "user-bot", icon: RiRobot3Fill, section: "MAIN MENU", link: "/admin/user/userbot" },
                { name: "Lợi nhuận bot", key: "user-revenue", icon: GiReceiveMoney, section: "MAIN MENU", link: "/admin/user/revenue" },
            ]
        },
        {
            name: "Bot",
            key: "bot",
            icon: FaRobot,
            section: "MAIN MENU",
            children: [
                { name: "Quản lý Bot", key: "bot-manage", icon: FaRobot, section: "MAIN MENU", link: "/admin/bot/management" },
                { name: "Gói Bot", key: "bot-package", icon: FaBox, section: "MAIN MENU", link: "/admin/bot/package" },
                
            ]
        },
        {
            name: "Nội dung trang",
            key: "deals",
            icon: FaBookmark,
            section: "MAIN MENU",
            children: [
                { name: "Trang chủ", key: "bot-homepage", icon: RiHome7Fill, section: "MAIN MENU", link: "/admin/content/home" },
                { name: "Giới thiệu", key: "bot-introduction", icon: AiFillRobot, section: "MAIN MENU", link: "/admin/content/introduction" },
                { name: "Extension", key: "bot-extension", icon: IoExtensionPuzzle, section: "MAIN MENU", link: "/admin/content/extension" },
            ]
        },
        {
            name: "Lịch sử",
            key: "vi",
            icon: FaHistory,
            section: "MAIN MENU",
            children: [
                { name: "Lịch sử giao dịch", key: "history-transaction", icon: GrTransaction, section: "MAIN MENU", link: "/admin/history/transaction" },
                { name: "Lịch sử mua bot", key: "history-bot", icon: FaCartShopping, section: "MAIN MENU", link: "/admin/history/bot" },
                { name: "Lịch sử đặt lệnh", key: "history-placeorder", icon: FaMoneyBillWave, section: "MAIN MENU", link: "/admin/history/placeorder" },
            ]
        },
        {
            name: "Quản lý nội bộ",
            key: "management-internal",
            icon: FaHistory,
            section: "MAIN MENU",
            children: [
                { name: "Chi tiêu", key: "management-expense", icon: GiPayMoney, section: "MAIN MENU", link: "/admin/management/expense" },
                { name: "Lương nhân viên", key: "management-salary", icon: MdOutlineAttachMoney, section: "MAIN MENU", link: "/admin/management/salary" },
                { name: "Quyền", key: "management-role", icon: FaUserLock, section: "MAIN MENU", link: "/admin/management/role" },
                { name: "File", key: "management-file", icon: LuFileJson2, section: "MAIN MENU", link: "/admin/management/file" },
            ]
        },
        { name: "Yêu cầu rút tiền", key: "withdraw", icon: FaMoneyBill, section: "MAIN MENU", link: '/admin/withdrawmoney' },
        { name: "Đoạn chat", key: "chat", icon: IoChatbox, section: "MAIN MENU", link: '/admin/chat' },
        { name: "Hỗ trợ", key: "help", icon: IoIosHelpCircle, section: "ACCOUNT" },
        { name: "Cài đặt", key: "settings", icon: IoIosSettings, section: "ACCOUNT" },
    ];

    const menuSections: Record<string, NavItem[]> = {
        "MAIN MENU": NAV_ITEMS.filter(item => item.section === "MAIN MENU"),
        "ACCOUNT": NAV_ITEMS.filter(item => item.section === "ACCOUNT"),
    };

    return (
        <div className="w-64 bg-white border-r flex flex-col h-full fixed top-0 left-0 z-40">
            <div className="p-5 flex items-center gap-2 text-xl font-bold text-blue-600 border-b">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md">
                    <Image width={1000} height={1000} alt="Logo" src={'/assets/images/logo.png'} />
                </div>
                AutoBot
            </div>

            <nav className="flex-1 p-5 space-y-6 overflow-y-auto">
                {Object.keys(menuSections).map(section => (
                    <div key={section}>
                        <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2">{section}</h3>
                        <div className="space-y-1">
                            {menuSections[section].map(item => (
                                <div key={item.key}>
                                    <button
                                        className={`flex items-center justify-between gap-3 p-3 text-sm rounded-lg w-full text-left transition-all cursor-pointer
            ${pathname === item.link ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-700 hover:bg-gray-100"}`}
                                        onClick={() => {
                                            if (item.children) {
                                                setOpenDropdown(openDropdown === item.key ? null : item.key);
                                            } else if (item.link) {
                                                router.push(item.link);
                                                setActiveTab(item.key);
                                            }
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon size={18} />
                                            {item.name}
                                        </div>

                                        {item.children && (
                                            <span className={`transition-all duration-300 ${openDropdown === item.key ? "rotate-90" : ""}`}>
                                                <MdOutlineKeyboardArrowRight />
                                            </span>
                                        )}
                                    </button>

                                    {item.children && openDropdown === item.key && (
                                        <div className="ml-8 mt-1 space-y-1">
                                            {item.children.map(child => (
                                                <button
                                                    key={child.key}
                                                    className={`flex items-center gap-3 p-2 text-sm rounded-lg w-full text-left cursor-pointer
                        ${pathname === child.link ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-600 hover:bg-gray-100"}`}
                                                    onClick={() => {
                                                        router.push(child.link!);
                                                        setActiveTab(child.key);
                                                    }}
                                                >
                                                    <child.icon size={16} />
                                                    {child.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>
        </div>
    );
};

export default Sidebar;