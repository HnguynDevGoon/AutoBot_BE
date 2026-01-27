"use client";

import React, { useEffect, useState } from "react";
import { MdOutlineClose } from "react-icons/md";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import axios from "axios";

interface CreateUserBotProps {
    isModalOpen: boolean;
    setIsModalOpen: (val: boolean) => void;
    fetchUserBots: (page: number) => Promise<void>;
    currentPage: number;
    accessToken: string;
}

const CreateUserBot = ({ isModalOpen, setIsModalOpen, fetchUserBots, currentPage, accessToken }: CreateUserBotProps) => {
    const [selectedUser, setSelectedUser] = useState<string>("");
    const [selectedBot, setSelectedBot] = useState<string>("");
    const [expiredDate, setExpiredDate] = useState<string>("");
    const [users, setUsers] = useState<any>([]);
    const [bots, setBots] = useState<any>([]);

    useEffect(() => {
        const init = async () => {
            if (accessToken) {
                loadInitialData(currentPage);
            }
        };
        if (isModalOpen) init();
    }, [isModalOpen]);

    const loadInitialData = async (page: number) => {
        try {
            const [userRes, botRes] = await Promise.all([
                axios.get(`${process.env.NEXT_PUBLIC_URL_API}Authen/GetListUser?pageSize=${process.env.NEXT_PUBLIC_PAGE_SIZE}&pageNumber=${page}`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                }),
                axios.get(`${process.env.NEXT_PUBLIC_URL_API}BotTrading/GetListBot?pageSize=${process.env.NEXT_PUBLIC_PAGE_SIZE}&pageNumber=${page}`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                })
            ]);
            setUsers(userRes.data.data.items);
            setBots(botRes.data.data.items);
        } catch (err) {
            console.error("Lỗi load dữ liệu:", err);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || !selectedBot || !expiredDate) {
            toast.error("Vui lòng điền đầy đủ thông tin");
            return;
        }

        try {
            const payload = {
                userId: selectedUser,
                botTradingId: selectedBot,
                expiredDate: new Date(expiredDate).toISOString()
            };

            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_URL_API}UserBot/AddUserBot`,
                payload,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            if (res.status === 200 || res.data.status === 200) {
                toast.success("Cấp quyền sử dụng Bot thành công");
                handleClose();
                fetchUserBots(currentPage);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Lỗi khi tạo liên kết");
        }
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setSelectedUser("");
        setSelectedBot("");
        setExpiredDate("");
    };

    return (
        <AnimatePresence>
            {isModalOpen && (
                <>
                    <motion.div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                    />
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                    >
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden pointer-events-auto">
                            <div className="flex justify-between items-center p-6 border-b bg-gray-50/50">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Cấp quyền Bot</h2>
                                    <p className="text-xs text-gray-500">Gán Bot cho người dùng hệ thống</p>
                                </div>
                                <button onClick={handleClose} className="p-2 hover:bg-gray-200 rounded-full transition cursor-pointer">
                                    <MdOutlineClose size={22} />
                                </button>
                            </div>

                            <form className="p-6 space-y-5" onSubmit={handleCreate}>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Người dùng</label>
                                    <select
                                        value={selectedUser}
                                        onChange={(e) => setSelectedUser(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition cursor-pointer"
                                    >
                                        <option value="">-- Chọn người dùng --</option>
                                        {users.map((u: any) => (
                                            <option key={u.id} value={u.id}>
                                                {u.fullName} ({u.userName})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Sản phẩm Bot</label>
                                    <select
                                        value={selectedBot}
                                        onChange={(e) => setSelectedBot(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition cursor-pointer"
                                    >
                                        <option value="">-- Chọn loại Bot --</option>
                                        {bots.map((b: any) => (
                                            <option key={b.id} value={b.id}>
                                                {b.nameBot} - Số tháng: {b.priceOptions.month} - Số lệnh: {b.commandNumber}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Ngày hết hạn</label>
                                    <input
                                        type="date"
                                        value={expiredDate}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => setExpiredDate(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition cursor-pointer"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl shadow-lg shadow-blue-200 transition disabled:opacity-50 cursor-pointer"
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

export default CreateUserBot;