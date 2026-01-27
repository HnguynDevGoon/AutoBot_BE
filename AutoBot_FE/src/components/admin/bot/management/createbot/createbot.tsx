'use client'

import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { MdOutlineClose } from "react-icons/md";
import { toast } from "sonner";

const CreateBot = ({ isCreateModal, accessToken, handleGetBot, currentPage, setIsCreateModal }: { isCreateModal: boolean, accessToken: string, handleGetBot: any, currentPage: number, setIsCreateModal: (val: boolean) => void }) => {
    const [nameBot, setNameBot] = useState<string>("");
    const [interestRate, setInterestRate] = useState<any>("");
    const [totalProfit, setTotalProfit] = useState<any>("");
    const [commandNumber, setCommandNumber] = useState<any>("");
    const [winRate, setWinRate] = useState<any>("");

    const handleCreateBot = async () => {
        const fields = [
            { value: nameBot, message: "Tên Bot không được để trống!" },
            { value: interestRate, message: "Lãi suất không được để trống!" },
            { value: totalProfit, message: "Lợi nhuận không được để trống!" },
            { value: commandNumber, message: "Số lệnh không được để trống!" },
            { value: winRate, message: "Tỉ lệ thắng không được để trống!" },
        ];

        for (const field of fields) {
            if (!field.value || String(field.value).trim() === "") {
                toast.error(field.message);
                return;
            }
        }

        await axios.post(`${process.env.NEXT_PUBLIC_URL_API}BotTrading/CreateBot`, {
            nameBot,
            interestRate: Number(interestRate),
            totalProfit: Number(totalProfit),
            commandNumber: Number(commandNumber),
            winRate: Number(winRate)
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        }).then(res => {
            toast.success("Tạo Bot mới thành công!");
            setIsCreateModal(false);
            setNameBot("");
            setInterestRate("");
            setTotalProfit("");
            setCommandNumber("");
            setWinRate("");
            handleGetBot(currentPage);
        }).catch(err => {
            toast.success(err);
        })
    };


    return (
        <AnimatePresence>
            {isCreateModal && (
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
                                <h2 className="text-2xl font-bold">Thêm Bot</h2>
                                <button className="cursor-pointer" onClick={() => {
                                    setIsCreateModal(false)
                                    setNameBot("");
                                    setInterestRate("");
                                    setTotalProfit("");
                                    setCommandNumber("");
                                    setWinRate("");
                                }}>
                                    <MdOutlineClose size={24} />
                                </button>
                            </div>
                            <form
                                className="p-6 space-y-4"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleCreateBot();
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleCreateBot();
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
                                        onClick={() => {
                                            setIsCreateModal(false)
                                            setNameBot("");
                                            setInterestRate("");
                                            setTotalProfit("");
                                            setCommandNumber("");
                                            setWinRate("");
                                        }}
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
        </AnimatePresence>
    )
}

export default CreateBot;