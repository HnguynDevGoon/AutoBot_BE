"use client";

import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { MdOutlineClose } from "react-icons/md";
import { toast } from "sonner";

const CreatePackage = ({ isCreateModal, accessToken, handleGetPriceBot, currentPage, setIsCreateModal }: { isCreateModal: boolean, accessToken: string, handleGetPriceBot: any, currentPage: number, setIsCreateModal: (val: boolean) => void }) => {
    const [month, setMonth] = useState<string>("");
    const [price, setPrice] = useState<string>("");
    const [discount, setDiscount] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [botTradingId, setBotTradingId] = useState<string>("");
    const [listBot, setListBot] = useState<any>([]);

    useEffect(() => {
        handleGetListBotTrading();
    }, []);

    const handleGetListBotTrading = async () => {
        await axios.get(`${process.env.NEXT_PUBLIC_URL_API}BotTrading/GetListBot`)
            .then(res => {
                setListBot(res.data.data.items);
            }).catch(err => {
            })
    }

    const handleCreatePackage = async () => {
        const fields = [
            { value: month, message: "Số tháng không được để trống!" },
            { value: price, message: "Giá tiền không được để trống!" },
            { value: discount, message: "Giảm giá không được để trống!" },
            { value: description, message: "Mô tả không được để trống!" },
            { value: botTradingId, message: "Bạn chưa chọn Bot để tạo gói!" },
        ];

        for (const field of fields) {
            if (!field.value || String(field.value).trim() === "") {
                toast.error(field.message);
                return;
            }
        }

        await axios.post(`${process.env.NEXT_PUBLIC_URL_API}BotTrading/CreatePriceBot`, {
            month: Number(month),
            price: Number(price),
            discount: Number(discount),
            description,
            botTradingId
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        }).then(res => {
            toast.success("Tạo gói Bot mới thành công!");
            setMonth("");
            setPrice("");
            setDiscount("");
            setDescription("");
            setBotTradingId("");
            handleGetPriceBot(currentPage);
            setIsCreateModal(false);
        }).catch(err => {
            toast.error("Tạo gói Bot mới thất bại!");
        })
    }

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
                                <h2 className="text-2xl font-bold">Thêm gói Bot</h2>
                                <button className="cursor-pointer" onClick={() => {
                                    setIsCreateModal(false)
                                    setMonth("");
                                    setPrice("");
                                    setDiscount("");
                                    setDescription("");
                                    setBotTradingId("");
                                }}>
                                    <MdOutlineClose size={24} />
                                </button>
                            </div>
                            <form
                                className="p-6 space-y-4"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleCreatePackage();
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleCreatePackage();
                                    }
                                }}
                            >
                                <div>
                                    <label className="text-sm font-medium">Bot có sẵn</label>
                                    <select onChange={(e) => setBotTradingId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition">
                                        <option value={""}>Chọn Bot</option>
                                        {listBot.map((item: any, index: number) => (
                                            <option key={index} value={item.id}>Tên: {item.nameBot} - Số lệnh: {item.commandNumber} - Tỷ lệ thắng: {item.winRate}%</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Số tháng</label>
                                    <input
                                        type="number"
                                        value={month}
                                        onChange={(e) => {
                                            setMonth(e.target.value)
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Giá tiền</label>
                                    <input
                                        type="number"
                                        value={price}
                                        onChange={(e) => {
                                            setPrice(e.target.value);
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Phần trăm giảm giá</label>
                                    <input
                                        type="number"
                                        value={discount}
                                        onChange={(e) => {
                                            setDiscount(e.target.value);
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                    />
                                </div>
                                <div className="relative">
                                    <label className="text-sm font-medium">Mô tả</label>
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={(e) => {
                                            setDescription(e.target.value);
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsCreateModal(false)
                                            setMonth("");
                                            setPrice("");
                                            setDiscount("");
                                            setDescription("");
                                            setBotTradingId("");
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

export default CreatePackage;