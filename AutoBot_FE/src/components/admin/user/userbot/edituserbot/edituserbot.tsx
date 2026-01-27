'use client';

import React, { useEffect, useState } from "react";
import { MdOutlineClose } from "react-icons/md";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { Bot, Calendar } from "lucide-react";

interface EditUserBotProps {
    isModalEditOpen: boolean;
    setIsModalEditOpen: (v: boolean) => void;
    userBotData: any;
    accessToken: string;
    onSave: () => void;
    currentPage: number
}

const EditUserBot = ({
    isModalEditOpen,
    setIsModalEditOpen,
    userBotData,
    accessToken,
    onSave,
    currentPage
}: EditUserBotProps) => {
    const [botTradingId, setBotTradingId] = useState<string>("");
    const [expiredDate, setExpiredDate] = useState<string>("");
    const [listBots, setListBots] = useState<any[]>([]);

    useEffect(() => {
        const fetchBots = async (page: number) => {
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_URL_API}BotTrading/GetListBot?pageSize=${process.env.NEXT_PUBLIC_PAGE_SIZE}&pageNumber=${page}`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                setListBots(res.data.data.items || []);
            } catch (err) {
            }
        };
        if (isModalEditOpen) fetchBots(currentPage);
    }, [isModalEditOpen, accessToken]);

    useEffect(() => {
        if (userBotData) {
            setBotTradingId(userBotData.botTradingId || "");
            if (userBotData.expiredDate) {
                setExpiredDate(userBotData.expiredDate.split('T')[0]);
            }
        }
    }, [userBotData, isModalEditOpen]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!botTradingId || !expiredDate) {
            toast.error("Vui lòng nhập đầy đủ thông tin");
            return;
        }

        try {
            const payload = {
                id: userBotData.id,
                userId: userBotData.userId,
                botTradingId: botTradingId,
                expiredDate: new Date(expiredDate).toISOString()
            };

            await axios.put(`${process.env.NEXT_PUBLIC_URL_API}UserBot/UpdateUserBot`, payload, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            toast.success("Cập nhật Bot thành công");
            onSave();
            setIsModalEditOpen(false);
        } catch (err) {
            toast.error("Cập nhật thất bại");
        }
    };

    return (
        <AnimatePresence>
            {isModalEditOpen && (
                <>
                    <motion.div
                        className="fixed inset-0 bg-black/30 z-50 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsModalEditOpen(false)}
                    />
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                    >
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden pointer-events-auto">
                            <div className="flex justify-between items-center p-5 border-b bg-gray-50">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Gia hạn / Đổi Bot</h2>
                                    <p className="text-xs text-gray-500">Người dùng: {userBotData?.userName}</p>
                                </div>
                                <button className="p-1 hover:bg-gray-200 rounded-full transition cursor-pointer" onClick={() => setIsModalEditOpen(false)}>
                                    <MdOutlineClose size={24} />
                                </button>
                            </div>

                            <form className="p-6 space-y-5" onSubmit={handleUpdate}>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Sản phẩm Bot</label>
                                    <div className="relative">
                                        <Bot className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <select
                                            value={botTradingId}
                                            onChange={(e) => setBotTradingId(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none bg-white"
                                        >
                                            <option value="">Chọn loại Bot</option>
                                            {listBots.map((bot) => (
                                                <option key={bot.id} value={bot.id}>{bot.nameBot} - Số tháng: {bot.priceOptions.month} - Số lệnh: {bot.commandNumber}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Ngày hết hạn mới</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="date"
                                            value={expiredDate}
                                            onChange={(e) => setExpiredDate(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalEditOpen(false)}
                                        className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition cursor-pointer"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md shadow-blue-200 transition disabled:bg-blue-300 cursor-pointer"
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

export default EditUserBot;