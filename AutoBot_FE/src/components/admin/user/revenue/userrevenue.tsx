'use client';

import { useEffect, useState, useCallback, useMemo } from "react";
import {
    Search, Download, DollarSign, User as UserIcon,
    Calendar, TrendingUp, Clock
} from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { GetAccessToken } from "@/components/shared/token/accessToken";
import axios from "axios";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const UserRevenue = () => {
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [priceSort, setPriceSort] = useState<string>("");
    const [dateSort, setDateSort] = useState("desc");
    const [accessToken, setAccessToken] = useState<string>('');
    const userInfo = useSelector((state: RootState) => state.user.userInfo);
    const [listProfitLoss, setListProfitLoss] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);

    useEffect(() => {
        const loadToken = async () => {
            if (userInfo?.Id) {
                const token = await GetAccessToken(userInfo?.Id);
                if (token) setAccessToken(token);
            }
        };
        loadToken();
    }, [userInfo]);

    const fetchProfitLoss = useCallback(async (page: number) => {
        if (!accessToken) return;
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_URL_API}ProfitLoss/GetProfitLosses?pageSize=${process.env.NEXT_PUBLIC_PAGE_SIZE}&pageNumber=${page}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            const rawData = res.data?.data?.items || res.data?.data || res.data || [];
            setListProfitLoss(Array.isArray(rawData) ? rawData : []);

        } catch (err) {
            console.error("Fetch error:", err);
            toast.error("Không thể tải dữ liệu doanh thu");
        }
    }, [accessToken]);

    useEffect(() => {
        fetchProfitLoss(currentPage);
    }, [fetchProfitLoss]);

    const processedData = useMemo(() => {
        let result = Array.isArray(listProfitLoss) ? [...listProfitLoss] : [];

        if (searchTerm.trim() !== "") {
            result = result.filter((item: any) =>
                item.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        result.sort((a: any, b: any) => {
            if (priceSort === "asc") return a.price - b.price;
            if (priceSort === "desc") return b.price - a.price;

            const timeA = new Date(a.date).getTime();
            const timeB = new Date(b.date).getTime();
            if (dateSort === "asc") return timeA - timeB;
            if (dateSort === "desc") return timeB - timeA;

            return 0;
        });

        return result;
    }, [searchTerm, listProfitLoss, priceSort, dateSort]);

    const handleExportExcel = () => {
        try {
            const dataToExport = processedData.map((item: any) => ({
                "Khách hàng": item.fullName,
                "Số tiền (VND)": item.price,
                "Ngày": new Date(item.date).toLocaleDateString('vi-VN'),
                "Loại": item.price >= 0 ? "Lợi nhuận" : "Thua lỗ"
            }));
            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "P-L Data");
            XLSX.writeFile(workbook, "Bao_cao_doanh_thu.xlsx");
            toast.success("Xuất file thành công");
        } catch {
            toast.error("Lỗi khi xuất file");
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="flex min-h-screen font-sans text-gray-800 bg-gray-50/50">
            <main className="flex-1 w-full mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                            Quản lý doanh thu hệ thống
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Dữ liệu được cập nhật dựa trên lịch sử giao dịch khách hàng.</p>
                    </div>
                    <button
                        onClick={handleExportExcel}
                        className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition cursor-pointer"
                    >
                        <Download size={18} /> Xuất Excel
                    </button>
                </div>

                <div className="flex justify-between items-center flex-col md:flex-row bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 gap-4">
                    <div className="md:col-span-6 relative md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Tìm tên khách hàng..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 md:flex gap-2 w-full md:w-auto">
                        <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 cursor-pointer">
                            <select
                                className="w-full text-sm font-medium outline-none bg-transparent cursor-pointer"
                                value={priceSort}
                                onChange={(e) => {
                                    setPriceSort(e.target.value);
                                    if (e.target.value !== "") setDateSort("");
                                }}
                            >
                                <option value="">Lợi nhuận: Mặc định</option>
                                <option value="desc">Cao nhất đến thấp nhất</option>
                                <option value="asc">Thấp nhất đến cao nhất</option>
                            </select>
                        </div>

                        <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 cursor-pointer">
                            <select
                                className="w-full text-sm font-medium outline-none bg-transparent cursor-pointer"
                                value={dateSort}
                                onChange={(e) => {
                                    setDateSort(e.target.value);
                                    if (e.target.value !== "") setPriceSort("");
                                }}
                            >
                                <option value="">Thời gian: Mặc định</option>
                                <option value="desc">Gần đây nhất</option>
                                <option value="asc">Xa nhất</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                    <th className="px-8 py-5">Thông tin khách hàng</th>
                                    <th className="px-8 py-5 text-center">Số tiền giao dịch</th>
                                    <th className="px-8 py-5 text-center">Ngày ghi nhận</th>
                                    <th className="px-8 py-5 text-right">Phân loại</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {processedData.length > 0 ? (
                                    processedData.map((item: any, index: number) => (
                                        <tr key={item.id || index} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white font-bold shadow-md">
                                                        {item.fullName?.charAt(0).toUpperCase() || "U"}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-900">{item.fullName}</div>
                                                        <div className="text-[10px] text-gray-400 font-mono">ID: {item.userId?.substring(0, 8)}...</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center font-bold text-sm">
                                                <span className={item.price >= 0 ? "text-emerald-600" : "text-rose-600"}>
                                                    {item.price >= 0 ? "+" : ""}{formatCurrency(item.price)}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <div className="text-sm text-gray-600 font-medium">
                                                    {item.date ? new Date(item.date).toLocaleDateString('vi-VN') : "---"}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-bold uppercase border ${item.price >= 0 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"}`}>
                                                    {item.price >= 0 ? "Lợi nhuận" : "Thua lỗ"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center text-gray-400 font-medium italic">
                                            Không tìm thấy dữ liệu
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserRevenue;