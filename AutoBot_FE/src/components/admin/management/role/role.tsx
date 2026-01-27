'use client';

import { useEffect, useState, useMemo } from "react";
import {
    Search, Plus, Trash2, Edit,
    ShieldCheck, User, ChevronLeft, ChevronRight
} from "lucide-react";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { GetAccessToken } from "@/components/shared/token/accessToken";
import { toast } from "sonner";
import Swal from "sweetalert2";
import CreateRole from "./createrole/createrole";
import EditRole from "./editrole/editrole";

const ManagementRole = () => {
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [accessToken, setAccessToken] = useState<string>('');
    const userInfo = useSelector((state: RootState) => state.user.userInfo);

    const [listRole, setListRole] = useState<any>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isModalEditOpen, setIsModalEditOpen] = useState<boolean>(false);
    const [selectedRole, setSelectedRole] = useState<any>(null);

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
            getListRole(currentPage);
        }
    }, [accessToken, currentPage]);

    const getListRole = async (page: number = 1) => {
        try {
            const res = await axios.get(
                `${process.env.NEXT_PUBLIC_URL_API}Role/GetListRole?pageSize=${process.env.NEXT_PUBLIC_PAGE_SIZE}&pageNumber=${page}`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            setListRole(res.data || []);
        } catch (error) {
        }
    };

    const displayRoles = useMemo(() => {
        const items = listRole || [];
        return items.filter((role: any) =>
            role.roleName?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [listRole, searchTerm]);

    const handleEditClick = (role: any) => {
        setSelectedRole(role);
        setIsModalEditOpen(true);
    };

    const handleDelete = async (role: any) => {
        Swal.fire({
            title: "Xác nhận xóa?",
            text: `Quyền "${role.roleName}" sẽ bị xóa vĩnh viễn!`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            confirmButtonText: "Xóa ngay",
            cancelButtonText: "Hủy"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.delete(
                        `${process.env.NEXT_PUBLIC_URL_API}Role/DeleteRole?roleId=${role.id}`,
                        { headers: { Authorization: `Bearer ${accessToken}` } }
                    );
                    toast.success("Xóa quyền thành công!");
                    getListRole(currentPage);
                } catch (error) {
                    toast.error("Xóa thất bại! Quyền có thể đang được sử dụng.");
                }
            }
        });
    };

    return (
        <div className="flex min-h-screen font-sans text-gray-800 bg-gray-50/50">
            <main className="flex-1 w-full overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                            Quản lý phân quyền
                        </h1>
                        <p className="text-xs md:text-sm text-gray-500 mt-1">
                            Quản lý các vai trò và quyền hạn của người dùng trong hệ thống.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 shadow-lg shadow-blue-200 transition transform hover:-translate-y-0.5 cursor-pointer"
                    >
                        <Plus size={16} /> Thêm mới
                    </button>
                </div>

                <CreateRole isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} getListRole={() => getListRole(currentPage)} accessToken={accessToken} />
                <EditRole isModalEditOpen={isModalEditOpen} setIsModalEditOpen={setIsModalEditOpen} roleData={selectedRole} onSave={() => getListRole(currentPage)} accessToken={accessToken} />
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm tên quyền (Admin, User...)..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Tên Quyền</th>
                                    <th className="px-6 py-4 text-center">Mã ID</th>
                                    <th className="px-6 py-4 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {displayRoles.length > 0 ? displayRoles.map((role: any) => (
                                    <tr key={role.id} className="hover:bg-blue-50/30 transition duration-150">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                                                    <ShieldCheck size={16} />
                                                </div>
                                                <span className="font-bold text-gray-900 uppercase tracking-tight">
                                                    {role.roleName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center text-xs text-gray-400 font-mono">
                                            {role.id}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditClick(role)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded cursor-pointer transition"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(role)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer transition"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-10 text-center text-gray-400">
                                            Không tìm thấy vai trò nào.
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

export default ManagementRole;