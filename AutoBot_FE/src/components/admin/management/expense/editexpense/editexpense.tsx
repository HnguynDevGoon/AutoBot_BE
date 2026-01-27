"use client";

import React, { useEffect, useState } from "react";
import { MdOutlineClose } from "react-icons/md";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { GetAccessToken } from "@/components/shared/token/accessToken";
import { toast } from "sonner";

const EditExpense = ({
    isModalEditOpen,
    setIsModalEditOpen,
    expenseData,
    onSave,
    accessToken
}: {
    isModalEditOpen: boolean,
    setIsModalEditOpen: (v: boolean) => void,
    expenseData: any,
    onSave?: () => void,
    accessToken: string
}) => {
    const [name, setName] = useState<string>("");
    const [price, setPrice] = useState<number>(0);
    const [date, setDate] = useState<string>("");
    const [description, setDescription] = useState<string>("");

    useEffect(() => {
        if (!expenseData) return;
        setName(expenseData.name || "");
        setPrice(expenseData.price || 0);
        setDescription(expenseData.description || "");
        
        if (expenseData.date) {
            const dateObj = new Date(expenseData.date);
            const formattedDate = dateObj.toISOString().split('T')[0];
            setDate(formattedDate);
        }
    }, [expenseData]);

    const validateExpenseData = () => {
        if (!name.trim()) {
            toast.error("Tên khoản chi không được để trống!");
            return false;
        }
        if (price <= 0) {
            toast.error("Số tiền phải lớn hơn 0!");
            return false;
        }
        if (!date) {
            toast.error("Vui lòng chọn ngày chi!");
            return false;
        }
        return true;
    };

    const handleUpdateExpense = async () => {
        if (!validateExpenseData()) return;

        try {
            await axios.put(
                `${process.env.NEXT_PUBLIC_URL_API}Expense/UpdateExpense`, 
                {
                    id: expenseData?.id,
                    name: name,
                    price: Number(price),
                    date: new Date(date).toISOString(),
                    description: description
                },
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            toast.success("Cập nhật chi phí thành công!");
            setIsModalEditOpen(false);
            if (onSave) onSave();
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || "Cập nhật thất bại!");
        }
    };

    return (
        <AnimatePresence>
            {isModalEditOpen && (
                <>
                    <motion.div
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
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
                        <div className="bg-white text-left rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                            <div className="flex justify-between items-center p-5 border-b">
                                <h2 className="text-xl font-bold text-gray-800">Sửa Chi Phí</h2>
                                <button className="text-gray-400 hover:text-gray-600 cursor-pointer" onClick={() => setIsModalEditOpen(false)}>
                                    <MdOutlineClose size={24} />
                                </button>
                            </div>

                            <form className="p-6 space-y-4"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleUpdateExpense();
                                }}>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Tên chi phí</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Số tiền</label>
                                    <input
                                        type="number"
                                        value={price}
                                        onChange={(e) => setPrice(Number(e.target.value))}
                                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Ngày chi</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Mô tả</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalEditOpen(false)}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition cursor-pointer"
                                    >
                                        Đóng
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md transition cursor-pointer"
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

export default EditExpense;