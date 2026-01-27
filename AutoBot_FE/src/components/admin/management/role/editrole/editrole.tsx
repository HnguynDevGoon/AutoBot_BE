'use client';

import React, { useEffect, useState } from "react";
import { MdOutlineClose } from "react-icons/md";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";

interface EditRoleProps {
    isModalEditOpen: boolean;
    setIsModalEditOpen: (v: boolean) => void;
    roleData: any;
    onSave?: () => void;
    accessToken: string;
}

const EditRole = ({
    isModalEditOpen,
    setIsModalEditOpen,
    roleData,
    onSave,
    accessToken
}: EditRoleProps) => {
    const [roleName, setRoleName] = useState<string>("");

    useEffect(() => {
        if (roleData && isModalEditOpen) {
            setRoleName(roleData.roleName || "");
        }
    }, [roleData, isModalEditOpen]);

    const handleUpdateRole = async () => {
        if (!roleName.trim()) {
            toast.error("Tên quyền không được để trống!");
            return;
        }

        try {
            const res = await axios.put(
                `${process.env.NEXT_PUBLIC_URL_API}Role/UpdateRole`,
                {
                    id: roleData?.id,
                    roleName: roleName.trim()
                },
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            if (res.status === 200 || res.data.status === 200) {
                toast.success("Cập nhật quyền thành công!");
                setIsModalEditOpen(false);
                if (onSave) onSave();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Cập nhật thất bại!");
        }
    };

    return (
        <AnimatePresence>
            {isModalEditOpen && (
                <>
                    <motion.div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsModalEditOpen(false)}
                    />
                    
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                    >
                        <div className="bg-white text-left rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                            <div className="flex justify-between items-center p-5 border-b">
                                <h2 className="text-xl font-bold text-amber-900">Chỉnh Sửa Quyền</h2>
                                <button 
                                    className="text-amber-900 hover:bg-white/50 p-1 rounded-full cursor-pointer transition" 
                                    onClick={() => setIsModalEditOpen(false)}
                                >
                                    <MdOutlineClose size={24} />
                                </button>
                            </div>

                            <form 
                                className="p-6 space-y-4"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleUpdateRole();
                                }}
                            >
                                <div>
                                    <label className="text-sm font-semibold text-gray-700">ID Quyền</label>
                                    <input
                                        type="text"
                                        disabled
                                        value={roleData?.id || ""}
                                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-700">Tên quyền (Role Name)*</label>
                                    <input
                                        type="text"
                                        value={roleName}
                                        onChange={(e) => setRoleName(e.target.value)}
                                        placeholder="Nhập tên quyền mới..."
                                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition font-medium"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalEditOpen(false)}
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

export default EditRole;