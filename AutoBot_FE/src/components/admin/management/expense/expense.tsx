'use client';

import { useEffect, useState, useCallback, useMemo } from "react";
import {
    Search, Plus, Trash2, Edit,
    Download, ChevronLeft, ChevronRight, Calendar, DollarSign, FileText, ArrowUpDown
} from "lucide-react";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { GetAccessToken } from "@/components/shared/token/accessToken";
import { toast } from "sonner";
import Swal from "sweetalert2"; // Import SweetAlert2
import * as XLSX from "xlsx";
import CreateExpense from "./createexpense/createexpense";
import EditExpense from "./editexpense/editexpense";

const ManagementExpense = () => {
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [accessToken, setAccessToken] = useState<string>('');
    const userInfo = useSelector((state: RootState) => state.user.userInfo);

    const [listExpense, setListExpense] = useState<any>([]);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isModalEditOpen, setIsModalEditOpen] = useState<boolean>(false);
    const [selectedExpense, setSelectedExpense] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [sortPrice, setSortPrice] = useState<string>("");

    useEffect(() => {
        const loadToken = async () => {
            if (userInfo?.Id) {
                const token = await GetAccessToken(userInfo?.Id);
                if (token) setAccessToken(token);
            }
        };
        loadToken();
    }, [userInfo]);

    useEffect(() => {
        if (accessToken) {
            getListExpense(currentPage);
        }
    }, [accessToken, currentPage]);

    const getListExpense = async (page: number = 1) => {
        try {
            const res = await axios.get(
                `${process.env.NEXT_PUBLIC_URL_API}Expense/GetExpenses`,
                {
                    params: {
                        pageNumber: page,
                        pageSize: process.env.NEXT_PUBLIC_PAGE_SIZE
                    }
                }
            );
            setListExpense(res.data.data);
            setCurrentPage(page);
        } catch (error) {
        }
    };

    const displayExpenses = useMemo(() => {
        if (!listExpense?.items) return [];
        let result = [...listExpense.items];

        if (searchTerm) {
            result = result.filter(item =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (sortPrice === "asc") {
            result.sort((a, b) => a.price - b.price);
        } else if (sortPrice === "desc") {
            result.sort((a, b) => b.price - a.price);
        }

        return result;
    }, [listExpense?.items, sortPrice, searchTerm]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortPrice]);

    const handleDelete = async (item: any) => {
        Swal.fire({
            title: "Xác nhận xóa chi phí?",
            text: `Khoản chi "${item.name}" sẽ bị xóa vĩnh viễn!`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Xóa ngay",
            cancelButtonText: "Hủy bỏ"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await axios.delete(
                        `${process.env.NEXT_PUBLIC_URL_API}Expense/Delete?id=${item.id}`,
                        { headers: { Authorization: `Bearer ${accessToken}` } }
                    );

                    if (res.status === 200 || res.data.status === 200) {
                        toast.success("Xóa khoản chi thành công!");
                        getListExpense(currentPage);
                    } else {
                        toast.error("Không thể xóa khoản chi này!");
                    }
                } catch (error) {
                    toast.error("Xóa thất bại. Vui lòng thử lại!");
                }
            }
        });
    };

    const handleExportExcel = () => {
        try {
            const formattedData = listExpense.items.map((item: any, index: number) => ({
                "STT": index + 1,
                "Tên khoản chi": item.name,
                "Số tiền": item.price.toLocaleString('vi-VN') + " đ",
                "Ngày chi": new Date(item.date).toLocaleDateString('vi-VN'),
                "Mô tả": item.description
            }));

            const worksheet = XLSX.utils.json_to_sheet(formattedData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Chi phí");
            XLSX.writeFile(workbook, `Quan_ly_chi_phi_${new Date().toISOString().slice(0, 10)}.xlsx`);
            toast.success("Xuất Excel thành công!");
        } catch {
            toast.error("Lỗi xuất Excel");
        }
    };

    return (
        <div className="flex min-h-screen font-sans text-gray-800 bg-gray-50/50">
            <main className="flex-1 w-full max-w-[100vw] overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Quản lý chi phí</h1>
                        <p className="text-xs md:text-sm text-gray-500 mt-1">Theo dõi các khoản chi tiêu của hệ thống.</p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button
                            onClick={handleExportExcel}
                            className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition cursor-pointer"
                        >
                            <Download size={16} /> Xuất file
                        </button>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 shadow-lg shadow-blue-200 transition transform hover:-translate-y-0.5 cursor-pointer">
                            <Plus size={16} /> Thêm mới
                        </button>
                    </div>
                </div>

                <CreateExpense isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} getListExpense={() => getListExpense(currentPage)} accessToken={accessToken} />
                <EditExpense isModalEditOpen={isModalEditOpen} setIsModalEditOpen={setIsModalEditOpen} onSave={() => getListExpense(currentPage)} expenseData={selectedExpense} accessToken={accessToken} />

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm tên khoản chi hoặc mô tả..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <select
                            onChange={(e) => setSortPrice(e.target.value)}
                            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none cursor-pointer hover:bg-gray-50 w-full"
                        >
                            <option value="">Sắp xếp theo giá</option>
                            <option value="desc">Giá cao đến thấp</option>
                            <option value="asc">Giá thấp đến cao</option>
                        </select>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Tên khoản chi</th>
                                    <th className="px-6 py-4 text-center">Số tiền</th>
                                    <th className="px-6 py-4">Ngày thực hiện</th>
                                    <th className="px-6 py-4">Mô tả</th>
                                    <th className="px-6 py-4 text-right">Hành động</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                                {displayExpenses.length > 0 ? displayExpenses.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-blue-50/30 transition duration-150 group">
                                        <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center gap-1 text-blue-700 font-bold bg-blue-50 px-2.5 py-1 rounded-lg">
                                                {item.price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-gray-400" />
                                                {new Date(item.date).toLocaleDateString('vi-VN')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-500 italic max-w-xs truncate">
                                                <FileText size={14} />
                                                {item.description || "Không có mô tả"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => { setSelectedExpense(item); setIsModalEditOpen(true); }}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer">
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition cursor-pointer">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-gray-400">Không có dữ liệu chi phí nào.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {listExpense?.totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <span className="text-xs text-gray-500">Trang {currentPage} / {listExpense.totalPages}</span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 border rounded-lg disabled:opacity-30 cursor-pointer hover:bg-gray-50"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(p + 1, listExpense.totalPages))}
                                    disabled={currentPage === listExpense.totalPages}
                                    className="p-2 border rounded-lg disabled:opacity-30 cursor-pointer hover:bg-gray-50"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ManagementExpense;