'use client';

import React, { useState } from "react";
import { MdOutlineClose } from "react-icons/md";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";

interface CreateRoleProps {
    isModalOpen: boolean;
    setIsModalOpen: (val: boolean) => void;
    getListRole: () => Promise<void>;
    accessToken: string;
}

const CreateRole = ({ isModalOpen, setIsModalOpen, getListRole, accessToken }: CreateRoleProps) => {
    const [roleName, setRoleName] = useState<string>("");

    const resetForm = () => {
        setRoleName("");
    };

    const handleCreateRole = async () => {
        if (!roleName.trim()) {
            toast.error("Vui lòng nhập tên quyền");
            return;
        }

        try {
            const payload = {
                roleName: roleName.trim()
            };

            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_URL_API}Role/CreateRole`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            if (res.status === 200 || res.data.status === 200) {
                toast.success("Thêm quyền mới thành công");
                resetForm();
                setIsModalOpen(false);
                await getListRole();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Lỗi khi tạo quyền mới");
        }
    };

    return (
        <AnimatePresence>
            {isModalOpen && (
                <>
                    <motion.div
                        className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsModalOpen(false)}
                    />
                    <motion.div
                        className="fixed inset-0 z-60 flex items-center justify-center p-4 pointer-events-none"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                    >
                        <div className="bg-white text-left rounded-xl shadow-2xl w-full max-w-md overflow-hidden pointer-events-auto">
                            <div className="flex justify-between items-center p-5 border-b">
                                <h2 className="text-xl font-bold text-blue-800">Thêm Quyền Mới</h2>
                                <button 
                                    onClick={() => { setIsModalOpen(false); resetForm(); }} 
                                    className="hover:bg-white/50 p-1 rounded-full transition cursor-pointer"
                                >
                                    <MdOutlineClose size={24} className="text-blue-800" />
                                </button>
                            </div>

                            <form className="p-6 space-y-4" onSubmit={(e) => { e.preventDefault(); handleCreateRole(); }}>
                                <div>
                                    <label className="text-sm font-semibold text-gray-700">Tên Quyền (Role Name)*</label>
                                    <input
                                        type="text"
                                        value={roleName}
                                        onChange={(e) => setRoleName(e.target.value)}
                                        placeholder="VD: Quản trị viên, Nhân viên..."
                                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={() => { setIsModalOpen(false); resetForm(); }}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition cursor-pointer"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className={`px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium shadow-md transition cursor-pointer`}
                                    >
                                        Lưu thay đổi
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CreateRole;