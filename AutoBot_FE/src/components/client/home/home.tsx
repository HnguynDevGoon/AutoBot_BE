'use client';

import Image from "next/image";
import React, { useEffect, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { FaBolt, FaClock, FaStar, FaRocket, FaArrowRight, FaCalendarAlt } from "react-icons/fa";
import { IoIosWarning } from "react-icons/io";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { GetAccessToken } from "../../shared/token/accessToken";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { toast } from "sonner";
import { HiSignal } from "react-icons/hi2";
import { deductBalance, setBalance } from "@/redux/slices/walletSlice";

const Home = () => {
    const otherType = 'features-home';
    const router = useRouter();
    const dispatch = useDispatch();
    const userInfo = useSelector((state: RootState) => state.user.userInfo);
    const walletBalance = useSelector((state: RootState) => state.wallet.balance);

    const [currentPage, setCurrentPage] = useState<number>(1);
    const [listPriceBot, setListPriceBot] = useState<any>([]);
    const [listFeatures, setListFeatures] = useState<any>([]);
    const [accessToken, setAccessToken] = useState<string>("");
    const [reviews, setReviews] = useState<any>([]);

    const [listContent, setListContent] = useState<any>(null);

    useEffect(() => { AOS.init({ duration: 1200, once: true }); }, []);

    useEffect(() => {
        if (!userInfo?.Id) return;
        const initializeWallet = async () => {
            try {
                const token = await GetAccessToken(userInfo.Id);
                if (token) {
                    setAccessToken(token);
                    await handleGetWallet(token);
                }
            } catch (err) { }
        };
        initializeWallet();
    }, [userInfo?.Id]);

    useEffect(() => {
        handleGetListBot(currentPage);
        handleGetFeatures(otherType);
        handleGetReview();
        handleGetContent(1);
    }, []);


    const handleGetContent = async (page: number) => {
        await axios.get(`${process.env.NEXT_PUBLIC_URL_API}Content/GetListContent?pageSize=3&pageNumber=${page}`)
            .then(res => {
                setListContent(res.data.data);
            }).catch(err => {
                console.log(err);
            })
    }

    const handleGetListBot = async (page: number) => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_URL_API}BotTrading/GetListBot?pageSize=${process.env.NEXT_PUBLIC_PAGE_SIZE}&pageNumber=${page}`);

            const rawData = res.data?.data;
            const items = rawData?.items || [];

            const flatList = items.flatMap((bot: any) => {
                if (!bot?.priceOptions || !Array.isArray(bot.priceOptions)) {
                    return [];
                }

                return bot.priceOptions.map((price: any) => ({
                    botId: bot.id,
                    nameBot: bot.nameBot,
                    interestRate: bot.interestRate,
                    totalProfit: bot.totalProfit,
                    commandNumber: bot.commandNumber,
                    winRate: bot.winRate,
                    priceId: price.id,
                    month: price.month,
                    price: price.price,
                    discount: price.discount,
                    description: price.description
                }));
            });
            setListPriceBot(flatList);
        } catch (err) {
            console.error("Lỗi lấy danh sách bot:", err);
            setListPriceBot([]);
        }
    }

    const handleGetFeatures = async (otherType: string) => {
        axios.get(`${process.env.NEXT_PUBLIC_URL_API}OtherContent/GetByOtherType?otherType=${otherType}`)
            .then(res => {
                setListFeatures(res.data.data);
            }).catch(err => {
                console.log(err)
            })
    }


    const handleGetReview = async () => {
        axios.get(`${process.env.NEXT_PUBLIC_URL_API}Review/GetAllReviews`)
            .then(res => {
                setReviews(res.data.data);
            }).catch(err => {
                console.log(err);
            })
    }

    const handleBuyBot = async (bot: any) => {
        const accessToken = await GetAccessToken(userInfo?.Id);
        if (!accessToken) {
            Swal.fire({
                title: "Yêu cầu đăng nhập",
                text: "Vui lòng đăng nhập để thực hiện giao dịch",
                icon: "warning",
                confirmButtonText: "Đăng nhập ngay",
                confirmButtonColor: '#3b82f6',
            }).then((result) => {
                if (result.isConfirmed) router.push(`/auth/signin`);
            });
            return;
        }

        const finalPrice = bot.price - (bot.price * bot.discount / 100);

        Swal.fire({
            title: 'Chọn hình thức thanh toán',
            html: `
            <div class="text-left text-sm space-y-2">
                <p><b>Gói:</b> ${bot.nameBot}</p>
                <p><b>Cần thanh toán:</b> <span class="text-blue-600 font-bold">${finalPrice.toLocaleString()} VNĐ</span></p>
                <p><b>Số dư ví:</b> ${walletBalance?.toLocaleString() || 0} VNĐ</p>
            </div>
        `,
            imageUrl: "/assets/images/logo.png",
            imageWidth: 80,
            imageHeight: 80,
            imageAlt: "Bot Logo",
            showDenyButton: true,
            confirmButtonText: 'Ví điện tử',
            denyButtonText: 'Quét mã QR',
            confirmButtonColor: '#3b82f6',
            denyButtonColor: '#8b5cf6',
        }).then(async (result) => {
            if (result.isConfirmed) {
                if (walletBalance && walletBalance >= finalPrice) {
                    await handleBuyWithWallet(bot);
                    dispatch(deductBalance(finalPrice));
                } else {
                    Swal.fire("Số dư không đủ", "Vui lòng nạp thêm tiền hoặc chọn quét mã QR", "error");
                }
            } else if (result.isDenied) {
                handleCreatePaymentLink(bot);
            }
        });
    };

    const handleBuyWithWallet = async (bot: any) => {
        await axios.post(`${process.env.NEXT_PUBLIC_URL_API}Payment/BuyBotByWallet`, {
            userId: userInfo?.Id, botTradingId: bot?.botId, priceBotId: bot?.priceId
        }, { headers: { 'Authorization': `Bearer ${accessToken}` } }).then(() => toast.success('Kích hoạt Bot thành công!'));
    }

    const handleCreatePaymentLink = async (bot: any) => {
        await axios.post(`${process.env.NEXT_PUBLIC_URL_API}Payment/CreateBuyBotLink`, {
            userId: userInfo?.Id, botTradingId: bot?.botId, priceBotId: bot?.priceId
        }, { headers: { 'Authorization': `Bearer ${accessToken}` } }).then(res => {
            const paymentUrl = res?.data?.data;
            if (paymentUrl) router.push(paymentUrl);
        })
    }

    const handleGetWallet = async (accessToken: string) => {
        await axios.get(`${process.env.NEXT_PUBLIC_URL_API}Wallet/GetMoneyInWallet?userId=${userInfo?.Id}`,
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
        ).then(res => { dispatch(setBalance(res.data.data.balance)); })
    }

    return (
        <div className="bg-slate-50 dark:bg-[#1C2129] text-slate-900 dark:text-white selection:bg-blue-500/30 overflow-hidden font-sans transition-colors duration-300">
            <section className="relative min-h-screen flex items-center justify-center pt-20">
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none overflow-hidden">
                    <h2 className="text-[25vw] font-black whitespace-nowrap animate-[marquee_30s_linear_infinite] text-black dark:text-white">
                        QUANTUM ALGO TRADING • QUANTUM ALGO TRADING •
                    </h2>
                </div>
                <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
                    <div data-aos="zoom-out-right">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="h-[3px] w-12 bg-blue-600"></span>
                            <span className="text-blue-600 dark:text-blue-400 font-bold tracking-[0.3em] uppercase text-xs">The Future of Investing</span>
                        </div>
                        <h1 className="text-5xl lg:text-[6.5rem] font-black leading-[0.85] tracking-tighter mb-8 italic text-slate-900 dark:text-white">
                            AUTOBOT <br />
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 via-indigo-500 to-cyan-500 dark:from-blue-400 dark:via-indigo-400 dark:to-cyan-400">
                                SYSTEM.
                            </span>
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 text-lg lg:text-xl max-w-lg mb-12 font-medium dark:font-light leading-relaxed">
                            Khai thác sức mạnh của thuật toán <span className="text-blue-600 dark:text-white font-bold underline decoration-blue-500/50">Machine Learning</span> để biến biến động thị trường thành dòng tiền ổn định.
                        </p>
                        <div className="flex gap-6">
                            <button className="px-12 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-black text-lg shadow-xl shadow-blue-600/20 dark:shadow-[0_0_40px_rgba(37,99,235,0.4)] hover:scale-110 transition-all active:scale-95 flex items-center gap-3">
                                <FaRocket /> BẮT ĐẦU NGAY
                            </button>
                        </div>
                    </div>
                    <div className="relative group" data-aos="fade-left">
                        <div className="absolute -inset-4 bg-blue-500/10 dark:bg-blue-500/20 blur-[60px] dark:blur-[100px] rounded-full animate-pulse"></div>
                        <div className="relative p-2 bg-white dark:bg-white/5 rounded-[3rem] border border-slate-200 dark:border-white/10 backdrop-blur-3xl overflow-hidden shadow-2xl dark:shadow-none">
                            <Image
                                src="/assets/images/home/herosection.jpg"
                                alt="Trading" width={1000} height={600}
                                className="rounded-[2.5rem] opacity-90 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105 h-[500px] object-cover"
                            />
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-0 dark:opacity-20 pointer-events-none"></div>
                        </div>
                    </div>
                </div>
            </section>
            <section className="py-32 container mx-auto px-6">
                <div className="flex flex-col md:flex-row items-center justify-center mb-16 gap-4">
                    <div data-aos="fade-up">
                        <h2 className="text-center text-5xl lg:text-6xl font-black italic tracking-tighter text-slate-900 dark:text-white mb-4">
                            TIN TỨC <span className="text-blue-600">THỊ TRƯỜNG</span>
                        </h2>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {listContent && listContent.items.length > 0 ? (
                        listContent.items.map((news: any, index: number) => (
                            <div
                                key={index}
                                className="group bg-white dark:bg-[#252A33] border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 flex flex-col h-full cursor-pointer"
                                data-aos="fade-up"
                                data-aos-delay={index * 100}
                            >
                                <div className="h-56 overflow-hidden relative">
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all z-10"></div>
                                    <Image
                                        src={news.urlAvatar || "/assets/images/placeholder.jpg"} // Fallback nếu không có ảnh
                                        alt={news.title}
                                        width={500}
                                        height={300}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                </div>

                                <div className="p-8 flex flex-col grow">
                                    <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-500 transition-colors">
                                        {news.title}
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-3 mb-6 grow leading-relaxed">
                                        {news.description}
                                    </p>
                                    <a
                                        href={news.Link || "#"}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mt-auto"
                                    >
                                        Đọc tiếp <FaArrowRight className="text-blue-600 dark:text-blue-400 group-hover:translate-x-2 transition-transform" />
                                    </a>
                                </div>
                            </div>
                        ))
                    ) : (
                        (!accessToken && !userInfo?.Id) ? (
                            <div className="col-span-full text-center py-10  rounded-3xl">
                                <p className="text-slate-500">Không có dữ liệu.</p>
                            </div>
                        ) : (
                            [1, 2, 3].map((i) => (
                                <div key={i} className="rounded-[2.5rem] bg-slate-200 dark:bg-white/5 h-[450px] animate-pulse"></div>
                            ))
                        )
                    )}
                </div>
            </section>

            {/* 3. PULSE WAVE TIMELINE */}
            <section className="py-32 bg-slate-100 dark:bg-[#1C2129] relative overflow-hidden transition-colors duration-300">
                <div className="container mx-auto px-6">
                    <h2 className="text-center text-6xl md:text-7xl font-black italic tracking-tighter mb-32 text-slate-900 dark:text-white" data-aos="fade-up">
                        FEATURES <span className="text-blue-600">24/7</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
                        {/* Line Connect */}
                        <div className="hidden lg:block absolute top-1/2 left-0 w-full h-.5 bg-linear-to-r from-transparent via-blue-500/30 to-transparent -translate-y-1/2"></div>

                        {/* Đổ data từ listFeatures */}
                        {listFeatures && listFeatures.length > 0 ? (
                            listFeatures.map((item: any, i: number) => {
                                const styleMap = [
                                    { icon: <HiSignal />, color: "text-red-500", bg: "bg-red-50 dark:bg-slate-900" },
                                    { icon: <IoIosWarning />, color: "text-amber-500", bg: "bg-amber-50 dark:bg-slate-900" },
                                    { icon: <FaClock />, color: "text-sky-500", bg: "bg-sky-50 dark:bg-slate-900" },
                                    { icon: <FaBolt />, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-slate-900" }
                                ];
                                const style = styleMap[i % styleMap.length];

                                return (
                                    <div key={item.id || i} className="relative z-10 group h-full" data-aos="fade-up" data-aos-delay={i * 150}>
                                        <div className="bg-white dark:bg-[#252A33] border border-slate-200 dark:border-white/5 p-10 rounded-[3rem] hover:-translate-y-4 h-full flex flex-col items-center text-center shadow-lg hover:shadow-2xl transition-all duration-300">
                                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-lg ${style.bg} ${style.color}`}>
                                                {style.icon}
                                            </div>
                                            <h4 className="text-xl font-black mb-2 italic uppercase tracking-tighter text-slate-900 dark:text-white">
                                                {item.title}
                                            </h4>
                                            <div className="h-1 w-12 bg-blue-600 rounded-full mb-4"></div>
                                            <p className="text-slate-600 dark:text-slate-500 text-sm italic font-medium">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-center col-span-4 opacity-50">Không có dữ liệu.</p>
                        )}
                    </div>
                </div>
            </section>

            {/* 4. PRICING PLANS */}
            <section className="py-24 relative px-6">
                <h2 className="text-center text-6xl md:text-9xl font-black mb-24 tracking-tighter opacity-5 uppercase absolute top-10 left-1/2 -translate-x-1/2 select-none w-full pointer-events-none text-slate-900 dark:text-white">
                    Pricing Plans
                </h2>
                <h3 className="text-center text-4xl md:text-5xl font-black mb-16 relative z-10 italic text-slate-900 dark:text-white">
                    BẢNG GIÁ <span className="text-blue-600">DỊCH VỤ</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
                    {listPriceBot.length > 0 ?
                        listPriceBot.map((bot: any, index: number) => (
                            <div
                                key={index}
                                onClick={() => handleBuyBot(bot)}
                                className="group relative bg-white dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 p-6 lg:p-8 rounded-[2.5rem] hover:bg-blue-400 dark:hover:bg-blue-600 transition-all duration-500 cursor-pointer overflow-hidden shadow-xl dark:shadow-2xl flex flex-col justify-between h-full min-h-[500px]"
                                data-aos="fade-up"
                                data-aos-delay={index * 100}
                            >
                                <div className="absolute inset-0 bg-linear-to-br dark:from-blue-500 dark:to-indigo-700 from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
                                {bot.discount !== 0 && (
                                    <div className="absolute top-6 right-6 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full animate-pulse shadow-lg z-20 tracking-wider">
                                        -{bot.discount}%
                                    </div>
                                )}
                                <div>
                                    <div className="flex flex-col items-start mb-6">
                                        <div className="w-14 h-14 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-black/20 transition-colors border border-slate-200 dark:border-white/10 shadow-inner">
                                            <Image
                                                src="/assets/images/logo.png"
                                                width={35} height={35}
                                                alt="logo"
                                                className="group-hover:rotate-360 transition-transform duration-700 brightness-150"
                                            />
                                        </div>
                                        <h4 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-white leading-none mb-3">
                                            {bot.nameBot}
                                        </h4>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-black tracking-tighter text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors">
                                                {new Intl.NumberFormat("vi-VN").format((bot.price) - (bot.price * bot.discount / 100))}₫
                                            </span>
                                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-blue-200">/ {bot.month} tháng</span>
                                        </div>
                                    </div>
                                    <div className="h-px w-full bg-slate-200 dark:bg-white/10 mb-6 group-hover:bg-white/20 transition-colors"></div>
                                    <div className="space-y-3 mb-8">
                                        {[
                                            { l: "Lãi suất", v: `${bot.interestRate}%/th`, c: "text-emerald-500 dark:text-emerald-400 font-bold" },
                                            { l: "Tỉ lệ thắng", v: `${bot.winRate}%`, c: "text-blue-500 dark:text-blue-400 font-bold" },
                                            { l: "Lợi nhuận", v: `${bot.totalProfit}%`, c: "text-slate-900 dark:text-white font-bold" },
                                            { l: "Số lệnh", v: `${bot.commandNumber} lệnh`, c: "text-slate-500 dark:text-slate-300" }
                                        ].map((s, i) => (
                                            <div key={i} className="flex justify-between items-center text-sm">
                                                <span className="text-slate-500 dark:text-slate-400 group-hover:text-blue-100 font-medium">{s.l}</span>
                                                <span className={`${s.c} group-hover:text-white transition-colors tracking-wide`}>{s.v}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <button className="w-full py-3.5 bg-slate-900 dark:bg-white text-white dark:text-black font-black text-sm rounded-xl group-hover:bg-black group-hover:text-white transition-all active:scale-95 shadow-lg mt-auto uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer">
                                    <FaBolt className="text-yellow-400 dark:text-blue-600 group-hover:text-yellow-400 transition-colors" /> Kích Hoạt Ngay
                                </button>
                            </div>
                        )) : (
                            <div className="col-span-full text-center">Không có dữ liệu.</div>
                        )}
                </div>
            </section>
            <section className="py-32 bg-slate-100 dark:bg-[#1C2129] overflow-hidden transition-colors duration-300">
                <div className="container mx-auto px-6 mb-20">
                    <h2 className="text-center text-5xl font-black italic text-slate-900 dark:text-white">
                        ĐÁNH GIÁ <span className="text-blue-600">KHÁCH HÀNG</span>
                    </h2>
                </div>

                <div className="relative w-full flex overflow-hidden group select-none mask-gradient">
                    <div className="flex animate-marquee-slow group-hover:paused items-stretch gap-8 pl-8">
                        {/* THÊM KIỂM TRA: Chỉ chạy map nếu reviews là một mảng và có phần tử */}
                        {Array.isArray(reviews) && reviews.length > 0 ? (
                            reviews.map((item: any, index: number) => {
                                const rating = Math.min(5, Math.max(0, Number(item.rate) || 0));
                                return (
                                    <div key={index} className="w-[400px] md:w-[500px] shrink-0 p-10 rounded-[3rem] bg-white dark:bg-[#252A33] border border-slate-200 dark:border-white/5 hover:border-blue-500/40 transition-all flex flex-col justify-between h-full relative shadow-lg">
                                        <span className="absolute top-6 right-8 text-8xl font-serif text-slate-100 dark:text-white/5 pointer-events-none">"</span>

                                        <div>
                                            <div className="flex gap-1 mb-8">
                                                {[...Array(5)].map((_, i) => (
                                                    <FaStar
                                                        key={i}
                                                        className={i < rating ? "text-blue-500 text-xl" : "text-slate-300 dark:text-slate-700 text-xl"}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-300 italic font-medium leading-relaxed line-clamp-5 font-sans text-lg relative z-10">
                                                "{item.description || "Dịch vụ tuyệt vời, tôi rất hài lòng với chất lượng tại đây!"}"
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-5 mt-10 pt-8 border-t border-slate-100 dark:border-white/5">
                                            <img
                                                src={item.urlAvatar || "/assets/images/default-avatar.png"}
                                                className="w-16 h-16 rounded-full border-2 border-blue-500 object-cover shadow-lg"
                                                alt={item.fullName || "User"}
                                            />
                                            <div>
                                                <h5 className="font-black text-lg uppercase tracking-tighter text-slate-900 dark:text-white">
                                                    {item.fullName || "Khách hàng"}
                                                </h5>
                                                <p className="text-xs text-slate-500 font-bold tracking-widest uppercase">Verified Trader</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            /* HIỂN THỊ KHI ĐANG TẢI HOẶC KHÔNG CÓ DỮ LIỆU */
                            <div className="flex gap-8">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="w-[400px] h-[300px] bg-slate-200 dark:bg-white/5 rounded-[3rem] animate-pulse" />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;