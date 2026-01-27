'use client';

import { useEffect, useState, useCallback, useMemo } from "react";
import {
    Search, Download, ChevronLeft, ChevronRight,
    TrendingUp, TrendingDown, Clock, Eye
} from "lucide-react";
import axios from "axios";
import { GetAccessToken } from "@/components/shared/token/accessToken";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { addHours, format } from "date-fns";
import * as XLSX from "xlsx";
import { toast } from "sonner";

const HistoryPlaceOrder = () => {
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [accessToken, setAccessToken] = useState<string>('');
    const userInfo = useSelector((state: RootState) => state.user.userInfo);
    
    const [signals, setSignals] = useState<any[]>([]); // Dữ liệu gốc từ API
    const [loading, setLoading] = useState<boolean>(false);
    const [openDetail, setOpenDetail] = useState<boolean>(false);
    const [selectedSignal, setSelectedSignal] = useState<any>(null);

    const PAGE_SIZE = 10;

    // 1. Lấy Token
    useEffect(() => {
        if (!userInfo?.Id) return;
        const loadToken = async () => {
            const token = await GetAccessToken(userInfo?.Id);
            if (token) setAccessToken(token);
        };
        loadToken();
    }, [userInfo]);

    // 2. Fetch toàn bộ dữ liệu (vì lọc ở client nên cần lấy lượng lớn hoặc toàn bộ)
    const getHistorySignals = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const res = await axios.get(
                `${process.env.NEXT_PUBLIC_URL_API}BotSignal/GetSignals`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );
            console.log(res.data.data)
            const data = res.data?.data || [];
            setSignals(data);
        } catch (err) {
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        if (accessToken) getHistorySignals();
    }, [getHistorySignals, accessToken]);

    const filteredSignals = useMemo(() => {
        return signals.filter((item) => {
            const search = searchTerm.toLowerCase();
            const signalStr = item.signal?.toLowerCase() || "";
            const priceStr = item.price?.toString() || "";
            const dateStr = item.dateTime ? format(addHours(new Date(item.dateTime), 7), "dd/MM/yyyy HH:mm:ss") : "";
            
            return signalStr.includes(search) || 
                   priceStr.includes(search) || 
                   dateStr.includes(search);
        });
    }, [signals, searchTerm]);

    const totalPages = Math.ceil(filteredSignals.length / PAGE_SIZE) || 1;
    const currentTableData = useMemo(() => {
        const firstPageIndex = (currentPage - 1) * PAGE_SIZE;
        const lastPageIndex = firstPageIndex + PAGE_SIZE;
        return filteredSignals.slice(firstPageIndex, lastPageIndex);
    }, [currentPage, filteredSignals]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handleExportExcel = () => {
        if (filteredSignals.length === 0) {
            toast.error("Không có dữ liệu để xuất");
            return;
        }
        const excelData = filteredSignals.map((item, index) => ({
            "STT": index + 1,
            "Thời Gian": format(addHours(new Date(item.dateTime), 7), "dd/MM/yyyy HH:mm:ss"),
            "Tín Hiệu": item.signal === "Buy" ? "MUA (LONG)" : "BÁN (SHORT)",
            "Mức Giá": item.price,
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Signals");
        XLSX.writeFile(workbook, `Filtered_Signals.xlsx`);
    };

    const getPageNumbers = (current: number, total: number) => {
        const pages: (number | string)[] = [];
        if (total <= 5) for (let i = 1; i <= total; i++) pages.push(i);
        else {
            pages.push(1);
            if (current > 3) pages.push("...");
            for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
            if (current < total - 2) pages.push("...");
            pages.push(total);
        }
        return pages;
    };

    return (
        <div className="flex min-h-screen font-sans text-gray-800 bg-gray-50/50">
            <main className="flex-1 transition-all duration-300 w-full overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Lịch sử đặt lệnh Bot</h1>
                        <p className="text-xs md:text-sm text-gray-500 mt-1">Lọc tín hiệu trực tiếp trên danh sách hiện có.</p>
                    </div>
                    <button
                        onClick={handleExportExcel}
                        className="w-full md:w-auto flex justify-center items-center gap-2 text-sm px-4 py-2 bg-white border rounded-lg hover:bg-gray-100 transition shadow-sm cursor-pointer"
                    >
                        <Download size={16} /> Xuất Excel
                    </button>
                </div>

                <div className="bg-white p-4 rounded-t-xl border border-gray-200 border-b-0">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Lọc theo tín hiệu, giá, ngày..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-b-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-gray-50/80 border-b text-xs font-semibold text-gray-500 uppercase">
                                    <th className="px-6 py-4">STT</th>
                                    <th className="px-6 py-4">Thời Gian (GMT+7)</th>
                                    <th className="px-6 py-4">Tín Hiệu</th>
                                    <th className="px-6 py-4 text-right">Giá Khớp</th>
                                    <th className="px-6 py-4 text-center">Chi Tiết</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                     <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Đang tải dữ liệu...</td></tr>
                                ) : currentTableData.length > 0 ? (
                                    currentTableData.map((sig, index) => (
                                        <tr key={sig.id} className="hover:bg-blue-50/20 transition">
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {(currentPage - 1) * PAGE_SIZE + index + 1}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {sig.dateTime ? format(addHours(new Date(sig.dateTime), 7), "dd/MM/yyyy HH:mm:ss") : "---"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <SignalBadge signal={sig.signal} />
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold">
                                                {sig.price.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button 
                                                    onClick={() => { setSelectedSignal(sig); setOpenDetail(true); }}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Không tìm thấy kết quả phù hợp.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-4 md:px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-white">
                        <span className="text-xs text-gray-500">
                            Hiển thị {currentTableData.length}/{filteredSignals.length} kết quả
                        </span>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border disabled:opacity-30"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <div className="hidden sm:flex gap-1">
                                {getPageNumbers(currentPage, totalPages).map((page, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => typeof page === 'number' && setCurrentPage(page)}
                                        className={`w-8 h-8 rounded-lg text-xs font-bold ${currentPage === page ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                                        disabled={typeof page !== 'number'}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} 
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border disabled:opacity-30"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Modal Detail giữ nguyên như cũ */}
                {openDetail && selectedSignal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setOpenDetail(false)}>
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 relative" onClick={e => e.stopPropagation()}>
                            <h2 className="text-lg font-bold mb-4">Chi tiết lệnh</h2>
                            <div className="space-y-4 text-sm">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Loại:</span>
                                    <SignalBadge signal={selectedSignal.signal} />
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Giá:</span>
                                    <span className="font-bold text-blue-600">{selectedSignal.price.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Ngày:</span>
                                    <span>{format(addHours(new Date(selectedSignal.dateTime), 7), "dd/MM/yyyy HH:mm:ss")}</span>
                                </div>
                            </div>
                            <button onClick={() => setOpenDetail(false)} className="w-full mt-6 py-2 bg-gray-900 text-white rounded-lg">Đóng</button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

const SignalBadge = ({ signal }: { signal: string }) => {
    const isBuy = signal?.toLowerCase().includes("buy") || signal?.toLowerCase().includes("long");
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
            isBuy ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
        }`}>
            {isBuy ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {isBuy ? "MUA (LONG)" : "BÁN (SHORT)"}
        </span>
    );
};

export default HistoryPlaceOrder;