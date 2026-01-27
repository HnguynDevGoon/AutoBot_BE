"use client";

import { useEffect, useState, useRef } from "react";
import {
    Search as SearchIcon,
    User, LogOut, Bot, Wallet,
    FileText, Activity, Layers,
    DollarSign, TrendingUp, ShoppingCart,
    Shield, FileBox, Newspaper, Zap
} from 'lucide-react';
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "@/redux/slices/userSlice";
import axios from "axios";
import { RootState } from "@/redux/store";
import { GetAccessToken } from "@/components/shared/token/accessToken";
import Link from "next/link";

// --- 1. ĐỊNH NGHĨA TYPES (Khớp với DTO Backend) ---
// Đảm bảo các trường này khớp với DTO trả về từ Converter BE
interface IUserResult { id: string; userName: string; email: string; urlAvatar: string; fullName: string; }
interface IBotResult { id: string; nameBot: string; winRate?: number; interestRate?: number; } // Thêm winRate, interestRate
interface IExpenseResult { id: string; name: string; price: number; description: string; date: string; }
interface ISalaryResult { id: string; price: number; bonus: number; description: string; userName: string; }
interface IBotSignalResult { id: string; signal: string; price: number; dateTime: string; }
interface IPurchaseResult { id: string; orderCode: number; priceBot: number; userName: string; botName: string; status: string; }
interface IContentResult { id: string; title: string; link: string; }
interface IOtherContentResult { id: string; title: string; otherType: string; }
interface IRoleResult { id: string; roleName: string; }
interface IProfitLossResult { id: string; price: number; date: string; userName: string; }

interface SearchResultData {
    users: IUserResult[];
    bots: IBotResult[];
    salaries: ISalaryResult[];
    expenses: IExpenseResult[];
    botSignals: IBotSignalResult[];
    purchaseHistories: IPurchaseResult[];
    contents: IContentResult[];
    otherContents: IOtherContentResult[];
    roles: IRoleResult[];
    profitLosses: IProfitLossResult[];
}

interface HeaderProps {
    search: string;
    setSearch: (value: string) => void;
}

const HeaderAdmin: React.FC<HeaderProps> = ({ search, setSearch }) => {
    const dispatch = useDispatch();
    const router = useRouter();

    const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
    const [user, setUser] = useState<any>(null);
    const userInfo = useSelector((state: RootState) => state.user.userInfo);
    const [accessToken, setAccessToken] = useState<string>('');

    const [searchResult, setSearchResult] = useState<SearchResultData | null>(null);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [showDropdown, setShowDropdown] = useState<boolean>(false);

    const typingTimeoutRef = useRef<any>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    const formatDate = (dateStr: string) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN');
    }

    useEffect(() => {
        if (!userInfo?.Id && !accessToken) return;
        if (userInfo) setUser(userInfo);
        loadData();
        if (accessToken && userInfo) handleGetInforUser();
    }, [userInfo, accessToken]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        if (!search.trim()) {
            setSearchResult(null);
            setShowDropdown(false);
            return;
        }

        typingTimeoutRef.current = setTimeout(() => {
            handleSearchGlobal(search);
        }, 500);

        return () => clearTimeout(typingTimeoutRef.current);
    }, [search]);

    const loadData = async () => {
        const token = await GetAccessToken(userInfo?.Id);
        if (token) setAccessToken(token);
    };

    const handleGetInforUser = async () => {
        if (!accessToken) return;
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_URL_API}Authen/GetUserById?userId=${userInfo?.Id}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            setUser(res.data.data);
        } catch (err) { console.error(err); }
    }

    const handleSearchGlobal = async (keyword: string) => {
        setIsSearching(true);
        setShowDropdown(true);
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_URL_API}AdminDashboard/SearchGlobal?keyword=${keyword}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (res.data && res.data.data) {
                setSearchResult(res.data.data);
            }
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleLogout = async () => {
        dispatch(clearUser());
        router.push(`/auth/signin`);
    }

    const renderSectionHeader = (icon: React.ReactNode, title: string) => (
        <h3 className="text-[11px] font-bold text-gray-400 uppercase mb-2 px-2 flex items-center gap-1 mt-3 bg-gray-50 py-1 rounded">
            {icon} {title}
        </h3>
    );

    const hasData = (list: any[]) => list && list.length > 0;

    return (
        <div className="flex justify-end items-center gap-4 p-3 bg-[#f5f5f5] sticky top-0 z-40" ref={dropdownRef}>

            <div className="relative flex items-center w-full max-w-md">
                <SearchIcon className="absolute left-3 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Tìm User, Bot, Giao dịch..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => { if (search) setShowDropdown(true); }}
                />

                {isSearching && (
                    <div className="absolute right-3 animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                )}

                {showDropdown && !isSearching && searchResult && (
                    <div className="absolute top-full left-0 mt-2 w-full max-h-[70vh] overflow-y-auto bg-white rounded-xl shadow-xl border border-gray-100 z-50 scrollbar-thin scrollbar-thumb-gray-300 animate-in fade-in zoom-in-95 duration-200">

                        {Object.values(searchResult).every((arr: any[]) => arr.length === 0) && (
                            <div className="p-8 text-center flex flex-col items-center text-gray-500">
                                <SearchIcon size={32} className="text-gray-300 mb-2" />
                                <span className="text-sm">Không tìm thấy kết quả nào cho "{search}"</span>
                            </div>
                        )}

                        <div className="p-2">
                            {hasData(searchResult.users) && (
                                <div>
                                    {renderSectionHeader(<User size={12} />, "Người dùng")}
                                    {searchResult.users.map((item, idx) => (
                                        <div key={idx} onClick={() => {
                                            router.push(`/admin/user/management`)
                                            setShowDropdown(false);
                                        }} className="flex items-center gap-3 p-2 hover:bg-blue-50 rounded-lg cursor-pointer transition group">
                                            <img src={item.urlAvatar || "https://placehold.co/40x40"} alt="" className="w-9 h-9 rounded-full object-cover border border-gray-200" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-600">{item.userName}</p>
                                                <p className="text-xs text-gray-500 truncate">{item.email} • {item.fullName}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {hasData(searchResult.bots) && (
                                <div>
                                    {renderSectionHeader(<Bot size={12} />, "Bot Trading")}
                                    {searchResult.bots.map((item, idx) => (
                                        <div key={idx} onClick={() => {
                                            router.push(`/admin/bot/management`)
                                            setShowDropdown(false);
                                        }} className="flex justify-between items-center p-2 hover:bg-blue-50 rounded-lg cursor-pointer transition border-l-2 border-transparent hover:border-blue-500">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-600"><Bot size={16} /></div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800">{item.nameBot}</p>
                                                    {item.interestRate && <p className="text-[10px] text-gray-500">Lãi suất: {item.interestRate}%</p>}
                                                </div>
                                            </div>
                                            <Zap size={14} className="text-gray-300" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {hasData(searchResult.expenses) && (
                                <div>
                                    {renderSectionHeader(<DollarSign size={12} />, "Chi tiêu")}
                                    {searchResult.expenses.map((item, idx) => (
                                        <div onClick={() => {
                                            router.push(`/admin/management/expense`)
                                            setShowDropdown(false);
                                        }} key={idx} className="flex justify-between items-start p-2 hover:bg-red-50 rounded-lg cursor-pointer transition border-l-2 border-transparent hover:border-red-500">
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">{item.name}</p>
                                                <p className="text-xs text-gray-500">{item.description}</p>
                                                <p className="text-[10px] text-gray-400">{formatDate(item.date)}</p>
                                            </div>
                                            <span className="text-sm font-bold text-red-600">-{formatCurrency(item.price)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {hasData(searchResult.salaries) && (
                                <div>
                                    {renderSectionHeader(<Wallet size={12} />, "Lương Nhân Viên")}
                                    {searchResult.salaries.map((item, idx) => (
                                        <div onClick={() => {
                                            router.push(`/admin/management/salary`)
                                            setShowDropdown(false);
                                        }} key={idx} className="flex justify-between items-center p-2 hover:bg-orange-50 rounded-lg cursor-pointer transition">
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">{item.description}</p>
                                                <p className="text-xs text-gray-500">Nhận: <span className="font-semibold text-gray-700">{item.userName}</span></p>
                                            </div>
                                            <span className="text-sm font-bold text-orange-600">-{formatCurrency(item.price + (item.bonus || 0))}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {hasData(searchResult.purchaseHistories) && (
                                <div>
                                    {renderSectionHeader(<ShoppingCart size={12} />, "Lịch sử mua")}
                                    {searchResult.purchaseHistories.map((item, idx) => (
                                        <div onClick={() => {
                                            router.push(`/admin/history/bot`)
                                            setShowDropdown(false);
                                        }} key={idx} className="p-2 hover:bg-green-50 rounded-lg cursor-pointer transition border-l-2 border-transparent hover:border-green-500">
                                            <div className="flex justify-between">
                                                <span className="text-xs font-bold text-gray-500">#{item.orderCode}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === 'Success' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{item.status}</span>
                                            </div>
                                            <div className="mt-1 flex justify-between items-center">
                                                <p className="text-sm text-gray-800"><span className="font-semibold">{item.userName}</span> mua {item.botName}</p>
                                                <p className="text-sm font-bold text-green-600">+{formatCurrency(item.priceBot)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {hasData(searchResult.botSignals) && (
                                <div>
                                    {renderSectionHeader(<Activity size={12} />, "Tín hiệu Bot")}
                                    {searchResult.botSignals.map((item, idx) => (
                                        <div onClick={() => {
                                            router.push(`/admin/history/placeorder`)
                                            setShowDropdown(false);
                                        }} key={idx} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${item.signal.includes('BUY') ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                <p className="text-sm font-medium text-gray-800">{item.signal}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold">{item.price}</p>
                                                <p className="text-[10px] text-gray-400">{formatDate(item.dateTime)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {hasData(searchResult.profitLosses) && (
                                <div>
                                    {renderSectionHeader(<TrendingUp size={12} />, "Lãi / Lỗ")}
                                    {searchResult.profitLosses.map((item, idx) => (
                                        <div onClick={() => {
                                            router.push(`/admin/user/revenue`)
                                            setShowDropdown(false);
                                        }} key={idx} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition">
                                            <div>
                                                <p className="text-sm text-gray-800">{item.userName}</p>
                                                <p className="text-[10px] text-gray-400">{formatDate(item.date)}</p>
                                            </div>
                                            <span className={`text-sm font-bold ${item.price >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {item.price >= 0 ? '+' : ''}{formatCurrency(item.price)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {(hasData(searchResult.contents) || hasData(searchResult.otherContents)) && (
                                <div>
                                    {renderSectionHeader(<Newspaper size={12} />, "Bài viết & Nội dung")}
                                    {searchResult.contents.map((item, idx) => (
                                        <div onClick={() => {
                                            router.push(`/admin/content/home`)
                                            setShowDropdown(false);
                                        }} key={`c-${idx}`} className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer text-sm text-blue-600 hover:underline truncate">
                                            {item.title}
                                        </div>
                                    ))}
                                    {searchResult.otherContents.map((item, idx) => (
                                        <div onClick={() => {
                                            router.push(`/admin/content/home`)
                                            setShowDropdown(false);
                                        }} key={`o-${idx}`} className="flex justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer text-sm">
                                            <span className="text-gray-800 truncate">{item.title}</span>
                                            <span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600 h-fit">{item.otherType}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {hasData(searchResult.roles) && (
                                <div>
                                    {renderSectionHeader(<Shield size={12} />, "Quyền (Roles)")}
                                    {searchResult.roles.map((item, idx) => (
                                        <div onClick={() => {
                                            router.push(`/admin/management/role`)
                                            setShowDropdown(false);
                                        }} key={idx} className="p-2 hover:bg-purple-50 rounded-lg cursor-pointer text-sm font-semibold text-purple-700">
                                            {item.roleName}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-50 p-2 text-center border-t border-gray-100">
                            <span className="text-[10px] text-gray-400">Nhấn Enter để xem chi tiết tất cả</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="relative">
                <button
                    className="flex items-center gap-2 p-1 rounded-full hover:bg-white transition duration-150 cursor-pointer border border-transparent hover:border-gray-200"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                    <img
                        src={user?.urlAvatar}
                        alt="Admin"
                        className="w-9 h-9 rounded-full object-cover shadow-sm ring-2 ring-white"
                        onError={(e: any) => e.target.src = "https://placehold.co/40x40/0E7490/FFFFFF?text=AD"}
                    />
                </button>

                {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-sm font-semibold text-gray-800 truncate">{user?.fullName || "Admin User"}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                        <div className="p-1">
                            <button
                                className="flex items-center gap-3 w-full p-2.5 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                                onClick={() => { setIsUserMenuOpen(false); router.push("/admin/information"); }}
                            >
                                <User size={16} className="text-blue-500" /> Thông tin cá nhân
                            </button>
                            <button
                                className="flex items-center gap-3 w-full p-2.5 text-sm text-red-600 rounded-lg hover:bg-red-50 transition mt-1 cursor-pointer"
                                onClick={() => { handleLogout(); setIsUserMenuOpen(false); }}
                            >
                                <LogOut size={16} className="text-red-500" /> Đăng xuất
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default HeaderAdmin;