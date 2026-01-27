"use client";

import React, { useEffect, useState } from "react";
import { MdOutlineClose } from "react-icons/md";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { GetAccessToken } from "@/components/shared/token/accessToken";
import { toast } from "sonner";

interface EditSalaryProps {
    isModalEditOpen: boolean;
    setIsModalEditOpen: (v: boolean) => void;
    salaryData: any;
    onSave?: () => void;
    accessToken: string;
}

const EditSalary = ({
    isModalEditOpen,
    setIsModalEditOpen,
    salaryData,
    onSave,
    accessToken
}: EditSalaryProps) => {
    const [month, setMonth] = useState<number>(1);
    const [year, setYear] = useState<number>(2024);
    const [price, setPrice] = useState<number>(0);
    const [bonus, setBonus] = useState<number>(0);
    const [description, setDescription] = useState<string>("");
    const [userName, setUserName] = useState<string>("");

    useEffect(() => {
        if (!salaryData) return;
        setMonth(salaryData.month || 1);
        setYear(salaryData.year || 2024);
        setPrice(salaryData.price || 0);
        setBonus(salaryData.bonus || 0);
        setDescription(salaryData.description || "");
        setUserName(salaryData.user?.fullName || "N/A");
    }, [salaryData, isModalEditOpen]);

    const validateSalaryData = () => {
        if (month < 1 || month > 12) {
            toast.error("Tháng không hợp lệ!");
            return false;
        }
        if (price < 0) {
            toast.error("Lương cơ bản không được âm!");
            return false;
        }
        return true;
    };

    const handleUpdateSalary = async () => {
        if (!validateSalaryData()) return;

        try {
            const res = await axios.put(
                `${process.env.NEXT_PUBLIC_URL_API}Salary/UpdateSalary`, 
                {
                    id: salaryData?.id,
                    month: Number(month),
                    year: Number(year),
                    price: Number(price),
                    bonus: Number(bonus),
                    description: description,
                    userId: salaryData?.userId
                },
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            if (res.status === 200 || res.data.status === 200) {
                toast.success("Cập nhật bảng lương thành công!");
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
                                <div>
                                    <h2 className="text-xl font-bold">Sửa Bảng Lương</h2>
                                </div>
                                <button className="text-emerald-800 hover:bg-white/50 p-1 rounded-full cursor-pointer transition" onClick={() => setIsModalEditOpen(false)}>
                                    <MdOutlineClose size={24} />
                                </button>
                            </div>

                            <form className="p-6 space-y-4"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleUpdateSalary();
                                }}>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700">Tháng</label>
                                        <input
                                            type="number" min="1" max="12"
                                            value={month}
                                            onChange={(e) => setMonth(Number(e.target.value))}
                                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700">Năm</label>
                                        <input
                                            type="number"
                                            value={year}
                                            onChange={(e) => setYear(Number(e.target.value))}
                                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-700">Lương cơ bản (Price)</label>
                                    <input
                                        type="number"
                                        value={price}
                                        onChange={(e) => setPrice(Number(e.target.value))}
                                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-700">Thưởng (Bonus)</label>
                                    <input
                                        type="number"
                                        value={bonus}
                                        onChange={(e) => setBonus(Number(e.target.value))}
                                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition font-medium text-orange-600"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-700">Mô tả</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition resize-none"
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
                                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium shadow-md transition cursor-pointer"
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

export default EditSalary;