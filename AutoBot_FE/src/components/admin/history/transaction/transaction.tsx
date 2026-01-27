"use client";

import { useEffect, useState } from "react";
import {
  Search, Download, ChevronLeft, ChevronRight,
  CheckCircle2, Clock, XCircle, Eye
} from "lucide-react";
import axios from "axios";
import { GetAccessToken } from "@/components/shared/token/accessToken";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { addHours, format } from "date-fns";
import * as XLSX from "xlsx";
import { toast } from "sonner";

const HistoryTransaction = () => {
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
      if (accessToken) getHistoryTransaction();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, accessToken, currentPage]);

  const getHistoryTransaction = async () => {
    if (!accessToken) return;
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_URL_API}PurchaseHistory/GetAllHistoryDynamicForAdmin`,
        {
          params: {
            orderType: "",
            paymentMethod: "",
            searchKeyword: searchTerm,
            pageSize: process.env.NEXT_PUBLIC_PAGE_SIZE,
            pageNumber: currentPage
          },
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      const data = res.data?.data?.items || [];
      const totalP = res.data?.data?.totalPages || 1;
      setTotalPages(totalP);
      const mappedData = data.map((x: any) => ({
        id: x.id,
        userId: x.userId,
        fullName: x.userName || x.user?.fullName || "Người dùng",
        email: x.user?.email || "",
        amount: x.priceBot,
        method: x.paymentMethod,
        status: x.status,
        date: x.date,
        orderCode: x.orderCode || "---",
        orderType: x.orderType || (x.paymentMethod === 'BankTransfer' ? 'Withdraw' : 'Deposit'),
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
            orderType: "",
            paymentMethod: "",
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
        "Khách Hàng": item.userName || "N/A",
        "Loại Giao Dịch": item.orderType,
        "Số Tiền (VNĐ)": item.priceBot,
        "Trạng Thái": item.status,
        "Ngày": item.date ? format(addHours(new Date(item.date), 7), "dd/MM/yyyy HH:mm") : ""
      }));
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "LichSu");
      XLSX.writeFile(workbook, `BaoCao.xlsx`);
      toast.success("Xuất Excel thành công!");
    } catch (err) {
      toast.error("Lỗi xuất Excel");
    }
  };

  const getPageNumbers = (current: number, total: number) => {
    const pages: (number | string)[] = [];
    if (total <= 3) {
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
      <main className="flex-1 transition-all duration-300 w-full overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Lịch sử giao dịch</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">Quản lý toàn bộ giao dịch nạp / rút.</p>
          </div>
          <button
            onClick={handleExportExcel}
            className={`w-full md:w-auto flex justify-center items-center gap-2 text-sm px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition shadow-sm cursor-pointer`}
          >
            <Download size={16} /> Xuất Excel
          </button>
        </div>
        <div className="bg-white p-4 rounded-t-xl border border-gray-200 border-b-0 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm mã GD, email..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>
        <div className="bg-white rounded-b-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4 whitespace-nowrap">Mã GD</th>
                  <th className="px-6 py-4 whitespace-nowrap">Người Dùng</th>
                  <th className="px-6 py-4 whitespace-nowrap">Loại GD</th>
                  <th className="px-6 py-4 text-right whitespace-nowrap">Số Tiền</th>
                  <th className="px-6 py-4 whitespace-nowrap">Phương Thức</th>
                  <th className="px-6 py-4 whitespace-nowrap">Trạng Thái</th>
                  <th className="px-6 py-4 whitespace-nowrap">Thời Gian</th>
                  <th className="px-6 py-4 text-center whitespace-nowrap">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.length > 0 ? (
                  transactions.map((trx) => (
                    <tr key={trx.id} className="hover:bg-blue-50/30 transition duration-150">
                      <td className="px-6 py-4 font-mono text-sm font-medium text-gray-700 whitespace-nowrap">{trx.orderCode}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{trx.fullName}</p>
                            <p className="text-xs text-gray-500">{trx.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${(trx.orderType === 'Withdraw' || trx.method === 'BankTransfer') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {(trx.orderType === 'Withdraw' || trx.method === 'BankTransfer') ? 'Rút tiền' : 'Nạp tiền'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <span className={`text-sm font-bold ${(trx.orderType === 'Withdraw' || trx.method === 'BankTransfer') ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {(trx.orderType === 'Withdraw' || trx.method === 'BankTransfer') ? '-' : '+'} ₫{trx.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{trx.method}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><TransactionStatusBadge status={trx.status} /></td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{trx.date ? format(addHours(new Date(trx.date), 7), "dd-MM-yyyy HH:mm") : "--:--"}</td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <button onClick={() => { setSelectedTransaction(trx); setOpenShowTransaction(true); }} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"><Eye size={18} /></button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-400">Không tìm thấy giao dịch nào.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 md:px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-white gap-4">
            <span className="text-xs text-gray-500 hidden sm:inline-block">
              Hiển thị trang {currentPage} trên tổng số {totalPages}
            </span>
            <span className="text-xs font-medium sm:hidden">Trang {currentPage} / {totalPages}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 cursor-pointer">
                <ChevronLeft size={16} />
              </button>
              <div className="hidden sm:flex gap-1">
                {getPageNumbers(currentPage, totalPages).map((page, idx) =>
                  page === "..." ? (
                    <span key={idx} className="w-8 h-8 flex items-center justify-center text-gray-500 text-xs">...</span>
                  ) : (
                    <button key={idx} onClick={() => setCurrentPage(Number(page))} className={`w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer ${currentPage === page ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                      {page}
                    </button>
                  )
                )}
              </div>
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 cursor-pointer">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
        {openShowTransaction && selectedTransaction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 cursor-pointer" onClick={() => setOpenShowTransaction(false)}>
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
              <button onClick={() => setOpenShowTransaction(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700">✕</button>
              <h2 className="text-lg font-bold mb-6 text-gray-800">Chi Tiết Giao Dịch</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Mã GD:</span>
                  <span className="font-mono text-gray-900">{selectedTransaction.orderCode}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Người dùng:</span>
                  <span className="font-bold text-gray-900">{selectedTransaction.fullName}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Email:</span>
                  <span className="text-gray-900 truncate max-w-[200px]">{selectedTransaction.email}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Số tiền:</span>
                  <span className="font-bold text-lg text-emerald-600">₫{selectedTransaction.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Trạng thái:</span>
                  <TransactionStatusBadge status={selectedTransaction.status} />
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Thời gian:</span>
                  <span className="text-gray-900">{selectedTransaction.date ? format(addHours(new Date(selectedTransaction.date), 7), "dd-MM-yyyy HH:mm") : "--"}</span>
                </div>
              </div>
              <div className="mt-6">
                <button onClick={() => setOpenShowTransaction(false)} className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium cursor-pointer">Đóng</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const TransactionStatusBadge = ({ status }: { status: string }) => {
  let styles = ""; let Icon = CheckCircle2; let text = status; const lowerStatus = status?.toLowerCase() || "";
  if (lowerStatus === "success" || lowerStatus === "paid" || lowerStatus === "thành công") { styles = "bg-emerald-50 text-emerald-700 border-emerald-200"; Icon = CheckCircle2; text = "Thành công"; }
  else if (lowerStatus === "pending") { styles = "bg-amber-50 text-amber-700 border-amber-200"; Icon = Clock; text = "Đang xử lý"; }
  else { styles = "bg-rose-50 text-rose-700 border-rose-200"; Icon = XCircle; text = "Thất bại"; }
  return (<span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${styles}`}><Icon size={14} /><span className="leading-none whitespace-nowrap">{text}</span></span>);
};

export default HistoryTransaction;