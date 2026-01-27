'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
    FaMoneyBillWave, FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaClock, FaChevronDown,
    FaChevronUp, FaCreditCard, FaUser, FaSearch, FaFilter
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import axios from 'axios';
import { GetAccessToken } from '@/components/shared/token/accessToken';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { toast } from 'sonner';
import { endOfDay, format, isAfter, isBefore, isValid, isWithinInterval, parseISO, startOfDay } from 'date-fns';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'VND',
    }).format(amount);
};

const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';

    // Chuyển đổi sang đối tượng Date
    const dateObj = typeof date === 'string' ? parseISO(date) : date;

    // Kiểm tra tính hợp lệ (tránh lỗi "Invalid Date")
    if (!isValid(dateObj)) return 'N/A';

    // Định dạng dd/MM/yyyy
    return format(dateObj, 'dd/MM/yyyy');
};

const StatusBadge = ({ startDate, endDate }: { startDate: string | Date, endDate: string | Date }) => {
    const status = getStatusByDate(startDate, endDate);

    let colorClass;
    let Icon;
    let label;

    switch (status) {
        case 'Active':
            colorClass = 'bg-green-600 text-white';
            Icon = FaCheckCircle;
            label = 'Đang hoạt động';
            break;
        case 'Expired':
            colorClass = 'bg-red-600 text-white';
            Icon = FaTimesCircle;
            label = 'Đã hết hạn';
            break;
        case 'Pending':
            colorClass = 'bg-yellow-600 text-white';
            Icon = FaClock;
            label = 'Chờ hiệu lực';
            break;
        default:
            colorClass = 'bg-gray-600 text-white';
            Icon = FaTimesCircle;
            label = 'Không xác định';
    }

    return (
        <span className={`inline-flex items-center gap-x-1.5 rounded-full px-3 py-1 text-xs font-semibold ${colorClass}`}>
            <Icon className="h-3 w-3" />
            {label}
        </span>
    );
};

const getStatusByDate = (startDate: string | Date, endDate: string | Date) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Nếu thời gian hiện tại nằm trong khoảng Start và End
    if (isWithinInterval(now, { start: startOfDay(start), end: endOfDay(end) })) {
        return 'Active';
    }
    // Nếu chưa đến ngày bắt đầu
    if (isBefore(now, startOfDay(start))) {
        return 'Pending';
    }
    // Nếu đã quá ngày kết thúc
    if (isAfter(now, endOfDay(end))) {
        return 'Expired';
    }

    return 'Failed';
};

const SummaryCard = ({ title, value, icon: Icon, color, bgColor }: { title: string, value: string | number, icon: any, color: string, bgColor: string }) => (
    <div className={`dark:${bgColor} bg-[#f5f5f5] shadow-lg rounded-xl p-6 flex items-center justify-between border-l-4 border-blue-600 transition duration-300 hover:shadow-blue-500/50`}>
        <div>
            <p className="text-sm font-medium dark:text-gray-400 text-black">{title}</p>
            <p className={`mt-1 text-3xl font-extrabold ${color}`}>{value}</p>
        </div>
        <div className={`p-4 rounded-full dark:bg-gray-700/50 bg-white`}>
            <Icon className={`w-7 h-7 ${color}`} />
        </div>
    </div>
);


const Purchase = () => {
    const userInfo = useSelector((state: RootState) => state.user.userInfo);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [accessToken, setAccessToken] = useState<string>('');
    const [transactionCompleted, setTransactionCompleted] = useState<number>(0);
    const [totalSpentBot, setTotalSpentBot] = useState<number>(0);
    const [listHistory, setListHistory] = useState<any>([]);

    useEffect(() => {
        if (!userInfo?.Id) return;

        const initializeBotData = async () => {
            try {
                const token = await GetAccessToken(userInfo.Id);
                if (token) {
                    setAccessToken(token);
                    await Promise.all([
                        handleCompletedTransactionBot(token),
                        handleGetTotalSpentOnBots(token),
                        handleGetHistory("BuyBot", 1, token)
                    ]);
                }
            } catch (error) {
                console.error("Lỗi khởi tạo dữ liệu bot:", error);
            }
        };

        initializeBotData();

    }, [userInfo?.Id]);

    const toggleRow = (id: string) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    const filteredHistory = useMemo(() => {
        return listHistory?.items?.filter((item: any) => {
            const matchesSearch = item.nameBot.toLowerCase().includes(searchTerm.toLowerCase());
            const currentStatus = getStatusByDate(item.startDate, item.endDate);
            const matchesStatus = statusFilter === 'All' || currentStatus === statusFilter;
            const itemDate = new Date(item.date);
            let matchesDateRange = true;
            if (startDate) {
                const filterStart = startOfDay(new Date(startDate));
                if (isBefore(itemDate, filterStart)) matchesDateRange = false;
            }
            if (endDate) {
                const filterEnd = endOfDay(new Date(endDate));
                if (isAfter(itemDate, filterEnd)) matchesDateRange = false;
            }
            return matchesSearch && matchesStatus && matchesDateRange;
        });
    }, [listHistory, searchTerm, statusFilter, startDate, endDate]);


    const handleCompletedTransactionBot = async (accessToken: string) => {
        await axios.get(`${process.env.NEXT_PUBLIC_URL_API}PurchaseHistory/GetMyBoughtBots`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        }).then(res => {
            setTransactionCompleted(res.data.data.length);
        }).catch(err => {
            toast.error(err);
        })
    }

    const handleGetTotalSpentOnBots = async (accessToken: string) => {
        await axios.get(`${process.env.NEXT_PUBLIC_URL_API}PurchaseHistory/GetTotalSpentOnBots`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        }).then(res => {
            setTotalSpentBot(res.data.data);
        }).catch(err => {
            toast.error(err);
        })
    }

    const handleGetHistory = async (orderType: string, pageNumber: number, accessToken: string) => {
        await axios.get(`${process.env.NEXT_PUBLIC_URL_API}PurchaseHistory/GetMyHistoryDynamic?orderType=${orderType}&pageSize=${process.env.NEXT_PUBLIC_PAGE_SIZE}&pageNumber=${pageNumber}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        }).then(res => {
            setListHistory(res.data.data);
            console.log(res.data.data);
        }).catch(err => {
            console.log(err);
        })
    }

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8 dark:bg-[#1C2129] bg-white">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-7xl mx-auto"
            >
                <h1 className="text-4xl font-extrabold dark:text-white text-black mb-8 border-b dark:border-gray-700 border-gray-300 pb-3">
                    Lịch Sử Giao Dịch Bot
                </h1>

                <div className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <SummaryCard
                        title="Tổng Chi Tiêu"
                        value={formatCurrency(totalSpentBot ? totalSpentBot : 0)}
                        icon={FaMoneyBillWave}
                        color="text-blue-400"
                        bgColor="bg-gray-800"
                    />
                    <SummaryCard
                        title="Bot Đang Hoạt Động"
                        value={listHistory?.items?.filter((item: any) => item.status === 'Active').length}
                        icon={FaCheckCircle}
                        color="text-green-400"
                        bgColor="bg-gray-800"
                    />
                    <SummaryCard
                        title="Giao Dịch Đã Hoàn Thành"
                        value={transactionCompleted ? transactionCompleted : 0}
                        icon={FaCalendarAlt}
                        color="text-purple-400"
                        bgColor="bg-gray-800"
                    />
                </div>

                <div className="dark:bg-[#242933] bg-[#f5f5f5] shadow-lg rounded-xl p-5 mb-6 border dark:border-gray-700 border-gray-300">
                    <h3 className="text-lg font-semibold dark:text-white text-black mb-4 flex items-center">
                        <FaFilter className="w-5 h-5 mr-2 text-blue-400" /> Công Cụ Lọc & Tìm Kiếm
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="col-span-1 md:col-span-2 relative">
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên Bot..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-3 pl-10 rounded-lg dark:bg-gray-700 bg-white dark:text-white text-black border dark:border-gray-600 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full p-3 rounded-lg dark:bg-gray-700 bg-white dark:text-white text-black border dark:border-gray-600 border-gray-300 focus:border-blue-500 focus:ring-blue-500 appearance-none cursor-pointer"
                            >
                                <option value="All">Tất cả Trạng thái</option>
                                <option value="Active">Đang hoạt động</option>
                                <option value="Expired">Đã hết hạn</option>
                                <option value="Pending">Chờ xử lý</option>
                                <option value="Failed">Thất bại</option>
                            </select>
                        </div>
                        <div className="col-span-1 md:col-span-4 lg:col-span-1 grid grid-cols-2 gap-4">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                placeholder="Từ Ngày"
                                className="w-full p-3 rounded-lg dark:bg-gray-700 bg-white dark:text-white text-black border dark:border-gray-600 border-gray-300 focus:border-blue-500 focus:ring-blue-500 cursor-pointer"
                            />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                placeholder="Đến Ngày"
                                className="w-full p-3 rounded-lg dark:bg-gray-700 bg-white dark:text-white text-black border dark:border-gray-600 border-gray-300 focus:border-blue-500 focus:ring-blue-500 cursor-pointer"
                            />
                        </div>
                    </div>
                </div>
                <div className="dark:bg-[#242933] bg-[#f5f5f5] shadow-2xl rounded-xl overflow-hidden border dark:border-gray-700 border-gray-300">
                    <div className="px-4 sm:px-6 lg:px-8 py-5 border-b dark:border-gray-700 border-gray-300">
                        <h2 className="text-xl font-semibold dark:text-white text-black">
                            Kết quả Lịch Sử ({filteredHistory?.length} giao dịch)
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y dark:divide-gray-700 divide-gray-300">
                            <thead className="dark:bg-[#2D333F] bg-white sticky top-0">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium dark:text-gray-400 text-black uppercase tracking-wider">
                                        Bot Name
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium dark:text-gray-400 text-black uppercase tracking-wider">
                                        Giá
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium dark:text-gray-400 text-black uppercase tracking-wider hidden sm:table-cell">
                                        Ngày mua
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium dark:text-gray-400 text-black uppercase tracking-wider hidden md:table-cell">
                                        Thời hạn
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium dark:text-gray-400 text-black uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-center text-xs font-medium dark:text-gray-400 text-black uppercase tracking-wider">
                                        Chi tiết
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-800 divide-gray-300">
                                {filteredHistory?.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-10 text-center dark:text-gray-500 text-black italic">
                                            Không tìm thấy lịch sử mua bot nào phù hợp với điều kiện lọc.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredHistory?.map((item: any) => (
                                        <React.Fragment key={item.id}>
                                            <tr className="dark:bg-[#242933] bg-white dark:hover:bg-[#343a46] hover:bg-[#f5f5f5] transition duration-150 cursor-pointer" onClick={() => toggleRow(item.id)}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold dark:text-white text-black">
                                                    {item.nameBot}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400 font-medium">
                                                    {formatCurrency(item.priceBot)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 hidden sm:table-cell">
                                                    {formatDate(item.date)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 hidden md:table-cell">
                                                    <div className="flex items-center space-x-1">
                                                        <FaCalendarAlt className="w-4 h-4 text-gray-500" />
                                                        <span>{formatDate(item.startDate)} - {formatDate(item.endDate)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <StatusBadge startDate={item.startDate} endDate={item.endDate} />
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button className="text-gray-400 hover:text-blue-400">
                                                        {expandedRow === item.id ? <FaChevronUp className="w-4 h-4" /> : <FaChevronDown className="w-4 h-4" />}
                                                    </button>
                                                </td>
                                            </tr>
                                            {expandedRow === item.id && (
                                                <tr className="dark:bg-[#2D333F] bg-white">
                                                    <td colSpan={6} className="p-4 sm:p-6">
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            transition={{ duration: 0.3 }}
                                                            className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300 border-l-4 border-blue-600 pl-4"
                                                        >
                                                            <div className="flex items-center space-x-2">
                                                                <FaCreditCard className="w-4 h-4 text-blue-400" />
                                                                <span className="font-medium text-gray-400">Phương Thức TT:</span>
                                                                <span>{item.paymentMethod}</span>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <FaUser className="w-4 h-4 text-blue-400" />
                                                                <span className="font-medium text-gray-400">Tên Người Dùng:</span>
                                                                <code className="bg-gray-700 p-1 rounded text-xs">{item.userName}</code>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <FaClock className="w-4 h-4 text-blue-400" />
                                                                <span className="font-medium text-gray-400">Ngày Kết Thúc:</span>
                                                                <span>{formatDate(item.endDate)}</span>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <FaCheckCircle className="w-4 h-4 text-blue-400" />
                                                                <span className="font-medium text-gray-400">Tên Bot:</span>
                                                                <code className="bg-gray-700 p-1 rounded text-xs">{item.nameBot}</code>
                                                            </div>
                                                        </motion.div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

export default Purchase;