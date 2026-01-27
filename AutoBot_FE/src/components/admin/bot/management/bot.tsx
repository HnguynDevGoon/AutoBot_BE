"use client"

import { ChevronLeft, ChevronRight, Download, Edit, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import CreateBot from "./createbot/createbot";
import { GetAccessToken } from "@/components/shared/token/accessToken";
import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";
import axios from "axios";
import { FaDollarSign, FaPercent, FaRobot, FaSignal } from "react-icons/fa";
import { MdOutlineNumbers } from "react-icons/md";
import Swal from "sweetalert2";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import EditBot from "./editbot/editbot";

const Bot = () => {
    const userInfo = useSelector((state: RootState) => state.user.userInfo);
    const [accessToken, setAccessToken] = useState<string>('');
    const [isCreateModal, setIsCreateModal] = useState<boolean>(false);
    const [isEditModal, setIsEditModal] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [listBot, setListBot] = useState<any>([]);
    const [selectedBot, setSelectedBot] = useState<any>();
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [interestRate, setInterestRate] = useState<string>('');
    const [totalProfit, setTotalProfit] = useState<string>('');
    const [winRate, setWinRate] = useState<string>('');

    useEffect(() => {
        const loadToken = async () => {
            if (userInfo?.Id) {
                const token = await GetAccessToken(userInfo?.Id);
                if (token) setAccessToken(token);
            }
        };
        loadToken();
    }, [userInfo]);

    const fetchBots = useCallback(async (page: number) => {
        if (!accessToken) return;
        try {
            const getSortValue = (val: string) => val === "" ? null : (val === "true");
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_URL_API}BotTrading/SearchBotTradingByAdmin`,
                {
                    keyword: searchTerm || "",
                    interestRate: getSortValue(interestRate),
                    totalProfit: getSortValue(totalProfit),
                    winRate: getSortValue(winRate),
                    pageNumber: page,
                    pageSize: process.env.NEXT_PUBLIC_PAGE_SIZE
                },
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );
            if (res.data && res.data.data) {
                setListBot(res.data.data);
            }
        } catch (err) {
        }
    }, [accessToken, searchTerm, interestRate, totalProfit, winRate, process.env.NEXT_PUBLIC_PAGE_SIZE]);

    useEffect(() => {
        if (accessToken) {
            fetchBots(currentPage);
        }
    }, [accessToken, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, interestRate, totalProfit, winRate]);


    const handleDeleteBot = async (id: string) => {
        Swal.fire({
            title: "Bạn có chắc muốn xóa Bot này?",
            text: "Bot sẽ bị xóa vĩnh viễn!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Xóa Bot",
            cancelButtonText: "Hủy bỏ"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await axios.delete(`${process.env.NEXT_PUBLIC_URL_API}BotTrading/DeleteBot?id=${id}`, {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`
                        }
                    });
                    if (res.data.status === 200) {
                        toast.success(`Bot đã được xóa thành công!`);
                        fetchBots(currentPage);
                    } else {
                        toast.error(`Bot không thể xóa!`);
                    }
                } catch (error) {
                    toast.error(`Không thể xóa bot. Vui lòng thử lại!`);
                }
            }
        });
    }

    const handleExportExcel = async () => {
        if (!accessToken) return;
        const toastId = toast.loading("Đang tạo file Excel...");

        try {
            const getSortValue = (val: string) => val === "" ? null : (val === "true");

            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_URL_API}BotTrading/SearchBotTradingByAdmin`,
                {
                    keyword: searchTerm || "",
                    interestRate: getSortValue(interestRate),
                    totalProfit: getSortValue(totalProfit),
                    winRate: getSortValue(winRate),
                    pageNumber: 1,
                    pageSize: 10000
                },
                { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );

            const data = res.data?.data?.items || [];
            if (data.length === 0) {
                toast.dismiss(toastId);
                toast.warning("Không có dữ liệu để xuất");
                return;
            }

            const formattedData = data.map((item: any, index: number) => ({
                "STT": index + 1,
                "Tên Bot": item.nameBot,
                "Lãi suất (%)": item.interestRate,
                "Lợi nhuận": item.totalProfit,
                "Số lệnh": item.commandNumber,
                "Tỉ lệ thắng (%)": item.winRate,
            }));

            const worksheet = XLSX.utils.json_to_sheet(formattedData);

            const wscols = [
                { wch: 5 },
                { wch: 25 },
                { wch: 15 },
                { wch: 15 },
                { wch: 10 },
                { wch: 15 },
            ];
            worksheet['!cols'] = wscols;

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách Bot");
            XLSX.writeFile(workbook, `Danh_sach_bot_${new Date().toISOString().slice(0, 10)}.xlsx`);

            toast.success("Xuất Excel thành công!");
        } catch (error) {
            toast.error("Có lỗi khi xuất file Excel");
        }
    };

    return (
        <div className="flex min-h-screen font-sans text-gray-800 bg-gray-50/50">
            <main className="flex-1 transition-all duration-300 w-full overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4 px-1">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Quản lý bot</h1>
                        <p className="text-xs md:text-sm text-gray-500 mt-1">Theo dõi toàn bộ bot của hệ thống.</p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button
                            onClick={handleExportExcel}
                            className={`flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition cursor-pointer`}
                        >
                            <Download size={16} /> Xuất Excel
                        </button>
                        <button
                            onClick={() => setIsCreateModal(true)}
                            className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-lg shadow-blue-200 transition transform hover:-translate-y-0.5 cursor-pointer">
                            <Plus size={16} />
                            Thêm mới
                        </button>

                        <CreateBot isCreateModal={isCreateModal} setIsCreateModal={setIsCreateModal} handleGetBot={() => fetchBots(currentPage)} accessToken={accessToken} currentPage={currentPage} />
                        <EditBot botData={selectedBot} isEditModal={isEditModal} setIsEditModal={setIsEditModal} handleGetBot={() => fetchBots(currentPage)} currentPage={currentPage} />

                    </div>
                </div>
                <div className="bg-white p-4 rounded-t-xl border border-gray-200 border-b-0 flex flex-col lg:flex-row gap-4 justify-between items-center mb-0">
                    <div className="relative w-full lg:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm theo tên bot..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-2 w-full lg:w-auto">
                        <select onChange={(e) => setInterestRate(e.target.value)} className="px-2 md:px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs md:text-sm text-gray-600 focus:outline-none cursor-pointer hover:bg-gray-50 w-full">
                            <option value={""}>Lãi suất</option>
                            <option value={"true"}>Thấp đến cao</option>
                            <option value={"false"}>Cao đến thấp</option>
                        </select>
                        <select onChange={(e) => setTotalProfit(e.target.value)} className="px-2 md:px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs md:text-sm text-gray-600 focus:outline-none cursor-pointer hover:bg-gray-50 w-full">
                            <option value={""}>Lợi nhuận</option>
                            <option value={"true"}>Thấp đến cao</option>
                            <option value={"false"}>Cao đến thấp</option>
                        </select>
                        <select onChange={(e) => setWinRate(e.target.value)} className="px-2 md:px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs md:text-sm text-gray-600 focus:outline-none cursor-pointer hover:bg-gray-50 w-full">
                            <option value={""}>Tỉ lệ thắng</option>
                            <option value={"true"}>Thấp đến cao</option>
                            <option value={"false"}>Cao đến thấp</option>
                        </select>
                    </div>
                </div>
                <div className="bg-white rounded-b-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="px-4 md:px-6 py-4 whitespace-nowrap"></th>
                                    <th className="px-4 md:px-6 py-4 whitespace-nowrap">Tên bot</th>
                                    <th className="px-4 md:px-6 py-4 whitespace-nowrap">Lãi suất</th>
                                    <th className="px-4 md:px-6 py-4 whitespace-nowrap">Lợi nhuận</th>
                                    <th className="px-4 md:px-6 py-4 whitespace-nowrap">Số lệnh</th>
                                    <th className="px-4 md:px-6 py-4 whitespace-nowrap">Tỉ lệ thắng</th>
                                    <th className="px-4 md:px-6 py-4 text-right whitespace-nowrap">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {listBot?.items?.length > 0 ? listBot?.items?.map((bot: any, index: number) => (
                                    <tr key={bot.id} className="hover:bg-blue-50/30 transition duration-150 group">
                                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <p className="text-xs font-semibold text-gray-900">{(currentPage - 1) * Number(process.env.NEXT_PUBLIC_PAGE_SIZE) + index + 1}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <FaRobot size={14} className="text-gray-400" />
                                                <p className="text-xs md:text-sm font-semibold text-gray-900">{bot.nameBot}</p>
                                            </div>
                                        </td>

                                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                                                <FaDollarSign size={14} className="text-gray-400" />
                                                {bot.interestRate}%
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                                                <FaSignal size={14} className="text-gray-400" />
                                                {bot.totalProfit}
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                                                <MdOutlineNumbers size={14} className="text-gray-400" />
                                                {bot.commandNumber}
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                                                <FaPercent size={14} className="text-gray-400" />
                                                {bot.winRate}%
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-6 py-4 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedBot(bot);
                                                        setIsEditModal(true);
                                                    }}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer" title="Chỉnh sửa">
                                                    <Edit size={16} />
                                                </button>

                                                <button
                                                    onClick={() => handleDeleteBot(bot.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                                                    title="Xóa"
                                                >
                                                    <Trash2 size={16} />
                                                </button>

                                                <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition cursor-pointer">
                                                    <MoreHorizontal size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-10 text-center text-gray-400">
                                            Không tìm thấy kết quả nào.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {listBot?.items?.length > 0 && (
                        <div className="px-4 md:px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-white gap-4">
                            <span className="text-xs text-gray-500">
                                Hiển thị <span className="font-bold text-gray-800">{listBot?.items?.length}</span> trên tổng số <span className="font-bold text-gray-800">{listBot.totalItems}</span>
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <div className="hidden sm:flex gap-1">
                                    {listBot.totalPages > 0 && Array.from({ length: listBot.totalPages }, (_, i) => i + 1).map(page => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer ${currentPage === page
                                                ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                                                : "text-gray-600 hover:bg-gray-100"
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>
                                <span className="text-xs font-medium sm:hidden">Trang {currentPage} / {listBot.totalPages}</span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, listBot.totalPages))}
                                    disabled={currentPage === listBot.totalPages}
                                    className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

export default Bot;