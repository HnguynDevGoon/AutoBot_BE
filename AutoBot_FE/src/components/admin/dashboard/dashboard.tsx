"use client";

import StatisticBox from "@/components/shared/statisticbox/statisticbox";
import { GetAccessToken } from "@/components/shared/token/accessToken";
import { RootState } from "@/redux/store";
import axios from "axios";
import { format, subDays } from "date-fns";
import {
    Bot,
    DollarSign,
    ShoppingCart,
    ArrowRight,
    TrendingUp,
    ChevronRight,
    ChevronLeft,
    Search
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, PieChart, Pie } from "recharts";

interface listDetailPriceBot {
    id: string,
    priceBot: Number,
    startDate?: Date,
    endDate?: Date,
    paymentMethod: string,
    status: string,
    orderCode: string,
    date: Date,
    nameBot?: string,
    userId: string,
    userName: string
}

interface PaginationData {
    items: listDetailPriceBot[];
    totalPages: number;
    totalItems: number;
    currentPage: number;
    pageSize: number;
}

interface RecentTransaction {
    id: string;
    orderCode: string;
    userName: string;
    priceBot: number;
    date: string;
    status: string;
    orderType: string;
    paymentMethod: string;
    nameBot: string | null;
    userId: string;
}

const AdminDashboard = () => {
    const router = useRouter();
    const userInfo = useSelector((state: RootState) => state.user.userInfo);
    const [accessToken, setAccessToken] = useState<string>('');
    const [revenue, setRevenue] = useState<number>(0);
    const [lastRevenue, setLastRevenue] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [historyData, setHistoryData] = useState<PaginationData | null>(null);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [keyword, setKeyword] = useState<string>('');
    const [listRecentTransaction, setListRecentTransaction] = useState<RecentTransaction[]>([]);
    const [isActiveBot, setIsActiveBot] = useState<any>([]);
    const [weeklyActivity, setWeeklyActivity] = useState<any[]>([]);
    const [isLoadingChart, setIsLoadingChart] = useState<boolean>(false);

    useEffect(() => {
        const loadToken = async () => {
            if (userInfo?.Id) {
                const token = await GetAccessToken(userInfo?.Id);
                if (token) setAccessToken(token);
            }
        };
        loadToken();
    }, [userInfo]);

    useEffect(() => {
        if (!accessToken) return;
        const now = new Date();
        const yesterday = subDays(now, 1);
        const formatedDate = format(now, 'yyyy-MM-dd');
        const formatedYesterday = format(yesterday, 'yyyy-MM-dd');
        handleGetRevenueByDate(formatedDate, formatedDate);
        handleGetRevenueByLastDate(formatedYesterday, formatedYesterday);
        handleRecentTransaction();
        handleGetBotIsActive();
        handleGetWeeklyActivity();
    }, [accessToken]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (accessToken) handleGetDetailPriceBot();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [accessToken, currentPage, keyword]);

    const handleGetWeeklyActivity = async () => {
        if (!accessToken) return;
        setIsLoadingChart(true);
        try {
            const now = new Date();
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(new Date(now).setDate(diff));
            const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
            const chartData = [];
            for (let i = 0; i < 7; i++) {
                const targetDate = new Date(monday);
                targetDate.setDate(monday.getDate() + i);
                const formattedDate = format(targetDate, 'yyyy-MM-dd');
                try {
                    const res = await axios.get(
                        `${process.env.NEXT_PUBLIC_URL_API}PurchaseHistory/GetRevenueByDateRange?from=${formattedDate}&to=${formattedDate}`,
                        { headers: { 'Authorization': `Bearer ${accessToken}` } }
                    );

                    const purchases = res.data.data.purchases || [];
                    const totalDeposit = purchases
                        .filter((p: any) => p.orderType === "Deposit" && p.status === "Paid")
                        .reduce((sum: number, p: any) => sum + (p.priceBot || 0), 0);

                    const totalWithdraw = purchases
                        .filter((p: any) => p.orderType === "Withdraw" && p.status === "Paid")
                        .reduce((sum: number, p: any) => sum + (p.priceBot || 0), 0);

                    chartData.push({
                        name: dayLabels[i],
                        deposit: totalDeposit,
                        withdraw: totalWithdraw
                    });
                } catch (err) {
                    chartData.push({ name: dayLabels[i], deposit: 0, withdraw: 0 });
                }
            }
            setWeeklyActivity(chartData);
        } catch (err) {
        } finally {
            setIsLoadingChart(false);
        }
    };

    const handleGetRevenueByDate = async (from: string, to: string) => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_URL_API}PurchaseHistory/GetRevenueByDateRange?from=${from}&to=${to}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            const validOrders = res.data.data.purchases.filter((item: any) =>
                item.orderType === "BuyBot" || item.orderType === "Deposit"
            );
            const calculatedRevenue = validOrders.reduce((sum: number, item: any) => sum + item.priceBot, 0);
            setRevenue(calculatedRevenue);
        } catch (err) {
        }
    }

    const handleGetRevenueByLastDate = async (from: string, to: string) => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_URL_API}PurchaseHistory/GetRevenueByDateRange?from=${from}&to=${to}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            setLastRevenue(res.data.data.totalRevenue);
        } catch (err) {
        }
    }

    const handleGetDetailPriceBot = async () => {
        try {
            const res = await axios.get(
                `${process.env.NEXT_PUBLIC_URL_API}PurchaseHistory/GetAllHistoryDynamicForAdmin`,
                {
                    params: {
                        pageSize: process.env.NEXT_PUBLIC_PAGE_SIZE || 10,
                        pageNumber: currentPage,
                        searchKeyword: keyword
                    },
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                }
            );

            setHistoryData(res.data.data);
            setTotalPages(res.data.data.totalPages);
        } catch (err) {
        }
    }

    const handleRecentTransaction = async () => {
        await axios.get(`${process.env.NEXT_PUBLIC_URL_API}PurchaseHistory/GetNewestTransactionForAdmin`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        }).then(res => {
            setListRecentTransaction(res.data.data);
        }).catch(err => {
        })
    }

    const handleGetBotIsActive = async () => {
        await axios.get(`${process.env.NEXT_PUBLIC_URL_API}PurchaseHistory/GetAllActiveBotsSystemWide`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        }).then(res => {
            setIsActiveBot(res.data.data);
        }).catch(err => {
        })
    }


    const formatVND = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    const getPageNumbers = (current: number, total: number) => {
        const pages: (number | string)[] = [];
        if (total <= 5) {
            for (let i = 1; i <= total; i++) pages.push(i);
        } else {
            if (current <= 3) {
                pages.push(1, 2, 3, 4, "...", total);
            } else if (current >= total - 2) {
                pages.push(1, "...", total - 3, total - 2, total - 1, total);
            } else {
                pages.push(1, "...", current - 1, current, current + 1, "...", total);
            }
        }
        return pages;
    };

    const calculateGrowth = (current: number, previous: number) => {
        if (current === 0) return 0;
        if (!previous || previous === 0) return 100;
        const growth = ((current - previous) / previous) * 100;
        return parseFloat(growth.toFixed(1));
    };

    const calculateBotGrowth = (botList: any[]) => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const lastMonthDate = new Date();
        lastMonthDate.setMonth(now.getMonth() - 1);
        const lastMonth = lastMonthDate.getMonth();
        const lastMonthYear = lastMonthDate.getFullYear();

        const botsThisMonth = botList.filter(bot => {
            const d = new Date(bot.startDate);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).length;

        const botsLastMonth = botList.filter(bot => {
            const d = new Date(bot.startDate);
            return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
        }).length;

        if (botsLastMonth === 0) return botsThisMonth > 0 ? 100 : 0;
        const growth = ((botsThisMonth - botsLastMonth) / botsLastMonth) * 100;
        return parseFloat(growth.toFixed(1));
    };

    const botGrowthValue = calculateBotGrowth(isActiveBot);
    const isBotPositive = botGrowthValue >= 0;

    const growthValue = calculateGrowth(revenue, lastRevenue);
    const isPositive = growthValue >= 0;
    const totalWeeklyDeposit = weeklyActivity.reduce((sum, day) => sum + day.deposit, 0);
    const totalWeeklyWithdraw = weeklyActivity.reduce((sum, day) => sum + day.withdraw, 0);
    const totalTransactionVolume = totalWeeklyDeposit + totalWeeklyWithdraw;

    const pieData = [
        { name: "Nạp tiền", value: totalWeeklyDeposit, color: "#3b82f6" },
        { name: "Rút tiền", value: totalWeeklyWithdraw, color: "#f43f5e" }
    ];

    const depositPercentage = totalTransactionVolume > 0
        ? Math.round((totalWeeklyDeposit / totalTransactionVolume) * 100)
        : 0;

    return (
        <div className="space-y-4 md:space-y-6 pb-10">
            <div className="flex flex-col justify-start items-start">
                <h1 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight">Bảng điều khiển hệ thống</h1>
                <p className="text-xs md:text-sm text-gray-500 mt-1">Chào mừng bạn đến với hệ thống quản lý AutoBotPS.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 laptop:grid-cols-12 gap-4 md:gap-6">
                <div className="laptop:col-span-3">
                    <StatisticBox
                        title="Doanh thu"
                        value={revenue ? formatVND(revenue) : "0 đ"}
                        detail={Math.abs(growthValue)}
                        icon={DollarSign}
                        isPositive={growthValue > 0}
                        isNeutral={growthValue === 0}
                        color="bg-blue-600"
                        chartColor="bg-blue-600"
                    />
                </div>
                <div className="laptop:col-span-3">
                    <StatisticBox
                        title="Bot đang chạy"
                        value={isActiveBot.length}
                        detail={Math.abs(botGrowthValue)}
                        isPositive={isBotPositive}
                        icon={Bot}
                        color="bg-indigo-600"
                        chartColor="bg-indigo-600"
                    />
                </div>
                <div className="md:col-span-2 laptop:col-span-6 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800 text-sm md:text-base">Giao dịch mới nhất</h3>
                        <button onClick={() => router.push(`/admin/transaction`)} className="p-1.5 hover:bg-gray-50 rounded-lg text-blue-600 transition cursor-pointer">
                            <ArrowRight size={18} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 tablet:grid-cols-2 gap-3 md:gap-4 flex-1">
                        {listRecentTransaction && listRecentTransaction.length > 0 ? (
                            listRecentTransaction.slice(0, 4).map((order: RecentTransaction) => {
                                const isDeposit = order.orderType === "Deposit";
                                return (
                                    <div key={order.id} className="flex items-center justify-between p-2.5 md:p-3 rounded-xl border border-gray-50 bg-gray-50/30 hover:bg-white hover:shadow-md hover:border-blue-100 transition-all duration-200">
                                        <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                                            <div className={`w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-full flex items-center justify-center font-bold text-xs md:text-sm uppercase ${isDeposit ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"
                                                }`}>
                                                {order.userName?.charAt(0) || "U"}
                                            </div>

                                            <div className="min-w-0">
                                                <p className="text-xs md:text-sm font-bold text-gray-800 truncate w-20 xs:w-28" title={order.userName}>
                                                    {order.userName}
                                                </p>
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`text-[9px] px-1 rounded-sm font-bold ${isDeposit ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                                        }`}>
                                                        {isDeposit ? "NẠP" : "RÚT"}
                                                    </span>
                                                    <p className="text-[9px] md:text-[10px] text-gray-400">
                                                        {order.date ? format(new Date(order.date), 'HH:mm') : '--:--'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <p className={`text-xs md:text-sm font-black ${isDeposit ? "text-green-600" : "text-red-600"}`}>
                                                {isDeposit ? "+" : "-"}{formatVND(Number(order.priceBot))}
                                            </p>
                                            <p className="text-[9px] text-gray-400 font-medium hidden xs:block">{order.paymentMethod}</p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-1 tablet:col-span-2 flex flex-col items-center justify-center py-6 text-gray-400">
                                <p className="text-xs md:text-sm italic">Không có giao dịch nào gần đây</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 laptop:grid-cols-12 gap-4 md:gap-6">
                <div className="laptop:col-span-8 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center mb-4 md:mb-6 gap-2">
                        <div>
                            <h3 className="font-bold text-gray-800 text-base md:text-lg">Hoạt động hàng tuần</h3>
                            <p className="text-xs text-gray-400">Thống kê nạp tiền trong tuần hiện tại</p>
                        </div>
                        <div className="flex gap-4 text-[10px] md:text-[11px] font-bold uppercase">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                <span className="text-gray-500">Nạp</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                <span className="text-gray-500">Rút</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-[250px] md:h-[280px] w-full">
                        {isLoadingChart ? (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm italic">
                                Đang tải dữ liệu biểu đồ...
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyActivity} barGap={8}>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f3f4f6" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                                        tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : value}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        formatter={(value: number | string | undefined) => {
                                            if (value === undefined) return ["0 đ", "Số tiền"];
                                            return [formatVND(Number(value)), "Số tiền"];
                                        }}
                                    />
                                    <Bar name="Nạp tiền" dataKey="deposit" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} />
                                    <Bar name="Rút tiền" dataKey="withdraw" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={12} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
                <div className="laptop:col-span-4 bg-white px-4 md:px-6 py-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center">
                    <div className="text-center space-y-2 w-full">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-bold text-gray-800 text-sm md:text-base">Tỉ lệ giao dịch</h4>
                            <span className="text-[9px] md:text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-500 font-bold">7 NGÀY</span>
                        </div>
                        <div className="relative w-full h-40 md:h-48 flex items-center justify-center">
                            {totalTransactionVolume > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={8}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number | string | undefined) => {
                                                const numericValue = typeof value === 'number' ? value : Number(value) || 0;
                                                return [formatVND(numericValue), ""];
                                            }}
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-gray-300 text-xs">Chưa có dữ liệu tuần này</div>
                            )}
                            {!isLoadingChart && totalTransactionVolume > 0 && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-xl md:text-2xl font-black text-blue-600">{depositPercentage}%</span>
                                    <span className="text-[8px] md:text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Tỉ lệ nạp</span>
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-50">
                            <div className="text-left">
                                <p className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase">Tổng Nạp</p>
                                <p className="text-xs md:text-sm font-black text-blue-600">{formatVND(totalWeeklyDeposit)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase">Tổng Rút</p>
                                <p className="text-xs md:text-sm font-black text-rose-500">{formatVND(totalWeeklyWithdraw)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 md:p-5 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                            <ShoppingCart size={18} />
                        </div>
                        <h3 className="font-bold text-gray-800 text-sm md:text-base">Chi tiết đăng ký gói Bot</h3>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Tìm theo tên bot, mã đơn..."
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 text-black border border-gray-200 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                            value={keyword}
                            onChange={(e) => {
                                setKeyword(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm min-w-[900px] laptop:min-w-full">
                        <thead className="bg-gray-50/50 text-gray-400 font-medium text-xs uppercase">
                            <tr>
                                <th className="px-4 md:px-6 py-3">Mã đơn</th>
                                <th className="px-4 md:px-6 py-3">User</th>
                                <th className="px-4 md:px-6 py-3">Gói Bot</th>
                                <th className="px-4 md:px-6 py-3 text-center">Giá trị</th>
                                <th className="px-4 md:px-6 py-3 text-center">Thanh toán</th>
                                <th className="px-4 md:px-6 py-3 text-center">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {historyData?.items && historyData.items.length > 0 ? (
                                historyData.items.map((item) => (
                                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="px-4 md:px-6 py-4 font-medium text-gray-500 whitespace-nowrap">#{item.orderCode}</td>
                                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                            <div className="font-semibold text-gray-800">{item.userName}</div>
                                            <div className="text-[10px] text-gray-400">
                                                {item.date ? format(new Date(item.date), 'dd/MM/yyyy HH:mm') : 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-6 py-4 font-bold text-blue-600 whitespace-nowrap">{item.nameBot || "Gói Bot"}</td>
                                        <td className="px-4 md:px-6 py-4 text-center font-mono font-bold whitespace-nowrap">{formatVND(Number(item.priceBot))}</td>
                                        <td className="px-4 md:px-6 py-4 text-center whitespace-nowrap">
                                            <span className="text-[11px] px-2 py-0.5 bg-gray-100 rounded text-gray-600">{item.paymentMethod}</span>
                                        </td>
                                        <td className="px-4 md:px-6 py-4 text-center whitespace-nowrap">
                                            <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black ${item.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {item.status === 'Paid' ? 'HOÀN TẤT' : item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">Không tìm thấy dữ liệu phù hợp...</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex items-center justify-end gap-2 m-2 p-2 border-t border-gray-50">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 md:p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition cursor-pointer"
                    >
                        <ChevronLeft size={16} />
                    </button>

                    <div className="hidden sm:flex gap-1">
                        {getPageNumbers(currentPage, totalPages).map((page, idx) =>
                            page === "..." ? (
                                <span key={idx} className="w-8 h-8 flex items-center justify-center text-gray-500 text-xs">...</span>
                            ) : (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentPage(Number(page))}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer ${currentPage === page
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                                        : "text-gray-600 hover:bg-gray-100"
                                        }`}
                                >
                                    {page}
                                </button>
                            )
                        )}
                    </div>
                    <div className="sm:hidden text-xs font-medium text-gray-600 px-2">
                        Trang {currentPage} / {totalPages}
                    </div>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 md:p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition cursor-pointer"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;