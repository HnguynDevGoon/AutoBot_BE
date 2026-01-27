'use client';

import { RootState } from "@/redux/store";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import {
    FaWallet,
    FaArrowUp,
    FaArrowDown,
    FaHistory,
    FaEye,
    FaEyeSlash,
    FaChartBar,
    FaBell,
    FaMinus
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { formatCurrency } from "@/components/shared/currency/formatCurrency";
import { useRouter } from "next/navigation";
import { formatDateFunc } from "@/components/shared/date/formatDate";
import { endOfMonth, format, isWithinInterval, parseISO, startOfMonth } from "date-fns";
import { GetAccessToken } from "@/components/shared/token/accessToken";
import handleUpload from "@/components/shared/cloudinary/upload-image";

interface ChartPoint {
    x: string;
    y: number;
    transactionType: string;
    amount: number;
}

const MyWallet = () => {
    const router = useRouter();
    const userInfo = useSelector((state: RootState) => state.user.userInfo);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [accessToken, setAccessToken] = useState<string>('');
    const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);
    const [isVisible, setIsVisible] = useState(true);
    const [user, setUser] = useState<any>('');
    const [wallet, setWallet] = useState<any>('');
    const [transaction, setTransaction] = useState<any[]>([]);

    const [openWithdrawMoney, setOpenWithdrawMoney] = useState<boolean>(false);
    const [banks, setBanks] = useState<Array<{ code: string; name: string; logo: string, shortName: string }>>([]);
    const [selectedBank, setSelectedBank] = useState<any>(null);
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);
    const currentMonth = format(new Date(), 'MM');

    const [bankUserName, setBankUserName] = useState<string>("");
    const [bankCode, setBankCode] = useState<string>("");
    const [qrCode, setQrCode] = useState<string>("");
    const [amounty, setAmounty] = useState<string>("");
    const [previewImage, setPreviewImage] = useState<string>("");
    const [note, setNote] = useState<string>("");

    const [openPreview, setOpenPreview] = useState<boolean>(false);

    const currentMonthTransactions = transaction.filter(tx => {
        if (!tx.timestamp) return false;
        const txDate = parseISO(tx.timestamp);
        return isWithinInterval(txDate, { start: startOfCurrentMonth, end: endOfCurrentMonth });
    });

    useEffect(() => {
        const loadAll = async () => {
            if (!userInfo?.Id) return;

            try {
                setIsLoadingUser(true);
                const token = await GetAccessToken(userInfo.Id);
                if (token) {
                    setAccessToken(token);
                    await Promise.all([
                        handleGetUser(),
                        handleGetWallet(token),
                        handleGetTransaction(token)
                    ]);
                } else {
                    toast.error("Không lấy được token!");
                }
            } catch (error) {
                toast.error("Lỗi xác thực: " + error);
            } finally {
                setIsLoadingUser(false);
            }
        };

        loadAll();
    }, [userInfo?.Id]);

    useEffect(() => {
        axios.get('https://api.vietqr.io/v2/banks')
            .then(res => {
                if (res.data?.data) {
                    setBanks(res.data.data);
                }
            })
            .catch(err => {
                console.error('Không tải được danh sách ngân hàng', err);
            });
    }, []);

    useEffect(() => {
        if (openWithdrawMoney) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [openWithdrawMoney]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (bank: any) => {
        setSelectedBank(bank);
        setSearchTerm(bank.name);
        setOpen(false);
    };

    const filteredBanks = banks.filter((bank) => {
        const keyword = searchTerm.toLowerCase();
        return (
            bank.name.toLowerCase().includes(keyword) ||
            bank.code.toLowerCase().includes(keyword) ||
            (bank.shortName && bank.shortName.toLowerCase().includes(keyword))
        );
    });

    const handleGetUser = async () => {
        await axios.get(`${process.env.NEXT_PUBLIC_URL_API}Authen/GetUserById?userId=${userInfo?.Id}`)
            .then(res => {
                setUser(res.data.data);
            }).catch(err => {
                console.log(err);
            });
    }

    const chartData: ChartPoint[] = currentMonthTransactions
        .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map((tx: any) => ({
            x: format(new Date(tx.timestamp), "dd/MM"),
            y: tx.amount,
            transactionType: tx.transactionType,
            amount: tx.amount
        }));

    const handleGetTransaction = async (accessToken: string) => {
        try {
            const res = await axios.get(
                `${process.env.NEXT_PUBLIC_URL_API}PurchaseHistory/GetMyHistoryDynamic`,
                {
                    params: {
                        paymentMethod: "",
                        orderType: "",
                        pageNumber: 1,
                        pageSize: 20
                    },
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                }
            );

            const data = res.data?.data?.items || [];

            const mappedData = data.map((item: any) => {
                let type = "Giao dịch khác";
                let desc = "Giao dịch hệ thống";
                let amt = item.priceBot;

                if (item.orderType === 'Deposit' || item.paymentMethod === 'PayOS') {
                    type = "Tiền nạp";
                    desc = "Nạp tiền vào ví";
                    amt = Math.abs(amt);
                }
                else if (item.orderType === 'Withdraw' || item.paymentMethod === 'BankTransfer') {
                    type = "Tiền rút";
                    desc = "Rút tiền về tài khoản ngân hàng";
                    amt = -Math.abs(amt);
                }
                else if (item.orderType === 'BuyBot' || item.paymentMethod === 'Wallet') {
                    type = "Mua bot";
                    desc = `Thanh toán Bot ${item.nameBot || ''}`;
                    amt = -Math.abs(amt);
                }

                let status = "Unknown";
                const s = item.status?.toLowerCase() || "";
                if (s === 'paid' || s === 'success' || s === 'true') status = 'Success';
                else if (s === 'pending') status = 'Pending';
                else status = 'Failed';

                return {
                    id: item.id,
                    timestamp: item.date,
                    amount: amt,
                    transactionType: type,
                    description: desc,
                    transactionStatus: status
                };
            });

            setTransaction(mappedData);

        } catch (err) {
            console.log("Lỗi lấy lịch sử:", err);
        }
    }

    const handleGetWallet = async (accessToken: string) => {
        if (!accessToken) return;
        await axios.get(`${process.env.NEXT_PUBLIC_URL_API}Wallet/GetMoneyInWallet?userId=${userInfo?.Id}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        ).then(res => {
            setWallet(res.data.data);
        }).catch(err => {
            console.log(err);
        })
    }

    const width = 1100;
    const height = 180;
    const maxY = chartData.length > 0 ? Math.max(...chartData.map((d: any) => d.y)) : 0;
    const minY = chartData.length > 0 ? Math.min(...chartData.map((d: any) => d.y)) : 0;

    const generateSVGPath = (data: any) => {
        if (data.length === 0) return "";
        const scaleX = width / (data.length - 1);
        const range = maxY - minY === 0 ? 1 : maxY - minY;
        const scaleY = (value: any) => height - ((value - minY) / range) * height;

        let d = `M0,${scaleY(data[0].y)}`;
        data.forEach((point: any, i: number) => {
            const x = i * scaleX;
            const y = scaleY(point.y);
            d += ` L${x},${y}`;
        });
        return d;
    };

    const pathD = generateSVGPath(chartData);

    const hanldeRequestMoney = async () => {
        try {
            const isUsingQr = !!qrCode && !!previewImage;
            const finalBankName = selectedBank ? selectedBank.name : searchTerm;

            const payload = {
                bankName: finalBankName || "Không rõ",
                bankAmount: Number(amounty.replace(/\./g, "")) || 0,
                bankCode: isUsingQr ? "QR Code" : (bankCode?.trim() || "Không"),
                userBankName: isUsingQr ? "QR Code" : (bankUserName?.trim() || "Không"),
                qrCode: isUsingQr ? qrCode.trim() : "Không",
                note: note?.trim() || "Rút tiền về tài khoản",
                userId: userInfo.Id
            };

            if (!payload.bankAmount || payload.bankAmount <= 0) {
                toast.error("Số tiền không hợp lệ");
                return;
            }

            if (payload.bankAmount > (wallet?.balance || 0)) {
                toast.error("Số dư không đủ để rút");
                return;
            }

            if (!isUsingQr && (!payload.bankCode || payload.bankCode === "Không" || !payload.userBankName || payload.userBankName === "Không")) {
                toast.error("Vui lòng nhập Số tài khoản và Tên chủ tài khoản");
                return;
            }

            if (!isUsingQr && !finalBankName) {
                toast.error("Vui lòng chọn ngân hàng");
                return;
            }

            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_URL_API}Payment/RequestWithdrawMoney`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            if (res.data.status === 200 || res.data.success) {
                toast.success("Gửi yêu cầu rút tiền thành công");
                setOpenWithdrawMoney(false);
                setBankUserName("");
                setSearchTerm("");
                setSelectedBank(null);
                setAmounty("");
                setBankCode("");
                setQrCode("");
                setNote("");
                setPreviewImage("");

                handleGetWallet(accessToken);
                handleGetTransaction(accessToken);
            } else {
                toast.error(res.data.message || "Gửi yêu cầu thất bại");
            }
        } catch (err: any) {
            toast.error("Lỗi hệ thống: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#1C2129] font-sans text-slate-800 dark:text-white p-4 md:p-8 flex justify-center transition-colors duration-300">

            <div className="w-full max-w-6xl space-y-6">

                <div className="flex items-center justify-between pb-2">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ví Của Tôi</h1>
                        <p className="text-slate-500 dark:text-gray-400 text-sm">Quản lý chi tiêu cá nhân</p>
                    </div>
                    <button className="p-2 bg-white dark:bg-[#2A303C] border border-slate-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-slate-50 dark:hover:bg-[#323945] transition-colors text-slate-600 dark:text-gray-300">
                        <FaBell />
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    <div className="lg:col-span-7 flex flex-col h-full">
                        <div className="bg-linear-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg h-full flex flex-col justify-between min-h-[300px]">

                            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <div className="absolute bottom-0 left-0 w-40 h-40 bg-cyan-400 opacity-10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-medium text-blue-50 border border-white/10">
                                        <FaWallet /> Tài khoản chính
                                    </div>
                                    <button onClick={() => setIsVisible(!isVisible)} className="text-blue-100 hover:text-white transition-colors opacity-80 hover:opacity-100 cursor-pointer">
                                        {isVisible ? <FaEye /> : <FaEyeSlash />}
                                    </button>
                                </div>

                                <div className="mb-10">
                                    <div>
                                        <p className="text-blue-100 text-sm mb-1 font-medium opacity-80">Chủ tài khoản</p>
                                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                                            {user && (
                                                <div className="text-2xl uppercase font-bold">
                                                    {user.fullName}
                                                </div>
                                            )}
                                        </h2>
                                    </div>
                                    <div className="mt-10">
                                        <p className="text-blue-100 text-sm mb-1 font-medium opacity-80">Số dư khả dụng</p>
                                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                                            {isVisible
                                                ? wallet ? (
                                                    <div className="text-2xl font-bold">
                                                        {formatCurrency(wallet.balance)}
                                                    </div>
                                                ) : (
                                                    <div className="text-2xl font-bold text-emerald-300">
                                                        Chưa kích hoạt ví
                                                    </div>
                                                )
                                                : "*********"
                                            }
                                        </h2>
                                    </div>
                                </div>
                            </div>

                            <div className="relative z-10 grid grid-cols-2 gap-4 mt-auto">
                                <button onClick={() => router.push(`/wallet/mywallet/deposit`)} className="flex items-center justify-center gap-2 bg-white text-blue-700 py-3.5 rounded-xl font-bold transition-all hover:bg-blue-50 shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer">
                                    <FaArrowDown /> Nạp Tiền
                                </button>
                                <button
                                    onClick={() => setOpenWithdrawMoney(true)}
                                    className="flex items-center justify-center gap-2 bg-blue-800/50 hover:bg-blue-800 text-white py-3.5 rounded-xl font-bold backdrop-blur-sm transition-all border border-blue-400/30 active:scale-[0.98] cursor-pointer">
                                    <FaArrowUp /> Rút Tiền
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-5">
                        <div className="bg-white dark:bg-[#2A303C] rounded-3xl border border-slate-100 dark:border-gray-700 shadow-sm h-full flex flex-col overflow-hidden min-h-[300px]">
                            <div className="p-5 border-b border-slate-50 dark:border-gray-700 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-lg">
                                    <FaHistory className="text-slate-400" /> Biến động số dư
                                </h3>
                                <button className="text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-[#323945] px-3 py-1.5 rounded-lg transition-colors">Xem tất cả</button>
                            </div>

                            {transaction.length ? (
                                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar max-h-[400px]">
                                    <div className="space-y-1">
                                        {transaction.map((tx: any) => (
                                            <div key={tx.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-[#323945] transition-colors cursor-default">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 
                                                        ${tx.transactionType === 'Tiền nạp' ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                                                : (tx.transactionType === 'Tiền rút' || tx.transactionType === 'Mua bot') ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                                                    : 'bg-slate-50 text-slate-600 dark:bg-[#323945] dark:text-gray-400'
                                                            }`}
                                                    >
                                                        {tx.transactionType === 'Tiền nạp' && <FaArrowUp />}
                                                        {(tx.transactionType === 'Tiền rút') && <FaArrowDown />}
                                                        {(tx.transactionType === 'Mua bot') && <FaMinus />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-700 dark:text-gray-200 line-clamp-1">
                                                            {tx.description}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 dark:text-gray-500">
                                                            {formatDateFunc(tx.timestamp)}
                                                        </p>
                                                        {tx.transactionStatus === 'Success' && (
                                                            <p className="text-[11px] text-green-600 dark:text-green-400 font-semibold mt-0.5">
                                                                Thành công
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0 pl-2">
                                                    <p className={`text-sm font-bold ${tx.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                        {tx.amount > 0 ? '+' : ''}{new Intl.NumberFormat('vi-VN').format(tx.amount)}đ
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-10 flex items-center justify-center text-slate-400 dark:text-gray-500">Bạn chưa có giao dịch</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#2A303C] rounded-3xl border border-slate-100 dark:border-gray-700 shadow-sm p-6 md:p-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <FaChartBar className="text-blue-500" /> Biểu đồ chi tiêu
                            </h3>
                            <p className="text-sm text-slate-400 dark:text-gray-400 mt-1">Theo dõi biến động số dư trong tháng</p>
                        </div>
                        <div className="flex gap-1 bg-slate-100 dark:bg-[#323945] p-1 rounded-lg self-end sm:self-auto">
                            <button className="px-4 py-1.5 text-xs font-bold text-white bg-white dark:bg-[#2A303C] dark:text-white shadow-sm rounded-md">Tuần</button>
                            <button className="px-4 py-1.5 text-xs font-bold text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200">Tháng {currentMonth}</button>
                        </div>
                    </div>

                    {transaction.length > 0 && chartData.length > 0 ? (
                        <div className="relative h-56 w-full">
                            <div className="absolute inset-0 flex flex-col justify-between text-xs text-slate-300 dark:text-gray-600">
                                <div className="border-b border-slate-100 dark:border-gray-700 w-full h-0"></div>
                                <div className="border-b border-slate-100 dark:border-gray-700 w-full h-0"></div>
                                <div className="border-b border-slate-100 dark:border-gray-700 w-full h-0"></div>
                                <div className="border-b border-slate-100 dark:border-gray-700 w-full h-0"></div>
                                <div className="border-b border-slate-100 dark:border-gray-700 w-full h-0"></div>
                            </div>

                            <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" width={width} height={height}>
                                <path
                                    d={pathD}
                                    fill="none"
                                    stroke="#3b82f6"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                />
                                {chartData.map((p: any, i: number) => {
                                    const range = maxY - minY === 0 ? 1 : maxY - minY;
                                    const x = (i / (chartData.length - 1)) * width;
                                    const y = height - ((p.y - minY) / range) * height;

                                    return (
                                        <circle
                                            key={i}
                                            cx={x}
                                            cy={y}
                                            r="5"
                                            fill="#3b82f6"
                                            stroke="white"
                                            strokeWidth="2"
                                            onMouseEnter={() => setHoveredIndex(i)}
                                            onMouseLeave={() => setHoveredIndex(null)}
                                            className="dark:stroke-[#2A303C]"
                                        />
                                    );
                                })}
                            </svg>

                            {hoveredIndex !== null && chartData[hoveredIndex] && (
                                <div
                                    className="absolute w-fit bg-white dark:bg-[#323945] p-2 rounded-md shadow-lg text-xs text-center font-semibold pointer-events-none border border-slate-100 dark:border-gray-600 z-10 text-slate-800 dark:text-white"
                                    style={{
                                        left: `${(hoveredIndex / (chartData.length - 1)) * width}px`,
                                        top: `${height - ((chartData[hoveredIndex].y - minY) / (maxY - minY === 0 ? 1 : maxY - minY)) * height - 50}px`,
                                        transform: "translateX(-50%)"
                                    }}
                                >
                                    <div>{chartData[hoveredIndex].transactionType}</div>
                                    <div className={chartData[hoveredIndex].amount > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                                        {chartData[hoveredIndex].amount > 0 ? "+" : ""}{new Intl.NumberFormat('vi-VN').format(chartData[hoveredIndex].amount)}đ
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-slate-400 dark:text-gray-500 py-10">Bạn chưa thực hiện giao dịch</div>
                    )}
                </div>
            </div>

            {openWithdrawMoney && (
                <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => {
                            setOpenWithdrawMoney(false);
                            setBankUserName("");
                            setSearchTerm("");
                            setSelectedBank(null);
                            setAmounty("");
                            setBankCode("");
                            setQrCode("");
                            setNote("");
                            setPreviewImage("");
                        }}
                    ></div>

                    <div className="bg-white dark:bg-[#2A303C] w-full max-w-md rounded-2xl shadow-2xl relative z-10 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Yêu Cầu Rút Tiền</h2>
                            <button
                                onClick={() => {
                                    setOpenWithdrawMoney(false);
                                    setBankUserName("");
                                    setSearchTerm("");
                                    setSelectedBank(null);
                                    setAmounty("");
                                    setBankCode("");
                                    setQrCode("");
                                    setNote("");
                                    setPreviewImage("");
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition p-1 hover:bg-gray-100 dark:hover:bg-[#323945] rounded-full cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <form onSubmit={(e) => { e.preventDefault(); hanldeRequestMoney(); }} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1">Số tiền muốn rút <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input
                                            value={amounty}
                                            type="text"
                                            onChange={(e) => {
                                                const raw = e.target.value.replace(/\D/g, "");
                                                setAmounty(raw ? Number(raw).toLocaleString("vi-VN") : "");
                                            }}
                                            className="w-full p-3 pr-12 border border-slate-200 dark:border-gray-600 dark:bg-[#323945] dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-lg"
                                            placeholder="0"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">VNĐ</span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Số dư khả dụng: <span className="font-bold text-blue-600 dark:text-blue-400">{wallet ? formatCurrency(wallet.balance) : "0đ"}</span></p>
                                </div>

                                <div ref={containerRef} className="relative">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1">Ngân hàng thụ hưởng <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="Tìm ngân hàng..."
                                        value={searchTerm}
                                        onFocus={() => setOpen(true)}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setSelectedBank(null);
                                            setOpen(true);
                                        }}
                                        className="w-full p-3 border border-slate-200 dark:border-gray-600 dark:bg-[#323945] dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    />

                                    {open && (
                                        <div className="absolute top-full left-0 mt-1 w-full max-h-60 overflow-y-auto border border-slate-100 dark:border-gray-700 rounded-xl shadow-xl bg-white dark:bg-[#323945] z-50">
                                            {filteredBanks.length > 0 ? (
                                                filteredBanks.map((bank) => (
                                                    <div
                                                        key={bank.code}
                                                        onClick={() => handleSelect(bank)}
                                                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-[#404753] transition border-b border-gray-50 dark:border-gray-700 last:border-none"
                                                    >
                                                        <img src={bank.logo} className="w-10 h-10 object-contain p-1 bg-white border rounded-full" alt={bank.shortName} />
                                                        <div>
                                                            <p className="font-semibold text-sm text-slate-800 dark:text-white">{bank.shortName}</p>
                                                            <p className="text-xs text-slate-500 dark:text-gray-400 line-clamp-1">{bank.name}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-4 text-center text-slate-500 dark:text-gray-400 text-sm">Không tìm thấy ngân hàng</div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {!previewImage && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1">Số tài khoản <span className="text-red-500">*</span></label>
                                            <input
                                                value={bankCode}
                                                onChange={(e) => setBankCode(e.target.value)}
                                                type="text"
                                                className="w-full p-3 border border-slate-200 dark:border-gray-600 dark:bg-[#323945] dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                                placeholder="Nhập số tài khoản..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1">Tên chủ tài khoản (In hoa) <span className="text-red-500">*</span></label>
                                            <input
                                                value={bankUserName}
                                                onChange={(e) => {
                                                    const val = e.target.value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toUpperCase();
                                                    setBankUserName(val);
                                                }}
                                                type="text"
                                                className="w-full p-3 border border-slate-200 dark:border-gray-600 dark:bg-[#323945] dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="NGUYEN VAN A"
                                            />
                                        </div>
                                    </>
                                )}

                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="h-px bg-slate-200 dark:bg-gray-600 flex-1"></div>
                                        <span className="text-xs text-slate-400 dark:text-gray-500 font-medium">HOẶC DÙNG QR</span>
                                        <div className="h-px bg-slate-200 dark:bg-gray-600 flex-1"></div>
                                    </div>

                                    {!previewImage ? (
                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-[#323945] hover:border-blue-400 dark:hover:border-blue-500 transition group">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <p className="text-sm text-slate-500 dark:text-gray-400"><span className="font-semibold text-blue-600 dark:text-blue-400">Tải ảnh QR</span></p>
                                                <p className="text-xs text-slate-400 dark:text-gray-500">PNG, JPG</p>
                                            </div>
                                            <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const url = await handleUpload(file);
                                                    if (url) { setQrCode(url); setPreviewImage(url); }
                                                }
                                            }} />
                                        </label>
                                    ) : (
                                        <div className="relative group w-full h-48 bg-slate-100 dark:bg-[#323945] rounded-xl overflow-hidden border border-slate-200 dark:border-gray-600">
                                            <img src={previewImage} alt="QR Preview" className="w-full h-full object-contain" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                                                <button type="button" onClick={() => setOpenPreview(true)} className="p-2 bg-white rounded-full text-slate-800 hover:text-blue-600"><FaEye /></button>
                                                <button type="button" onClick={() => { setPreviewImage(""); setQrCode(""); }} className="p-2 bg-white rounded-full text-red-500 hover:bg-red-50">✕</button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-2 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setOpenWithdrawMoney(false);
                                            setBankUserName("");
                                            setSearchTerm("");
                                            setSelectedBank(null);
                                            setAmounty("");
                                            setBankCode("");
                                            setQrCode("");
                                            setNote("");
                                            setPreviewImage("");
                                        }}
                                        className="flex-1 py-3 bg-gray-100 dark:bg-[#323945] text-slate-600 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-[#404753] transition cursor-pointer"
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none transition transform active:scale-[0.98] cursor-pointer"
                                    >
                                        Gửi Yêu Cầu
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {openPreview && previewImage && (
                <div className="fixed inset-0 z-10000 bg-black/90 flex items-center justify-center p-4" onClick={() => setOpenPreview(false)}>
                    <img src={previewImage} className="max-w-full max-h-full rounded-lg shadow-2xl" alt="Full QR" />
                    <button className="absolute top-5 right-5 text-white text-3xl font-bold p-2 hover:bg-white/10 rounded-full">✕</button>
                </div>
            )}
        </div >
    );
};

export default MyWallet;