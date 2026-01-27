"use client";

import StatisticBox from "@/components/shared/statisticbox/statisticbox";
import { GetAccessToken } from "@/components/shared/token/accessToken";
import { RootState } from "@/redux/store";
import axios from "axios";
import { format } from "date-fns";
import {
    DollarSign,
    ArrowUpCircle,
    ArrowDownCircle,
    Activity,
    Search,
    Calendar,
    FileText
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const Statistic = () => {
    const userInfo = useSelector((state: RootState) => state.user.userInfo);
    const [accessToken, setAccessToken] = useState<string>('');
    const today = new Date().toISOString().split('T')[0];
    const [fromDate, setFromDate] = useState<string>(today);
    const [toDate, setToDate] = useState<string>(today);
    const [stats, setStats] = useState<any>({
        totalRevenue: 0,
        totalDeposit: 0,
        totalWithdraw: 0,
        totalTransactions: 0
    });
    const [listData, setListData] = useState<any[]>([]);

    useEffect(() => {
        const loadToken = async () => {
            if (userInfo?.Id) {
                const token = await GetAccessToken(userInfo?.Id);
                if (token) setAccessToken(token);
            }
        };
        loadToken();
    }, [userInfo]);

    const handleFetchStatistics = async () => {
        if (!fromDate || !toDate || !accessToken) return;
        if (new Date(fromDate) > new Date(toDate)) {
            alert("Ngày bắt đầu không được lớn hơn ngày kết thúc");
            return;
        }
        try {
            const res = await axios.get(
                `${process.env.NEXT_PUBLIC_URL_API}PurchaseHistory/GetRevenueByDateRange?from=${fromDate}&to=${toDate}`,
                { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );
            const purchases = res.data?.data?.purchases || [];
            let deposit = 0;
            let withdraw = 0;
            let revenue = 0;
            purchases.forEach((p: any) => {
                const amount = p.priceBot || 0;
                if (p.status === "Paid") {
                    if (p.orderType === "Deposit") deposit += amount;
                    if (p.orderType === "Withdraw") withdraw += amount;
                    if (p.orderType === "BuyBot") revenue += amount;
                }
            });
            setStats({
                totalRevenue: revenue,
                totalDeposit: deposit,
                totalWithdraw: withdraw,
                totalTransactions: purchases.length
            });
            setListData(purchases);
        } catch (err) {
            setListData([]);
        }
    };

    useEffect(() => {
        handleFetchStatistics();
    }, [fromDate, toDate, accessToken]);

    const formatVND = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    return (
        <div className="space-y-6 pb-10 bg-gray-50/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Thống kê chi tiết</h1>
                    <p className="text-sm text-gray-500">Xem báo cáo doanh thu và giao dịch theo thời gian.</p>
                </div>
                <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 px-2">
                            <Calendar size={16} className="text-gray-400" />
                            <input
                                type="date"
                                className="text-sm border-none focus:ring-0 text-gray-600 cursor-pointer"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                            />
                        </div>
                        <span className="text-gray-300">|</span>
                        <div className="flex items-center gap-2 px-2">
                            <input
                                type="date"
                                className="text-sm border-none focus:ring-0 text-gray-600 cursor-pointer"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                            />
                        </div>
                    </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatisticBox
                    title="Doanh thu"
                    value={formatVND(stats.totalRevenue)}
                    icon={DollarSign}
                    color="bg-blue-600"
                    chartColor="bg-blue-600"
                />
                <StatisticBox
                    title="Tổng tiền nạp"
                    value={formatVND(stats.totalDeposit)}
                    icon={ArrowUpCircle}
                    color="bg-green-600"
                    chartColor="bg-green-600"
                />
                <StatisticBox
                    title="Tổng tiền rút"
                    value={formatVND(stats.totalWithdraw)}
                    icon={ArrowDownCircle}
                    color="bg-rose-600"
                    chartColor="bg-rose-600"
                />
                <StatisticBox
                    title="Tổng giao dịch"
                    value={stats.totalTransactions.toString()}
                    icon={Activity}
                    color="bg-amber-500"
                    chartColor="bg-amber-500"
                />
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-50 bg-gray-50/30">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <FileText size={18} className="text-blue-600" />
                        Danh sách giao dịch chi tiết
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    {!fromDate || !toDate ? (
                        <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                            <Calendar size={48} className="mb-4 opacity-20" />
                            <p className="text-lg font-medium">Vui lòng chọn ngày để xem thống kê</p>
                            <p className="text-sm">Dữ liệu sẽ được hiển thị sau khi bạn chọn khoảng thời gian.</p>
                        </div>
                    ) : listData.length > 0 ? (
                        <table className="w-full text-left border-collapse text-sm">
                            <thead className="bg-gray-50 text-gray-400 font-medium text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-3">Mã đơn</th>
                                    <th className="px-6 py-3">Khách hàng</th>
                                    <th className="px-6 py-3">Nội dung</th>
                                    <th className="px-6 py-3">Loại</th>
                                    <th className="px-6 py-3 text-center">Số tiền</th>
                                    <th className="px-6 py-3 text-center">Ngày tạo</th>
                                    <th className="px-6 py-3 text-center">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {listData.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-600">#{item.orderCode}</td>
                                        <td className="px-6 py-4 font-semibold text-gray-800">{item.userName}</td>
                                        <td className="px-6 py-4 text-gray-500">{item.nameBot || "Nạp/Rút tiền"}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.orderType === 'Deposit' ? 'bg-green-50 text-green-600' :
                                                    item.orderType === 'Withdraw' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                                }`}>
                                                {item.orderType === 'BuyBot' ? 'MUA BOT' : item.orderType?.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 text-center font-bold ${item.orderType === 'Withdraw' ? 'text-red-500' : 'text-gray-800'
                                            }`}>
                                            {item.orderType === 'Withdraw' ? '-' : '+'}{formatVND(item.priceBot)}
                                        </td>
                                        <td className="px-6 py-4 text-center text-gray-500">
                                            {item.date ? format(new Date(item.date), 'dd/MM/yyyy HH:mm') : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${item.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {item.status === 'Paid' ? 'HOÀN TẤT' : 'CHỜ XỬ LÝ'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="py-20 text-center text-gray-500">Không có dữ liệu trong khoảng thời gian này.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Statistic;