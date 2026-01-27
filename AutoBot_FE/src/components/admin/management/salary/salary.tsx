'use client';

import { useEffect, useState, useMemo } from "react";
import {
    Search, Plus, Trash2, Edit,
    Download, ChevronLeft, ChevronRight, Calendar, DollarSign, FileText, User, Gift
} from "lucide-react";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { GetAccessToken } from "@/components/shared/token/accessToken";
import { toast } from "sonner";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import CreateSalary from "./createsalary/createsalary";
import EditSalary from "./editsalary/editsalary";

const ManagementSalary = () => {
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [accessToken, setAccessToken] = useState<string>('');
    const userInfo = useSelector((state: RootState) => state.user.userInfo);
    const [listSalary, setListSalary] = useState<any>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalEditOpen, setIsModalEditOpen] = useState<boolean>(false);
    const [selectedSalary, setSelectedSalary] = useState<any>(null);
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
            getListSalary(currentPage);
        }
    }, [accessToken, currentPage]);

    const getListSalary = async (page: number = 1) => {
        try {
            const res = await axios.get(
                `${process.env.NEXT_PUBLIC_URL_API}Salary/GetSalaries`,
                {
                    params: {
                        pageNumber: page,
                        pageSize: process.env.NEXT_PUBLIC_PAGE_SIZE || 10
                    },
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );
            setListSalary(res.data.data);
            setCurrentPage(page);
        } catch (error) {
        }
    };

    const displaySalaries = useMemo(() => {
        if (!listSalary?.items) return [];
        let result = [...listSalary.items];

        if (searchTerm) {
            result = result.filter(item =>
                item.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (sortPrice === "asc") {
            result.sort((a, b) => a.price - b.price);
        } else if (sortPrice === "desc") {
            result.sort((a, b) => b.price - a.price);
        }

        return result;
    }, [listSalary?.items, sortPrice, searchTerm]);

    const handleDelete = async (item: any) => {
        Swal.fire({
            title: "Xác nhận xóa?",
            text: `Bảng lương tháng ${item.month}/${item.year} của ${item.fullName} sẽ bị xóa!`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            confirmButtonText: "Xóa ngay",
            cancelButtonText: "Hủy"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.delete(
                        `${process.env.NEXT_PUBLIC_URL_API}Salary/DeleteSalary?id=${item.id}`,
                        { headers: { Authorization: `Bearer ${accessToken}` } }
                    );
                    toast.success("Xóa thành công!");
                    getListSalary(currentPage);
                } catch (error) {
                    toast.error("Xóa thất bại!");
                }
            }
        });
    };

    const handleExportExcel = () => {
        try {
            const formattedData = listSalary.items.map((item: any, index: number) => ({
                "STT": index + 1,
                "Nhân viên": item.user?.fullName,
                "Tháng": item.month,
                "Năm": item.year,
                "Lương cơ bản": item.price.toLocaleString('vi-VN') + " đ",
                "Thưởng": item.bonus.toLocaleString('vi-VN') + " đ",
                "Tổng cộng": (item.price + item.bonus).toLocaleString('vi-VN') + " đ",
                "Mô tả": item.description
            }));

            const worksheet = XLSX.utils.json_to_sheet(formattedData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách lương");
            XLSX.writeFile(workbook, `Bang_luong_${new Date().toLocaleDateString()}.xlsx`);
            toast.success("Xuất Excel thành công!");
        } catch {
            toast.error("Lỗi xuất Excel");
        }

    };

    return (
        <div className="flex min-h-screen font-sans text-gray-800 bg-gray-50/50">
            <main className="flex-1 w-full overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Quản lý lương</h1>
                        <p className="text-xs md:text-sm text-gray-500 mt-1">Quản lý lương nhân viên / cộng tác viên của hệ thống.</p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button onClick={handleExportExcel} className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition cursor-pointer">
                            <Download size={16} /> Xuất file
                        </button>
                        <button onClick={() => setIsModalOpen(true)} className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 shadow-lg shadow-blue-200 transition transform hover:-translate-y-0.5 cursor-pointer">
                            <Plus size={16} /> Thêm mới
                        </button>
                    </div>
                </div>

                <CreateSalary isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} getListSalary={() => getListSalary(currentPage)} accessToken={accessToken} />
                <EditSalary isModalEditOpen={isModalEditOpen} setIsModalEditOpen={setIsModalEditOpen} onSave={() => getListSalary(currentPage)} salaryData={selectedSalary} accessToken={accessToken} />

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm tên nhân viên..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select onChange={(e) => setSortPrice(e.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none cursor-pointer hover:bg-gray-50">
                        <option value="">Sắp xếp lương cơ bản</option>
                        <option value="desc">Cao đến thấp</option>
                        <option value="asc">Thấp đến cao</option>
                    </select>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Nhân viên</th>
                                    <th className="px-6 py-4 text-center">Thời gian</th>
                                    <th className="px-6 py-4 text-center">Lương cơ bản</th>
                                    <th className="px-6 py-4 text-center">Thưởng</th>
                                    <th className="px-6 py-4 text-center">Tổng cộng</th>
                                    <th className="px-6 py-4">Mô tả</th>
                                    <th className="px-6 py-4 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {displaySalaries.length > 0 ? displaySalaries.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-emerald-50/30 transition duration-150">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-full"><User size={16} /></div>
                                                <span className="font-medium text-gray-900">{item.fullName || "N/A"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm">
                                            <span className="bg-gray-100 px-2 py-1 rounded text-gray-600 font-medium">
                                                Tháng {item.month}/{item.year}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-semibold text-gray-700">
                                            {item.price.toLocaleString('vi-VN')} đ
                                        </td>
                                        <td className="px-6 py-4 text-center text-orange-600 font-medium">
                                            +{item.bonus.toLocaleString('vi-VN')} đ
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-emerald-700 font-bold">
                                                {(item.price + item.bonus).toLocaleString('vi-VN')} đ
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 italic max-w-[150px] truncate">
                                            {item.description || "---"}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => { setSelectedSalary(item); setIsModalEditOpen(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"><Edit size={16} /></button>
                                                <button onClick={() => handleDelete(item)} className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-400">Chưa có dữ liệu.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ManagementSalary;