'use client';

import { useEffect, useState, useCallback, useMemo } from "react";
import {
    Search, Plus, Trash2, Edit, Download,
    Bot, User as UserIcon, Calendar
} from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { GetAccessToken } from "@/components/shared/token/accessToken";
import axios from "axios";
import { toast } from "sonner";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import CreateUserBot from "./createuserbot/createuserbot";
import EditUserBot from "./edituserbot/edituserbot";

const UserBotManagement = () => {
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [accessToken, setAccessToken] = useState<string>('');
    const userInfo = useSelector((state: RootState) => state.user.userInfo);
    const [listUserBot, setListUserBot] = useState<any>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [selectedUserBot, setSelectedUserBot] = useState<any>(null);

    useEffect(() => {
        const loadToken = async () => {
            if (userInfo?.Id) {
                const token = await GetAccessToken(userInfo?.Id);
                if (token) setAccessToken(token);
            }
        };
        loadToken();
    }, [userInfo]);

    const fetchUserBots = useCallback(async (page: number) => {
        if (!accessToken) return;
        try {
            const res = await axios.get(
                `${process.env.NEXT_PUBLIC_URL_API}UserBot/GetUserBots`,
                {
                    params: {
                        pageNumber: page,
                        pageSize: 100,
                    },
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );
            if (res.data) setListUserBot(res.data.data);
        } catch (err) {
        }
    }, [accessToken]);

    useEffect(() => {
        fetchUserBots(currentPage);
    }, [accessToken, currentPage, fetchUserBots]);

    const filteredItems = useMemo(() => {
        const items = listUserBot?.items || [];

        return items.filter((item: any) => {
            const matchesSearch =
                (item.userName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                (item.botName?.toLowerCase() || "").includes(searchTerm.toLowerCase());

            const isExpired = new Date(item.expiredDate) < new Date();
            let matchesStatus = true;
            if (statusFilter === "active") matchesStatus = !isExpired;
            if (statusFilter === "expired") matchesStatus = isExpired;

            return matchesSearch && matchesStatus;
        });
    }, [searchTerm, statusFilter, listUserBot]);

    const confirmDelete = (item: any) => {
        Swal.fire({
            title: "Xác nhận gỡ Bot?",
            text: `Bạn có chắc chắn muốn gỡ quyền sử dụng bot của ${item.userName || 'người dùng này'} không?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Xóa Bot",
            cancelButtonText: "Hủy",
            reverseButtons: true
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await axios.delete(`${process.env.NEXT_PUBLIC_URL_API}UserBot/DeleteUserBot?id=${item.id}`, {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    });

                    if (res.status === 200) {
                        toast.success(`Đã xóa Bot khỏi tài khoản ${item.userName}`)
                        fetchUserBots(currentPage);
                    }
                } catch (err) {
                    toast.error(`Lỗi xóa bot khỏi tài khoản ${item.userName}`)
                }
            }
        });
    };

    const handleEditClick = (item: any) => {
        setSelectedUserBot(item);
        setIsEditModalOpen(true);
    };

    const handleExportExcel = () => {
        try {
            const data = filteredItems.map((item: any) => ({
                "Tên khách hàng": item.userName,
                "Tên Bot": item.botName || "N/A",
                "Ngày hết hạn": new Date(item.expiredDate).toLocaleDateString('vi-VN'),
                "Trạng thái": new Date(item.expiredDate) < new Date() ? "Hết hạn" : "Đang chạy"
            }));
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "UserBot");
            XLSX.writeFile(workbook, "Danh_sach_UserBot_Filtered.xlsx");
            toast.success("Xuất Excel thành công!");
        } catch {
            toast.error("Lỗi xuất Excel");
        }
    };

    return (
        <div className="flex min-h-screen font-sans text-gray-800 bg-gray-50/50">
            <main className="flex-1 w-full mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng Bot</h1>
                        <p className="text-sm text-gray-500 mt-1">Dữ liệu được lọc trực tiếp từ danh sách hiện có.</p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button onClick={handleExportExcel} className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition cursor-pointer">
                            <Download size={16} /> Xuất Excel
                        </button>
                        <button onClick={() => setIsModalOpen(true)} className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-lg shadow-blue-200 transition cursor-pointer">
                            <Plus size={16} /> Thêm mới
                        </button>
                    </div>
                </div>

                <CreateUserBot isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} accessToken={accessToken} currentPage={currentPage} fetchUserBots={() => fetchUserBots(currentPage)} />
                <EditUserBot isModalEditOpen={isEditModalOpen} setIsModalEditOpen={setIsEditModalOpen} userBotData={selectedUserBot} currentPage={currentPage} accessToken={accessToken} onSave={() => fetchUserBots(currentPage)} />

                <div className="flex justify-between items-center flex-col md:flex-row bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 gap-4">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm nhanh tên user hoặc bot..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select
                        className="w-full md:w-auto px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 cursor-pointer outline-none focus:border-blue-500"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="active">Đang hoạt động</option>
                        <option value="expired">Đã hết hạn</option>
                    </select>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                                    <th className="px-6 py-4">Người dùng</th>
                                    <th className="px-6 py-4">Sản phẩm Bot</th>
                                    <th className="px-6 py-4">Ngày hết hạn</th>
                                    <th className="px-6 py-4">Trạng thái</th>
                                    <th className="px-6 py-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredItems.length > 0 ? (
                                    filteredItems.map((item: any) => {
                                        const isExpired = new Date(item.expiredDate) < new Date();
                                        return (
                                            <tr key={item.id} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                            {item.userName?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-900">{item.userName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                                        <Bot size={16} className="text-gray-400" />
                                                        {item.botName}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Calendar size={14} />
                                                        {new Date(item.expiredDate).toLocaleDateString('vi-VN')}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${isExpired ? "bg-red-50 text-red-600 border-red-100" : "bg-green-50 text-green-600 border-green-100"}`}>
                                                        {isExpired ? "Hết hạn" : "Đang chạy"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEditClick(item)}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => confirmDelete(item)}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">
                                            Không có kết quả nào khớp với tìm kiếm của bạn.
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

export default UserBotManagement;