'use client';

import { GetAccessToken } from "@/components/shared/token/accessToken";
import { RootState } from "@/redux/store";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { MdOutlineClose } from "react-icons/md";
import { useSelector } from "react-redux";
import { toast } from "sonner";

const EditPackage = ({ priceData, isEditModal, handleGetPriceBot, currentPage, setIsEditModal }: { priceData: any, isEditModal: boolean, handleGetPriceBot: any, currentPage: number, setIsEditModal: (val: boolean) => void }) => {
    const userInfo = useSelector((state: RootState) => state.user.userInfo);
    const [accessToken, setAccessToken] = useState<string>('');
    const [month, setMonth] = useState<string>("");
    const [price, setPrice] = useState<string>("");
    const [discount, setDiscount] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [botTradingId, setBotTradingId] = useState<string>("");
    const [listBot, setListBot] = useState<any>([]);

    useEffect(() => {
        if (!userInfo?.Id && !accessToken) return;
        loadData();
        handleGetListBotTrading();
        if (!priceData) return;
        setMonth(priceData.month);
        setPrice(priceData.price);
        setDiscount(priceData.discount);
        setDescription(priceData.description);
        setBotTradingId(priceData.botTradingId);
    }, [userInfo, accessToken, priceData]);

    const loadData = async () => {
        const token = await GetAccessToken(userInfo?.Id);
        if (token) setAccessToken(token);
    };

    const handleGetListBotTrading = async () => {
        await axios.get(`${process.env.NEXT_PUBLIC_URL_API}BotTrading/GetListBot`)
            .then(res => {
                setListBot(res.data.data.items);
            }).catch(err => {
            })
    }

    const handleEditPriceBot = async () => {
        if (!priceData?.id) {
            toast.error("Không tìm thấy ID Bot!");
            return;
        }

        if (!month) {
            toast.error("Số tháng không được để trống!");
            return false;
        }
        if (!price) {
            toast.error("Giá tiền không được để trống!");
            return false;
        }

        if (!discount) {
            toast.error("Giảm giá không được để trống!");
            return false;
        }
        if (!description) {
            toast.error("Mô tả không được để trống!");
            return false;
        }

        await axios.post(`${process.env.NEXT_PUBLIC_URL_API}BotTrading/UpdatePriceBot`, {
            id: priceData?.id,
            month,
            price,
            discount,
            description,
            botTradingId
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        }).then(res => {
            toast.success("Sửa gói Bot thành công!");
            setIsEditModal(false);
            setMonth("");
            setPrice("");
            setDiscount("");
            setDescription("");
            handleGetPriceBot(currentPage);
        }).catch(err => {
            toast.error("Sửa gói Bot thất bại!");
        })
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
                                <h2 className="text-2xl font-bold">Sửa gói Bot</h2>
                                <button className="cursor-pointer" onClick={() => setIsEditModal(false)}>
                                    <MdOutlineClose size={24} />
                                </button>
                            </div>
                            <form
                                className="p-6 space-y-4"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleEditPriceBot();
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleEditPriceBot();
                                    }
                                }}
                            >
                                <div>
                                    <label className="text-sm font-medium">Bot có sẵn</label>
                                    <select value={botTradingId} onChange={(e) => setBotTradingId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition">
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
        </AnimatePresence>
    )
}

export default EditPackage;