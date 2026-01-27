"use client";

import React, { useEffect, useState } from "react";
import { MdOutlineClose } from "react-icons/md";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";

interface CreateSalaryProps {
    isModalOpen: boolean;
    setIsModalOpen: (val: boolean) => void;
    getListSalary: () => Promise<void>;
    accessToken: string;
}

const CreateSalary = ({ isModalOpen, setIsModalOpen, getListSalary, accessToken }: CreateSalaryProps) => {
    const [userId, setUserId] = useState<string>("");
    const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [price, setPrice] = useState<number | string>("");
    const [bonus, setBonus] = useState<number | string>(0);
    const [description, setDescription] = useState<string>("");
    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        if (isModalOpen) {
            fetchEmployees();
        }
    }, [isModalOpen]);

    const fetchEmployees = async () => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_URL_API}Authen/GetListUser`,{
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            const employees = res.data.data.items.filter((u: any) => u.roleName === "Employee");
            setUsers(employees);
        } catch (err) {
            toast.error("Không thể tải danh sách nhân viên");
        }
    };

    const resetForm = () => {
        setUserId("");
        setMonth(new Date().getMonth() + 1);
        setYear(new Date().getFullYear());
        setPrice("");
        setBonus(0);
        setDescription("");
    };

    const handleCreateSalary = async () => {
        if (!userId || !price || !month || !year) {
            toast.error("Vui lòng nhập đầy đủ các trường bắt buộc (*)");
            return;
        }

        try {
            const payload = {
                UserId: userId,
                Month: Number(month),
                Year: Number(year),
                Price: Number(price),
                Bonus: Number(bonus),
                Description: description
            };

            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_URL_API}Salary/AddSalary`,
                payload,{
                    headers: {
                        'Authorization' : `Bearer ${accessToken}`
                    }
                }
            );

            if (res.data.status === 200 || res.status === 200) {
                toast.success("Thêm bảng lương thành công");
                resetForm();
                setIsModalOpen(false);
                await getListSalary();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Lỗi khi lưu bảng lương");
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
                            <div className="flex justify-between items-center p-5 border-b bg-emerald-50">
                                <h2 className="text-xl font-bold text-emerald-800">Thêm Bảng Lương Mới</h2>
                                <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="hover:bg-white/50 p-1 rounded-full transition cursor-pointer">
                                    <MdOutlineClose size={24} className="text-emerald-800" />
                                </button>
                            </div>

                            <form className="p-6 space-y-4" onSubmit={(e) => { e.preventDefault(); handleCreateSalary(); }}>
                                
                                <div>
                                    <label className="text-sm font-semibold text-gray-700">Nhân viên*</label>
                                    <select
                                        value={userId}
                                        onChange={(e) => setUserId(e.target.value)}
                                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
                                    >
                                        <option value="">-- Chọn nhân viên --</option>
                                        {users.map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {u.fullName} ({u.userName})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700">Tháng *</label>
                                        <input
                                            type="number" min="1" max="12"
                                            value={month}
                                            onChange={(e) => setMonth(Number(e.target.value))}
                                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700">Năm *</label>
                                        <input
                                            type="number"
                                            value={year}
                                            onChange={(e) => setYear(Number(e.target.value))}
                                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-700">Lương cơ bản (Price) *</label>
                                    <input
                                        type="number"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder="Nhập số tiền..."
                                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-700">Tiền thưởng (Bonus)</label>
                                    <input
                                        type="number"
                                        value={bonus}
                                        onChange={(e) => setBonus(e.target.value)}
                                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-700">Mô tả / Ghi chú</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={2}
                                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition resize-none"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={() => { setIsModalOpen(false); resetForm(); }}
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

export default CreateSalary;