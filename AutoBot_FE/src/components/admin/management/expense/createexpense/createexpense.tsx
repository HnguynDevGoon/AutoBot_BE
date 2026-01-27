'use client';

import React, { useState } from "react";
import { MdOutlineClose } from "react-icons/md";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";

interface CreateExpenseProps {
    isModalOpen: boolean;
    setIsModalOpen: (val: boolean) => void;
    getListExpense: () => Promise<void>;
    accessToken: string;
}

const CreateExpense = ({ isModalOpen, setIsModalOpen, getListExpense, accessToken }: CreateExpenseProps) => {
    const [name, setName] = useState<string>("");
    const [price, setPrice] = useState<number | string>("");
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState<string>("");

    const resetForm = () => {
        setName("");
        setPrice("");
        setDate(new Date().toISOString().split('T')[0]);
        setDescription("");
    };

    const handleCreateExpense = async () => {
        if (!name || !price || !date) {
            toast.error("Vui lòng nhập đầy đủ thông tin bắt buộc");
            return;
        }

        try {
            const payload = {
                Name: name,
                Price: Number(price),
                Date: new Date(date).toISOString(),
                Description: description
            };

            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_URL_API}Expense/AddExpense`,
                payload,{
                    headers: {
                        'Authorization' : `Bearer ${accessToken}`
                    }
                }
            );

            if (res.data.status === 200 || res.status === 200) {
                toast.success("Thêm chi phí thành công");
                resetForm();
                setIsModalOpen(false);
                await getListExpense();
            } else {
                toast.error(res.data.message || "Có lỗi xảy ra");
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Không thể kết nối đến server");
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
                                <h2 className="text-xl font-bold text-gray-800">Thêm Chi Phí Mới</h2>
                                <button onClick={() => {
                                    setIsModalOpen(false);
                                    resetForm();
                                }} className="hover:bg-gray-100 p-1 rounded-full transition cursor-pointer">
                                    <MdOutlineClose size={24} />
                                </button>
                            </div>

                            <form
                                className="p-6 space-y-4"
                                onSubmit={(e) => { e.preventDefault(); handleCreateExpense(); }}
                            >
                                <div>
                                    <label className="text-sm font-semibold text-gray-700">Tên chi phí *</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Ví dụ: Tiền điện, Mua thiết bị..."
                                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-700">Số tiền (VNĐ) *</label>
                                    <input
                                        type="number"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder="0"
                                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-700">Ngày chi tiêu *</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-700">Mô tả</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition resize-none"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsModalOpen(false);
                                            resetForm();
                                        }}
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

export default CreateExpense;