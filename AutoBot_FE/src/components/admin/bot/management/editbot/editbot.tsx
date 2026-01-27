'use client';

import { GetAccessToken } from "@/components/shared/token/accessToken";
import { RootState } from "@/redux/store";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { MdOutlineClose } from "react-icons/md";
import { useSelector } from "react-redux";
import { toast } from "sonner";

const EditBot = ({ botData, isEditModal, handleGetBot, currentPage, setIsEditModal }: { botData: any, isEditModal: boolean, handleGetBot: any, currentPage: number, setIsEditModal: (val: boolean) => void }) => {
    const userInfo = useSelector((state: RootState) => state.user.userInfo);
    const [accessToken, setAccessToken] = useState<string>('');
    const [nameBot, setNameBot] = useState<string>("");
    const [interestRate, setInterestRate] = useState<any>("");
    const [totalProfit, setTotalProfit] = useState<any>("");
    const [commandNumber, setCommandNumber] = useState<any>("");
    const [winRate, setWinRate] = useState<any>("");

    useEffect(() => {
        if (!userInfo?.Id && !accessToken) return;
        loadData();
        if (!botData) return;
        setNameBot(botData.nameBot);
        setInterestRate(botData.interestRate);
        setTotalProfit(botData.totalProfit);
        setCommandNumber(botData.commandNumber);
        setWinRate(botData.winRate);
    }, [userInfo, accessToken, botData]);

    const loadData = async () => {
        const token = await GetAccessToken(userInfo?.Id);
        if (token) setAccessToken(token);
    };

    const handleEditBot = async () => {
        if (!botData?.id) {
            toast.error("Không tìm thấy ID Bot!");
            return;
        }

        if (!nameBot.trim()) {
            toast.error("Tên đăng nhập không được để trống!");
            return false;
        }
        if (!interestRate) {
            toast.error("Lãi suất không được để trống!");
            return false;
        }

        if (!totalProfit) {
            toast.error("Lợi nhuận không được để trống!");
            return false;
        }
        if (!commandNumber) {
            toast.error("Số lệnh không được để trống!");
            return false;
        }
        if (!winRate) {
            toast.error("Tỉ lệ thắng không được để trống!");
            return false;
        }

        await axios.post(`${process.env.NEXT_PUBLIC_URL_API}BotTrading/UpdateBot`, {
            id: botData?.id,
            nameBot,
            interestRate,
            totalProfit,
            commandNumber,
            winRate
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        }).then(res => {
            toast.success("Sửa Bot thành công!");
            setIsEditModal(false);
            setNameBot("");
            setInterestRate("");
            setTotalProfit("");
            setCommandNumber("");
            setWinRate("");
            handleGetBot(currentPage);
        }).catch(err => {
            toast.error("Sửa Bot thất bại!");
        });
    }

    return (
        <AnimatePresence>
            {isEditModal && (
                <>
                    <motion.div
                        className="fixed inset-0 bg-black/20 z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                    >
                        <div className="bg-white text-left rounded-xl shadow-lg w-full max-w-lg overflow-hidden">
                            <div className="flex justify-between items-center p-5 border-b">
                                <h2 className="text-2xl font-bold">Sửa Bot</h2>
                                <button className="cursor-pointer" onClick={() => setIsEditModal(false)}>
                                    <MdOutlineClose size={24} />
                                </button>
                            </div>
                            <form
                                className="p-6 space-y-4"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleEditBot();
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleEditBot();
                                    }
                                }}
                            >
                                <div>
                                    <label className="text-sm font-medium">Tên Bot</label>
                                    <input
                                        type="text"
                                        value={nameBot}
                                        onChange={(e) => {
                                            setNameBot(e.target.value);
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Lãi suất</label>
                                    <input
                                        type="number"
                                        value={interestRate}
                                        onChange={(e) => {
                                            setInterestRate(e.target.value)
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Lợi nhuận</label>
                                    <input
                                        type="number"
                                        value={totalProfit}
                                        onChange={(e) => {
                                            setTotalProfit(e.target.value);
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Số lệnh</label>
                                    <input
                                        type="number"
                                        name="phoneNumber"
                                        value={commandNumber}
                                        onChange={(e) => {
                                            setCommandNumber(e.target.value);
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                    />
                                </div>
                                <div className="relative">
                                    <label className="text-sm font-medium">Tỉ lệ thắng</label>
                                    <input
                                        type="number"
                                        value={winRate}
                                        onChange={(e) => {
                                            setWinRate(e.target.value);
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditModal(false)}
                                        className="px-4 py-2 bg-gray-200 hover:bg-gray-400 rounded-lg cursor-pointer"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-400 hover:bg-blue-600 text-white rounded-lg cursor-pointer"
                                    >
                                        Lưu thay đổi
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence >
    )
}

export default EditBot;