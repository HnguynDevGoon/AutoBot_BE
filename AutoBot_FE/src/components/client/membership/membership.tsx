'use client';

import React from 'react';
import { Award, ChevronRight, Zap, Target, ShieldCheck } from 'lucide-react';

const MemberShip = () => {
    const userData = {
        name: "Nguyễn Văn A",
        currentRank: "Vàng",
        nextRank: "Kim Cương",
        totalOrders: 42,
        totalSpent: 12500000, // 12.5 triệu
        targetSpent: 20000000, // Cần 20 triệu để lên Kim Cương
        points: 1250,
        benefits: [
            "Miễn phí vận chuyển cho đơn hàng từ 500k",
            "Giảm giá 10% tổng hóa đơn",
            "Quà tặng vào ngày sinh nhật"
        ]
    };

    const progressPercent = (userData.totalSpent / userData.targetSpent) * 100;
    const missingAmount = userData.targetSpent - userData.totalSpent;

    return (
        <div className="p-4 md:p-8  min-h-screen font-sans">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Profile Card Chính */}
                <div className="bg-linear-to-br from-blue-600 to-purple-500 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="opacity-80 text-sm">Hạng hiện tại</p>
                                <h2 className="text-3xl font-bold flex items-center gap-2">
                                    <Award className="text-yellow-400" size={32} />
                                    Thành viên {userData.currentRank}
                                </h2>
                            </div>
                            <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl text-center">
                                <p className="text-xs uppercase tracking-wider">Điểm tích lũy</p>
                                <p className="text-xl font-bold">{userData.points.toLocaleString()} LP</p>
                            </div>
                        </div>

                        <div className="mt-8">
                            <div className="flex justify-between text-sm mb-2">
                                <span>Tiến trình lên {userData.nextRank}</span>
                                <span>{progressPercent}%</span>
                            </div>
                            {/* Progress Bar */}
                            <div className="w-full bg-white/20 rounded-full h-3">
                                <div
                                    className="bg-yellow-400 h-3 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.6)]"
                                    style={{ width: `${progressPercent}%` }}
                                ></div>
                            </div>
                            <p className="mt-3 text-sm italic opacity-90 text-right">
                                Bạn cần chi tiêu thêm **{missingAmount.toLocaleString()}đ** để thăng hạng!
                            </p>
                        </div>
                    </div>

                    {/* Trang trí nền */}
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                </div>

                {/* Grid thông số nhanh */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                            <Zap size={24} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs">Tổng đơn hàng</p>
                            <p className="font-bold text-lg">{userData.totalOrders}</p>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="p-3 bg-green-50 rounded-xl text-green-600">
                            <Target size={24} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs">Tổng chi tiêu</p>
                            <p className="font-bold text-lg">{userData.totalSpent.toLocaleString()}đ</p>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 col-span-2 md:col-span-1">
                        <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs">Đặc quyền cấp {userData.currentRank}</p>
                            <p className="font-bold text-lg">{userData.benefits.length} ưu đãi</p>
                        </div>
                    </div>
                </div>

                {/* Danh sách quyền lợi */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Đặc quyền của bạn</h3>
                    <div className="space-y-3">
                        {userData.benefits.map((benefit, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-default">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                <span className="text-gray-700 flex-1">{benefit}</span>
                                <ChevronRight size={16} className="text-gray-400" />
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-6 py-3 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-900 transition-all">
                        Xem tất cả hạng thẻ & quyền lợi
                    </button>
                </div>

            </div>
        </div>
    );
};

export default MemberShip;