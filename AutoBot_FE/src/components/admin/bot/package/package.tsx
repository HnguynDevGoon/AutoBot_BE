'use client';

import { Download, Edit, MoreHorizontal, Plus, Search, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import CreatePackage from "./createpackage/createpackage";
import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";
import { GetAccessToken } from "@/components/shared/token/accessToken";
import axios from "axios";
import { FaDollarSign, FaPercent, FaRegCalendar, FaRobot } from "react-icons/fa";
import { MdOutlineDescription } from "react-icons/md";
import Swal from "sweetalert2";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import EditPackage from "./editpackage/editpackage";

const Package = () => {
    const userInfo = useSelector((state: RootState) => state.user.userInfo);
    const [accessToken, setAccessToken] = useState<string>('');
    const [isCreateModal, setIsCreateModal] = useState<boolean>(false);
    const [isEditModal, setIsEditModal] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [listPriceBot, setListPriceBot] = useState<any>({ items: [], totalItems: 0, totalPages: 0 });
    const [selectedPriceBot, setSelectedPriceBot] = useState<any>();
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [priceSort, setPriceSort] = useState<string>("");
    const [discountSort, setDiscountSort] = useState<string>("");

    useEffect(() => {
        const loadToken = async () => {
            if (userInfo?.Id) {
                const token = await GetAccessToken(userInfo?.Id);
                if (token) setAccessToken(token);
            }
        };
        loadToken();
    }, [userInfo]);

    const fetchPackages = useCallback(async (page: number) => {
        if (!accessToken) return;
        try {
            const getSortValue = (val: string) => val === "" ? null : (val === "true");
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_URL_API}BotTrading/SearchPriceBotByAdmin`,
                {
                    keyword: searchTerm || "",
                    price: getSortValue(priceSort),
                    discount: getSortValue(discountSort),
                    pageNumber: page,
                    pageSize: process.env.NEXT_PUBLIC_PAGE_SIZE
                },
                {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                }
            );
            if (res.data && res.data.data) {
                setListPriceBot(res.data.data);
            }
        } catch (err) {
        }
    }, [accessToken, searchTerm, priceSort, discountSort, process.env.NEXT_PUBLIC_PAGE_SIZE]);

    useEffect(() => {
        if (accessToken) {
            fetchPackages(currentPage);
        }
    }, [accessToken, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, priceSort, discountSort]);

    const handleDeletePriceBot = async (priceBotId: string) => {
        Swal.fire({
            title: "Bạn có chắc muốn xóa gói này?",
            text: "Gói sẽ bị xóa vĩnh viễn!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Xóa gói",
            cancelButtonText: "Hủy bỏ"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await axios.delete(`${process.env.NEXT_PUBLIC_URL_API}BotTrading/DeletePriceBot?id=${priceBotId}`, {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                    });
                    if (res.data) {
                        toast.success(`Gói Bot đã được xóa thành công!`);
                        fetchPackages(currentPage);
                    }
                } catch (error) {
                    toast.error(`Không thể xóa gói Bot. Vui lòng thử lại!`);
                }
            }
        });
    }

    const handleExportExcel = async () => {
        if (!accessToken) return;
        setIsExporting(true);
        const toastId = toast.loading("Đang tạo file Excel...");
        try {
            const getSortValue = (val: string) => val === "" ? null : (val === "true");
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_URL_API}BotTrading/SearchPriceBotByAdmin`,
                {
                    keyword: searchTerm || "",
                    price: getSortValue(priceSort),
                    discount: getSortValue(discountSort),
                    pageNumber: 1,
                    pageSize: 10000
                },
                { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );
            const data = res.data?.data?.items || [];
            if (data.length === 0) {
                toast.dismiss(toastId);
                toast.warning("Không có dữ liệu để xuất");
                setIsExporting(false);
                return;
            }
            const formattedData = data.map((item: any, index: number) => ({
                "STT": index + 1,
                "Tên Bot": item.nameBot,
                "Số tháng": item.month,
                "Giá tiền ($)": item.price,
                "Giảm giá (%)": item.discount,
                "Mô tả": item.description
            }));

            const worksheet = XLSX.utils.json_to_sheet(formattedData);
            const wscols = [{ wch: 5 }, { wch: 20 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 40 }];
            worksheet['!cols'] = wscols;
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách Gói Bot");
            XLSX.writeFile(workbook, `Danh_sach_goi_bot_${new Date().toISOString().slice(0, 10)}.xlsx`);

            toast.success("Xuất Excel thành công!");
        } catch (error) {
            toast.error("Có lỗi khi xuất file Excel");
        } finally {
            toast.dismiss(toastId);
            setIsExporting(false);
        }
    };

    return (
        <div className="flex min-h-screen font-sans text-gray-800">
            <main className="flex-1 transition-all duration-300 w-full max-w-[100vw] overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4 px-1">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Quản lý gói</h1>
                        <p className="text-xs md:text-sm text-gray-500 mt-1">Theo dõi toàn bộ gói bot đang có của hệ thống.</p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button
                            onClick={handleExportExcel}
                            disabled={isExporting}
                            className={`flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition cursor-pointer ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Download size={16} />
                            {isExporting ? "Đang xuất..." : "Xuất Excel"}
                        </button>
                        <button
                            onClick={() => setIsCreateModal(true)}
                            className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-lg shadow-blue-200 transition transform hover:-translate-y-0.5 cursor-pointer">
                            <Plus size={16} />
                            Thêm mới
                        </button>

                        <CreatePackage isCreateModal={isCreateModal} setIsCreateModal={setIsCreateModal} accessToken={accessToken} handleGetPriceBot={() => fetchPackages(currentPage)} currentPage={currentPage} />
                        <EditPackage currentPage={currentPage} handleGetPriceBot={() => fetchPackages(currentPage)} isEditModal={isEditModal} priceData={selectedPriceBot} setIsEditModal={setIsEditModal} />

                    </div>
                </div>
                <div className="bg-white p-4 rounded-t-xl border border-gray-200 border-b-0 flex flex-col lg:flex-row gap-4 justify-between items-center mb-0">
                    <div className="relative w-full lg:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm theo gói..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-2 lg:flex gap-2 w-full lg:w-auto">
                        <select onChange={(e) => setPriceSort(e.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none cursor-pointer hover:bg-gray-50 w-full lg:w-auto">
                            <option value={""}>Giá tiền</option>
                            <option value={"true"}>Thấp đến cao</option>
                            <option value={"false"}>Cao đến thấp</option>
                        </select>
                        <select onChange={(e) => setDiscountSort(e.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none cursor-pointer hover:bg-gray-50 w-full lg:w-auto">
                            <option value={""}>Giảm giá</option>
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
                                    <th className="px-4 md:px-6 py-4 whitespace-nowrap">Tên Bot</th>
                                    <th className="px-4 md:px-6 py-4 whitespace-nowrap">Số tháng</th>
                                    <th className="px-4 md:px-6 py-4 whitespace-nowrap">Giá tiền</th>
                                    <th className="px-4 md:px-6 py-4 whitespace-nowrap">Phần trăm giảm giá</th>
                                    <th className="px-4 md:px-6 py-4 whitespace-nowrap">Mô tả</th>
                                    <th className="px-4 md:px-6 py-4 text-right whitespace-nowrap">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {listPriceBot?.items?.length > 0 ? listPriceBot?.items?.map((bot: any, index: number) => (
                                    <tr key={bot.id} className="hover:bg-blue-50/30 transition duration-150 group">
                                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <p className="text-xs font-semibold text-gray-900">{(currentPage - 1) * Number(process.env.NEXT_PUBLIC_PAGE_SIZE) + index + 1}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <FaRobot size={14} className="text-gray-400" />
                                                <p className="text-xs font-semibold text-gray-900">{bot.nameBot}</p>
                                            </div>
                                        </td>

                                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <FaRegCalendar size={14} className="text-gray-400" />
                                                {bot.month}
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <FaDollarSign size={14} className="text-gray-400" />
                                                {bot.price}
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <FaPercent size={14} className="text-gray-400" />
                                                {bot.discount}
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-6 py-4">
                                            <div className="flex items-center gap-2 text-xs text-gray-600 truncate max-w-[200px]" title={bot.description}>
                                                <MdOutlineDescription size={14} className="text-gray-400 shrink-0" />
                                                <span className="truncate">{bot.description}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-6 py-4 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedPriceBot(bot);
                                                        setIsEditModal(true);
                                                    }}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer" title="Chỉnh sửa">
                                                    <Edit size={16} />
                                                </button>

                                                <button
                                                    onClick={() => handleDeletePriceBot(bot.id)}
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
                    {listPriceBot?.items?.length > 0 && (
                        <div className="px-4 md:px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-white gap-4">
                            <span className="text-xs text-gray-500">
                                Hiển thị <span className="font-bold text-gray-800">{listPriceBot?.items?.length}</span> trên tổng số <span className="font-bold text-gray-800">{listPriceBot.totalItems}</span>
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
                                    {listPriceBot.totalPages > 0 && Array.from({ length: listPriceBot.totalPages }, (_, i) => i + 1).map(page => (
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
                                <span className="text-xs font-medium sm:hidden">Trang {currentPage} / {listPriceBot.totalPages}</span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, listPriceBot.totalPages))}
                                    disabled={currentPage === listPriceBot.totalPages}
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

export default Package;