"use client";

import React, { useEffect, useState } from "react";
import {
    Search, ChevronLeft, ChevronRight, Eye, CheckCircle,
    Download
} from "lucide-react";
import axios from "axios";
import { GetAccessToken } from "@/components/shared/token/accessToken";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { format, addHours } from "date-fns";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

const WithdrawMoney = () => {
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [accessToken, setAccessToken] = useState<string>('');
    const userInfo = useSelector((state: RootState) => state.user.userInfo);
    const [withdraws, setWithdraws] = useState<any[]>([]);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [openShowWithdraw, setOpenShowWithdraw] = useState<boolean>(false);
    const [selectedWithdraw, setSelectedWithdraw] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    useEffect(() => {
        if (!userInfo?.Id) return;
        const loadToken = async () => {
            const token = await GetAccessToken(userInfo?.Id);
            if (token) setAccessToken(token);
        };
        loadToken();
    }, [userInfo]);

    useEffect(() => {
        if (accessToken) {
            getWithdraws();
        }
    }, [accessToken, currentPage]);

    const getWithdraws = async () => {
        if (!accessToken) return;
        try {
            const res = await axios.get(
                `${process.env.NEXT_PUBLIC_URL_API}Payment/GetWithdrawRequestsAsync?pageSize=${process.env.NEXT_PUBLIC_PAGE_SIZE}&pageNumber=${currentPage}`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            const totalItems = res.data?.data?.totalItems || 0;
            setTotalPages(Math.ceil(totalItems / Number(process.env.NEXT_PUBLIC_PAGE_SIZE)));
            const data = res.data?.data?.items || [];
            const formattedData = data.map((x: any) => ({
                id: x.id,
                userName: x.userName,
                fullName: x.fullName,
                email: x.email,
                bankName: x.bankName,
                bankNumber: x.bankCode,
                bankHolder: x.userBankName,
                qrCodeUrl: x.qrCode,
                amount: x.bankAmount,
                requestDate: x.createdAt,
                status: x.status
            }));
            setWithdraws(formattedData);
        } catch (err) {
        }
    };

    const handleConfirmTransfer = async () => {
        if (!selectedWithdraw || !accessToken) return;
        try {
            setIsProcessing(true);
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_URL_API}Payment/ConfirmWithdrawTransfer?withdrawId=${selectedWithdraw.id}`,
                {},
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (res.data.status === 200 || res.data.success) {
                toast.success("Xác nhận chuyển tiền thành công!");
                setOpenShowWithdraw(false);
                setSelectedWithdraw(null);
                getWithdraws();
            } else {
                toast.error(res.data.message || "Có lỗi xảy ra.");
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Lỗi kết nối server.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleExportExcel = () => {
        try {
            const dataToExport = withdraws.map((w) => ({
                "Họ Tên": w.fullName,
                "Email": w.email,
                "Ngân Hàng": w.bankName,
                "Số Tài Khoản": w.bankNumber,
                "Chủ Tài Khoản": w.bankHolder,
                "Số Tiền (VNĐ)": w.amount,
                "Ngày Yêu Cầu": w.requestDate ? format(addHours(new Date(w.requestDate), 7), "dd-MM-yyyy HH:mm") : "",
                "Trạng Thái": (w.status === 'Success' || w.status === 'True') ? 'Đã chuyển' : 'Chờ duyệt'
            }));

            const worksheet = XLSX.utils.json_to_sheet(dataToExport);

            const wscols = [
                { wch: 25 },
                { wch: 30 },
                { wch: 20 },
                { wch: 20 },
                { wch: 25 },
                { wch: 15 },
                { wch: 20 },
                { wch: 15 },
            ];
            worksheet['!cols'] = wscols;
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sach rut tien");
            const fileName = `Yeu_Cau_Rut_Tien_${format(new Date(), "ddMMyyyy_HHmm")}.xlsx`;
            XLSX.writeFile(workbook, fileName);
            toast.success("Xuất Excel thành công!");
        } catch (error) {
            toast.error("Lỗi xuất Excel");
        }
    };

    const filteredData = withdraws.filter(item =>
        (item.fullName && item.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.email && item.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="flex min-h-screen font-sans text-gray-800 bg-gray-50/50">
            <main className="flex-1 transition-all duration-300">
                <div className="flex flex-col md:flex-row justify-between items-center md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Yêu cầu rút tiền</h1>
                        <p className="text-sm text-gray-500 mt-1">Quản lý các yêu cầu rút tiền từ người dùng.</p>
                    </div>
                    <button onClick={handleExportExcel} className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition cursor-pointer">
                        <Download size={16} /> Xuất Excel
                    </button>
                </div>
                <div className="bg-white p-4 rounded-t-xl border border-gray-200 border-b-0 flex flex-col sm:flex-row gap-4 justify-between items-center mb-2">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm theo tên hoặc email..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                    </div>

                </div>


                <div className="bg-white rounded-b-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="px-4 py-3 whitespace-nowrap">Người dùng</th>
                                    <th className="px-4 py-3 whitespace-nowrap">Ngân hàng</th>
                                    <th className="px-4 py-3 whitespace-nowrap">Số tài khoản</th>
                                    <th className="px-4 py-3 whitespace-nowrap">Chủ tài khoản</th>
                                    <th className="px-4 py-3 whitespace-nowrap text-center">QR</th>
                                    <th className="px-4 py-3 whitespace-nowrap text-right">Số tiền</th>
                                    <th className="px-4 py-3 whitespace-nowrap">Ngày yêu cầu</th>
                                    <th className="px-4 py-3 whitespace-nowrap text-center">Trạng thái</th>
                                    <th className="px-4 py-3 whitespace-nowrap text-center">Chi tiết</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {filteredData.length > 0 ? (
                                    filteredData.map((w) => (
                                        <tr key={w.id} className="hover:bg-blue-50/30 transition duration-150">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900 max-w-[150px] truncate" title={w.fullName}>{w.fullName}</div>
                                                <div className="text-xs text-gray-500 max-w-[150px] truncate" title={w.email}>{w.email}</div>
                                            </td>
                                            <td className="px-4 py-3 max-w-[140px] truncate" title={w.bankName}>
                                                {w.bankName}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-gray-600 whitespace-nowrap">
                                                {w.bankNumber}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap max-w-[120px] truncate" title={w.bankHolder}>
                                                {w.bankHolder}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {(w.qrCodeUrl && w.qrCodeUrl !== "Không") ? (
                                                    <div className="flex justify-center">
                                                        <img src={w.qrCodeUrl} alt="QR" className="w-8 h-8 object-cover rounded border border-gray-200" />
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">--</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right text-emerald-600 font-bold whitespace-nowrap">
                                                ₫{w.amount.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                                                {w.requestDate ? format(addHours(new Date(w.requestDate), 7), "dd-MM-yyyy HH:mm") : "--"}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${w.status === 'Success' || w.status === 'True'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {w.status === 'Success' || w.status === 'True' ? 'Đã chuyển' : 'Chờ duyệt'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => { setSelectedWithdraw(w); setOpenShowWithdraw(true); }}
                                                    className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition cursor-pointer"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                                            Không có yêu cầu rút tiền nào.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                        <span className="text-xs text-gray-500 hidden sm:block">
                            Trang {currentPage} / {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={16} />
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-7 h-7 rounded-md text-xs font-bold transition 
                                    ${currentPage === page ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
                {openShowWithdraw && selectedWithdraw && (
                    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => !isProcessing && setOpenShowWithdraw(false)}
                        ></div>

                        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">

                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-slate-800">Chi tiết rút tiền</h2>
                                <button
                                    onClick={() => setOpenShowWithdraw(false)}
                                    disabled={isProcessing}
                                    className="text-gray-400 hover:text-gray-600 transition p-1 hover:bg-gray-100 rounded-full cursor-pointer disabled:opacity-50"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto custom-scrollbar space-y-4 text-sm">
                                <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Người yêu cầu:</span>
                                        <span className="font-medium text-gray-900">{selectedWithdraw.fullName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Email:</span>
                                        <span className="text-gray-900">{selectedWithdraw.email}</span>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-4 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Ngân hàng:</span>
                                        <span className="font-medium text-blue-600">{selectedWithdraw.bankName}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Số tài khoản:</span>
                                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-800">{selectedWithdraw.bankNumber}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Chủ tài khoản:</span>
                                        <span className="text-gray-900 font-medium">{selectedWithdraw.bankHolder}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Số tiền rút:</span>
                                        <span className="text-xl font-bold text-emerald-600">₫{selectedWithdraw.amount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Trạng thái:</span>
                                        <span className={`font-bold ${selectedWithdraw.status === 'Success' || selectedWithdraw.status === 'True' ? 'text-green-600' : 'text-yellow-600'}`}>
                                            {selectedWithdraw.status === 'Success' || selectedWithdraw.status === 'True' ? 'Đã hoàn thành' : 'Đang chờ xử lý'}
                                        </span>
                                    </div>
                                </div>

                                {(selectedWithdraw.qrCodeUrl && selectedWithdraw.qrCodeUrl !== "Không") && (
                                    <div className="mt-4 flex flex-col items-center p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                                        <span className="text-xs text-gray-400 mb-2 uppercase font-bold tracking-wider">QR Code Chuyển khoản</span>
                                        <img src={selectedWithdraw.qrCodeUrl} alt="QR Code" className="w-48 h-48 object-contain rounded-lg shadow-sm" />
                                    </div>
                                )}

                                <div className="text-xs text-center text-gray-400 mt-2">
                                    Ngày tạo: {selectedWithdraw.requestDate ? format(addHours(new Date(selectedWithdraw.requestDate), 7), "dd-MM-yyyy HH:mm:ss") : "--"}
                                </div>
                            </div>
                            <div className="p-6 border-t border-gray-100 flex gap-3">
                                <button
                                    onClick={() => setOpenShowWithdraw(false)}
                                    disabled={isProcessing}
                                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition disabled:opacity-50 cursor-pointer"
                                >
                                    Đóng
                                </button>
                                {(selectedWithdraw.status === "Pending" || selectedWithdraw.status === "False") && (
                                    <button
                                        onClick={handleConfirmTransfer}
                                        disabled={isProcessing}
                                        className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Đang xử lý...
                                            </>
                                        ) : (
                                            <>
                                                Xác nhận đã chuyển
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default WithdrawMoney;