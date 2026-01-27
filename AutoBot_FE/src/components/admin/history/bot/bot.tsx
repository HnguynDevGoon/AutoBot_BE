'use client';

import { GetAccessToken } from "@/components/shared/token/accessToken";
import { RootState } from "@/redux/store";
import axios from "axios";
import { addHours, format } from "date-fns";
import { CheckCircle2, Clock, Download, Eye, Search, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const HistoryBot = () => {
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [accessToken, setAccessToken] = useState<string>('');
    const userInfo = useSelector((state: RootState) => state.user.userInfo);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [openShowTransaction, setOpenShowTransaction] = useState<boolean>(false);
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

    useEffect(() => {
        if (!userInfo?.Id) return;
        const loadToken = async () => {
            const token = await GetAccessToken(userInfo?.Id);
            if (token) setAccessToken(token);
        };
        loadToken();
    }, [userInfo]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (accessToken) getHistoryBot();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, accessToken, currentPage]);

    const getHistoryBot = async () => {
        if (!accessToken) return;
        try {
            const res = await axios.get(
                `${process.env.NEXT_PUBLIC_URL_API}PurchaseHistory/GetAllHistoryDynamicForAdmin`,
                {
                    params: {
                        orderType: "BuyBot",
                        searchKeyword: searchTerm,
                        pageSize: process.env.NEXT_PUBLIC_PAGE_SIZE || 10,
                        pageNumber: currentPage
                    },
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );
            const data = res.data?.data?.items || [];
            const totalP = res.data?.data?.totalPages || 1;
            setTotalPages(totalP);
            const mappedData = data
                .filter((x: any) => x.orderType === 'BuyBot')
                .map((x: any) => ({
                    id: x.id,
                    orderCode: x.orderCode || "---",
                    fullName: x.user?.fullName || x.userName || "Người dùng",
                    email: x.user?.email || "",
                    amount: x.priceBot,
                    status: x.status,
                    date: x.date,
                    startDate: x.startDate,
                    endDate: x.endDate,
                }));
            setTransactions(mappedData);
        } catch (err) {
        }
    };

    const handleExportExcel = async () => {
        if (!accessToken) return;
        try {
            const res = await axios.get(
                `${process.env.NEXT_PUBLIC_URL_API}PurchaseHistory/GetAllHistoryDynamicForAdmin`,
                {
                    params: {
                        orderType: "BuyBot", // Chỉ lấy BuyBot
                        searchKeyword: searchTerm,
                        pageSize: 10000,
                        pageNumber: 1
                    },
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );
            const data = res.data?.data?.items || [];
            if (data.length === 0) {
                alert("Không có dữ liệu để xuất!");
                return;
            }
            const excelData = data.map((item: any, index: number) => ({
                "STT": index + 1,
                "Mã Giao Dịch": item.orderCode,
                "Khách Hàng": item.user?.fullName || item.userName || "N/A",
                "Email": item.user?.email || "N/A",
                "Số Tiền (VNĐ)": item.priceBot,
                "Ngày Bắt Đầu": item.startDate ? format(addHours(new Date(item.startDate), 7), "dd/MM/yyyy") : "",
                "Ngày Kết Thúc": item.endDate ? format(addHours(new Date(item.endDate), 7), "dd/MM/yyyy") : "",
                "Trạng Thái": item.status,
                "Ngày Thanh Toán": item.date ? format(addHours(new Date(item.date), 7), "dd/MM/yyyy HH:mm") : ""
            }));
            const worksheet = XLSX.utils.json_to_sheet(excelData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "LichSuMuaBot");
            XLSX.writeFile(workbook, `LichSu_BuyBot_${format(new Date(), "ddMMyyyy")}.xlsx`);
            toast.success("Xuất Excel thành công!");
        } catch (err) {
            toast.error("Lỗi xuất Excel");
        }
    };

    const getPageNumbers = (current: number, total: number) => {
        const pages: (number | string)[] = [];
        if (total <= 5) {
            for (let i = 1; i <= total; i++) pages.push(i);
        } else {
            pages.push(1);
            if (current > 3) pages.push("...");
            const start = Math.max(2, current - 1);
            const end = Math.min(total - 1, current + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (current < total - 2) pages.push("...");
            pages.push(total);
        }
        return pages;
    };

    return (
        <div className="flex min-h-screen font-sans text-gray-800 bg-gray-50/50">
            <main className="flex-1 transition-all duration-300 w-full mx-auto overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Lịch sử mua bot</h1>
                        <p className="text-xs md:text-sm text-gray-500 mt-1">Quản lý giao dịch và thời hạn sử dụng bot của khách hàng.</p>
                    </div>
                    <button
                        onClick={handleExportExcel}
                        className={`w-full md:w-auto flex justify-center items-center gap-2 text-sm px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition shadow-sm cursor-pointer`}
                    >
                        <Download size={16} /> Xuất Excel
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Search Bar */}
                    <div className="p-4 border-b border-gray-200 bg-white">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Tìm mã GD, tên, email..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1100px]">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                                    <th className="px-6 py-4">Mã GD</th>
                                    <th className="px-6 py-4">Người Dùng</th>
                                    <th className="px-6 py-4">Số Tiền</th>
                                    <th className="px-6 py-4">Thời Hạn Sử Dụng (Bot)</th>
                                    <th className="px-6 py-4">Trạng Thái</th>
                                    <th className="px-6 py-4">Ngày Thanh Toán</th>
                                    <th className="px-6 py-4 text-center">Chi Tiết</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {transactions.length > 0 ? (
                                    transactions.map((trx) => (
                                        <tr key={trx.id} className="hover:bg-blue-50/30 transition">
                                            <td className="px-6 py-4 font-mono text-sm font-medium text-gray-700">{trx.orderCode}</td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-semibold text-gray-900">{trx.fullName}</p>
                                                <p className="text-xs text-gray-500">{trx.email}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-rose-600">
                                                    - ₫{trx.amount?.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="text-gray-400 w-8">Từ:</span>
                                                        <span className="font-medium text-gray-700">
                                                            {trx.startDate ? format(addHours(new Date(trx.startDate), 7), "dd/MM/yyyy") : "---"}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="text-gray-400 w-8">Đến:</span>
                                                        <span className="font-bold text-blue-600">
                                                            {trx.endDate ? format(addHours(new Date(trx.endDate), 7), "dd/MM/yyyy") : "---"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4"><TransactionStatusBadge status={trx.status} /></td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {trx.date ? format(addHours(new Date(trx.date), 7), "dd/MM/yyyy HH:mm") : "--:--"}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button onClick={() => { setSelectedTransaction(trx); setOpenShowTransaction(true); }} className="p-2 text-gray-400 hover:text-blue-600 transition cursor-pointer">
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-medium">Không tìm thấy dữ liệu mua bot phù hợp.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-200 flex items-center justify-between">
                            <p className="text-sm text-gray-500">Trang {currentPage} / {totalPages}</p>
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                    className="p-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                {getPageNumbers(currentPage, totalPages).map((page, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => typeof page === 'number' && setCurrentPage(page)}
                                        className={`min-w-9 h-9 rounded-lg text-sm font-medium transition ${currentPage === page
                                            ? "bg-blue-600 text-white shadow-sm"
                                            : "hover:bg-white border border-transparent hover:border-gray-200 text-gray-600"
                                            } ${page === "..." ? "cursor-default" : "cursor-pointer"}`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                    className="p-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                {openShowTransaction && selectedTransaction && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setOpenShowTransaction(false)}>
                        <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setOpenShowTransaction(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 cursor-pointer">✕</button>

                            <h2 className="text-lg font-bold mb-6 text-gray-800 border-b pb-2">Chi Tiết Giao Dịch</h2>

                            <div className="space-y-4 text-sm">
                                {/* Thông tin mã đơn */}
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Mã đơn hàng:</span>
                                    <span className="font-mono font-bold text-blue-600">{selectedTransaction.orderCode}</span>
                                </div>

                                <div className="flex justify-between items-start">
                                    <span className="text-gray-500">Khách hàng:</span>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900">{selectedTransaction.fullName}</p>
                                        <p className="text-xs text-gray-500">{selectedTransaction.email}</p>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Số tiền:</span>
                                    <span className="font-bold text-lg text-rose-600">
                                        ₫{selectedTransaction.amount?.toLocaleString()}
                                    </span>
                                </div>

                                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 space-y-2">
                                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Thời hạn sử dụng Bot</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Ngày bắt đầu:</span>
                                        <span className="font-semibold text-gray-800">
                                            {selectedTransaction.startDate ? format(addHours(new Date(selectedTransaction.startDate), 7), "dd/MM/yyyy") : "---"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Ngày kết thúc:</span>
                                        <span className="font-bold text-blue-700">
                                            {selectedTransaction.endDate ? format(addHours(new Date(selectedTransaction.endDate), 7), "dd/MM/yyyy") : "---"}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Trạng thái:</span>
                                    <TransactionStatusBadge status={selectedTransaction.status} />
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Ngày thanh toán:</span>
                                    <span className="text-gray-700">
                                        {selectedTransaction.date ? format(addHours(new Date(selectedTransaction.date), 7), "dd/MM/yyyy HH:mm:ss") : "--:--"}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-8">
                                <button
                                    onClick={() => setOpenShowTransaction(false)}
                                    className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium cursor-pointer"
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

const TransactionStatusBadge = ({ status }: { status: string }) => {
    let styles = ""; let Icon = CheckCircle2; let text = status; const lowerStatus = status?.toLowerCase() || "";
    if (lowerStatus === "success" || lowerStatus === "paid" || lowerStatus === "thành công") {
        styles = "bg-emerald-50 text-emerald-700 border-emerald-200"; Icon = CheckCircle2; text = "Thành công";
    } else if (lowerStatus === "pending") {
        styles = "bg-amber-50 text-amber-700 border-amber-200"; Icon = Clock; text = "Đang xử lý";
    } else {
        styles = "bg-rose-50 text-rose-700 border-rose-200"; Icon = XCircle; text = "Thất bại";
    }
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${styles}`}>
            <Icon size={14} />
            <span className="leading-none whitespace-nowrap">{text}</span>
        </span>
    );
};

export default HistoryBot;