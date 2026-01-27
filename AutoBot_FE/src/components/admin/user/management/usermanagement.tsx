"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Search, Plus, Trash2, Edit,
    Download, ChevronLeft, ChevronRight, Mail, Phone, ChevronDown
} from "lucide-react";
import Image from "next/image";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { GetAccessToken } from "@/components/shared/token/accessToken";
import { MdOutlineClose } from "react-icons/md";
import { FaCheck } from "react-icons/fa";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import EditUser from "./edituser/edituser";
import CreateUser from "./createuser/createuser";

const UserManagement = () => {
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [accessToken, setAccessToken] = useState<string>('');
    const userInfo = useSelector((state: RootState) => state.user.userInfo);
    const [listUser, setListUser] = useState<any>([]);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isModalEditOpen, setIsModalEditOpen] = useState<boolean>(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [authori, setAuthori] = useState<string>('');
    const [active, setActive] = useState<string>('');
    const [isExporting, setIsExporting] = useState(false);
    const [listRole, setListRole] = useState<any>([]);

    useEffect(() => {
        const loadToken = async () => {
            if (userInfo?.Id) {
                const token = await GetAccessToken(userInfo?.Id);
                if (token) setAccessToken(token);
            }
        };
        loadToken();
    }, [userInfo]);

    const fetchUsers = useCallback(async (page: number) => {
        if (!accessToken) return;
        try {
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_URL_API}Authen/SearchUserByAdmin`,
                {
                    keyword: searchTerm || "",
                    isActive: active === "true" ? true : (active === "false" ? false : null),
                    isLock: null,
                    roleName: authori || null,
                    pageNumber: page,
                    pageSize: process.env.NEXT_PUBLIC_PAGE_SIZE
                },
                { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );
            if (res.data && res.data.data) {
                setListUser(res.data.data);
            }
        } catch (err) {
            console.error("Lỗi lấy danh sách user:", err);
        }
    }, [accessToken, searchTerm, active, authori]);

    useEffect(() => {
        if (accessToken) {
            fetchUsers(currentPage);
            handleGetRoles(currentPage);
        }
    }, [accessToken, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, active, authori]);

    const handleGetRoles = async (page: number) => {
        await axios.get(`${process.env.NEXT_PUBLIC_URL_API}Role/GetListRole?pageSize=${process.env.NEXT_PUBLIC_PAGE_SIZE}&pageNumber=${page}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        }).then(res => {
            setListRole(res.data);
        })
    }

    const handleDeleteUser = async (user: any) => {
        Swal.fire({
            title: "Bạn có chắc muốn xóa?",
            text: `Người dùng ${user.fullName} sẽ bị xóa vĩnh viễn!`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Xóa người dùng",
            cancelButtonText: "Hủy bỏ",
            reverseButtons: true
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await axios.delete(
                        `${process.env.NEXT_PUBLIC_URL_API}Authen/DeleteUser?userId=${user.id}`,
                        { headers: { Authorization: `Bearer ${accessToken}` } }
                    );

                    if (res.status === 200 || res.data?.status === 200) {
                        toast.success("Xóa người dùng thành công");
                        fetchUsers(currentPage);
                    } else {
                        toast.error("Không thể xóa người dùng này");
                    }
                } catch (err) {
                    toast.error("Xóa thất bại. Vui lòng thử lại!");
                }
            }
        });
    };

    const handleUpdateRole = async (userId: string, newRole: string) => {
        try {
            await axios.post(
                `${process.env.NEXT_PUBLIC_URL_API}Authen/UpdateRoleByAdmin`,
                { id: userId, roleName: newRole },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            toast.success("Cập nhật quyền thành công");
            setListUser((prev: any) => ({
                ...prev,
                items: prev.items.map((u: any) => u.id === userId ? { ...u, roleName: newRole } : u)
            }));
        } catch (error) {
            toast.error("Cập nhật quyền thất bại");
            fetchUsers(currentPage);
        }
    }

    const handleExportExcel = async () => {
        if (!accessToken) return;
        setIsExporting(true);
        const toastId = toast.loading("Đang tạo file Excel...");
        try {
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_URL_API}Authen/SearchUserByAdmin`,
                {
                    keyword: searchTerm || "",
                    isActive: active === "true" ? true : (active === "false" ? false : null),
                    isLock: null,
                    roleName: authori || null,
                    pageNumber: 1,
                    pageSize: 10000
                },
                { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );
            const data = res.data?.data?.items || [];
            if (data.length === 0) {
                toast.warning("Không có dữ liệu để xuất");
                return;
            }
            const formattedData = data.map((item: any, index: number) => ({
                "STT": index + 1,
                "Họ và tên": item.fullName,
                "Email": item.email,
                "Số điện thoại": item.phoneNumber || "N/A",
                "Vai trò": item.roleName,
                "Trạng thái": item.isActive ? "Đã kích hoạt" : "Chưa kích hoạt",
                "Ngày tạo": item.createdDate ? new Date(item.createdDate).toLocaleDateString('vi-VN') : ""
            }));
            const worksheet = XLSX.utils.json_to_sheet(formattedData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách User");
            XLSX.writeFile(workbook, `Danh_sach_user_${new Date().toISOString().slice(0, 10)}.xlsx`);
            toast.success("Xuất Excel thành công!");
        } catch (error) {
            toast.error("Lỗi xuất Excel");
        } finally {
            toast.dismiss(toastId);
            setIsExporting(false);
        }
    };

    return (
        <div className="flex min-h-screen font-sans text-gray-800 bg-gray-50/50">
            <main className="flex-1 transition-all duration-300 w-full max-w-[100vw] overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Danh sách người dùng</h1>
                        <p className="text-xs md:text-sm text-gray-500 mt-1">Quản lý tài khoản và phân quyền.</p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button onClick={handleExportExcel} disabled={isExporting} className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition cursor-pointer">
                            <Download size={16} /> {isExporting ? "Đang xuất..." : "Xuất Excel"}
                        </button>
                        <button onClick={() => setIsModalOpen(true)} className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-lg shadow-blue-200 transition cursor-pointer">
                            <Plus size={16} /> Thêm mới
                        </button>
                    </div>
                </div>

                <CreateUser isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} getListUser={() => fetchUsers(currentPage)} currentPage={currentPage} />
                <EditUser isModalEditOpen={isModalEditOpen} setIsModalEditOpen={setIsModalEditOpen} userData={selectedUser} onSave={() => fetchUsers(currentPage)} accessToken={accessToken} />

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm theo tên, email, sđt..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-2 md:flex gap-2 w-full md:w-auto">
                        <select onChange={(e) => setAuthori(e.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 cursor-pointer">
                            <option value="">Tất cả quyền</option>
                            {listRole.length && listRole.map((item: any) => (
                                <option key={item.id} value={item.roleName}>{item.roleName}</option>
                            ))}
                        </select>
                        <select onChange={(e) => setActive(e.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 cursor-pointer">
                            <option value="">Trạng thái</option>
                            <option value="true">Kích hoạt</option>
                            <option value="false">Chưa kích hoạt</option>
                        </select>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                                    <th className="px-6 py-4">Người dùng</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Số điện thoại</th>
                                    <th className="px-6 py-4">Vai trò</th>
                                    <th className="px-6 py-4">Trạng thái</th>
                                    <th className="px-6 py-4 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {listUser?.items?.length > 0 ? listUser.items.map((user: any) => (
                                    <tr key={user.id} className="hover:bg-blue-50/30 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Image width={32} height={32} src={user.urlAvatar || "/default-avatar.png"} alt="Avatar" className="rounded-full object-cover w-8 h-8" />
                                                <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{user.phoneNumber}</td>
                                        <td className="px-6 py-4">
                                            <div className="relative inline-block">
                                                <select
                                                    value={user.roleName}
                                                    onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                                                    className={`appearance-none cursor-pointer pl-3 pr-8 py-1 rounded text-xs font-medium border ${user.roleName === 'Admin' ? 'text-purple-700 bg-purple-50 border-purple-200' : 'text-gray-600 bg-gray-50 border-gray-200'}`}
                                                >
                                                    {listRole.length && listRole.map((item: any) => (
                                                        <option key={item.id} value={item.roleName}>{item.roleName}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={user.isActive ? "Đã kích hoạt" : "Chưa kích hoạt"} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => { setSelectedUser(user); setIsModalEditOpen(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16} /></button>
                                                <button onClick={() => handleDeleteUser(user)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">Không có dữ liệu</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {listUser?.items?.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <span className="text-xs text-gray-500">Hiển thị {listUser.items.length} / {listUser.totalItems}</span>
                            <div className="flex items-center gap-2">
                                <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-2 border rounded hover:bg-gray-100 disabled:opacity-40"><ChevronLeft size={16} /></button>
                                <span className="text-xs font-bold">{currentPage} / {listUser.totalPages}</span>
                                <button disabled={currentPage === listUser.totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-2 border rounded hover:bg-gray-100 disabled:opacity-40"><ChevronRight size={16} /></button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    const isSuccess = status === "Đã kích hoạt";
    const Icon = isSuccess ? FaCheck : MdOutlineClose;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${isSuccess ? "text-green-700 bg-green-50 border-green-200" : "text-red-700 bg-red-50 border-red-200"}`}>
            <Icon size={12} /> {status}
        </span>
    );
}

export default UserManagement;