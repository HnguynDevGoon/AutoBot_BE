'use client';
import React, { useEffect, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { FaChrome, FaArrowRight, FaRocket, FaDiscord } from "react-icons/fa";
import { HiLightningBolt, HiOutlineCloudDownload } from "react-icons/hi";
import { RiSettings4Fill, RiShieldCheckFill } from "react-icons/ri";
import { useRouter } from "next/navigation";
import axios from "axios";

const Extension = () => {
    const router = useRouter();
    const otherType = 'nav-extension';
    const otherTypeGuid = 'guid-extension';
    const [listNav, setListNav] = useState<any>([]);
    const [listGuid, setListGuid] = useState<any>([]);

    const NAV_STYLES = [
        { icon: <HiLightningBolt />, color: "text-orange-600" },
        { icon: <RiSettings4Fill />, color: "text-indigo-600" },
        { icon: <RiShieldCheckFill />, color: "text-teal-600" },
        { icon: <FaDiscord />, color: "text-blue-600" },
    ];

    useEffect(() => {
        AOS.init({ duration: 1000, once: true });
    }, []);

    useEffect(() => {
        handleGetNavExtension(otherType);
        handleGetListGuid(otherTypeGuid);
    }, []);

    const handleGetNavExtension = async (otherType: string) => {
        axios.get(`${process.env.NEXT_PUBLIC_URL_API}OtherContent/GetByOtherType?otherType=${otherType}`)
            .then(res => {
                setListNav(res.data.data);
            }).catch(err => {
                console.log(err);
            })
    }

    const handleGetListGuid = async (otherType: string) => {
        axios.get(`${process.env.NEXT_PUBLIC_URL_API}OtherContent/GetByOtherType?otherType=${otherType}`)
            .then(res => {
                setListGuid(res.data.data);
                console.log(res.data.data);
            }).catch(err => {
                console.log(err);
            })
    }

    const formatStepNumber = (index: number) => {
        return (index + 1).toString().padStart(2, '0');
    };

    return (
        <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#1C2129] text-white selection:bg-blue-500/30 overflow-hidden font-sans">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 blur-[100px] rounded-full" />
            </div>

            <div className="relative z-10 container mx-auto px-6 lg:px-20 pt-24">

                {/* --- HERO SECTION --- */}
                <div className="grid lg:grid-cols-2 gap-16 items-center mb-40">
                    <div data-aos="fade-right">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                            Next-Gen Trading Extension
                        </div>
                        <h1 className="text-6xl lg:text-8xl text-gray-600 dark:text-white font-black tracking-tighter leading-[0.9] mb-8">
                            Giao dịch <br />
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-cyan-300 to-indigo-500">
                                Autobot
                            </span>
                        </h1>
                        <p className="text-slate-400 text-lg max-w-lg mb-10 leading-relaxed font-light">
                            Hỗ trợ giao dịch tự động trên VPS Smart Pro. Tối ưu chiến lược, chốt lời cắt lỗ trong tích tắc.
                        </p>

                        <a href="/assets/files/ext.rar" download
                            className="group relative inline-flex items-center gap-4 px-10 py-5 bg-blue-300 dark:bg-white text-black rounded-2xl font-black transition-all hover:bg-blue-600 hover:text-white hover:scale-105">
                            <HiOutlineCloudDownload className="text-2xl group-hover:animate-bounce" />
                            TẢI EXTENSION NGAY
                            <FaArrowRight className="text-sm opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                        </a>
                    </div>

                    <div className="relative" data-aos="zoom-in">
                        <div className="relative rounded-4xl border border-white/10 bg-slate-900/50 p-4 backdrop-blur-xl shadow-2xl">
                            <div className="flex gap-2 mb-4 pl-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                <div className="w-3 h-3 rounded-full bg-green-500/50" />
                            </div>
                            <div className="space-y-4 p-4">
                                <div className="h-8 bg-blue-500/20 rounded-lg w-3/4" />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="h-24 bg-white/5 rounded-xl animate-pulse" />
                                    <div className="h-24 bg-white/5 rounded-xl animate-pulse delay-75" />
                                </div>
                                <div className="h-32 bg-linear-to-t from-blue-500/10 to-transparent border border-blue-500/20 rounded-xl" />
                            </div>
                            <div className="absolute -top-6 -right-6 p-4 bg-blue-600 rounded-2xl shadow-xl animate-bounce">
                                <FaRocket className="text-2xl text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- FEATURES SECTION --- */}
                <div className="mb-40 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {listNav && listNav.length > 0 ? (
                        listNav.map((item: any, i: number) => {
                            const style = NAV_STYLES[i % NAV_STYLES.length];

                            return (
                                <div
                                    key={item.id || i}
                                    data-aos="fade-up"
                                    data-aos-delay={i * 100}
                                    className="group relative p-8 bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-white/5 rounded-[2.5rem] transition-all hover:bg-blue-50 dark:hover:bg-slate-700 hover:border-blue-500/30 shadow-sm hover:shadow-xl"
                                >
                                    <div className={`text-4xl mb-6 bg-linear-to-br ${style.color} bg-clip-text`}>
                                        {style.icon}
                                    </div>
                                    <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white uppercase tracking-tighter">
                                        {item.title}
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                        {item.description}
                                    </p>

                                    <div className="absolute top-4 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="w-1 h-1 rounded-full bg-blue-500 animate-ping" />
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-slate-500 col-span-4 text-center italic">Đang tải các tính năng...</p>
                    )}
                </div>

                <div className="bg-slate-100/50 dark:bg-slate-900/30 border border-gray-200 dark:border-white/5 rounded-[4rem] p-10 lg:p-20 relative overflow-hidden mb-20">
                    <h2 className="text-5xl font-black tracking-tighter mb-20 text-slate-900 dark:text-white" data-aos="fade-right">
                        HƯỚNG DẪN <span className="text-blue-500">CÀI ĐẶT</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                        {listGuid && listGuid.length > 0 ? (
                            listGuid.map((s: any, i: number) => (
                                <div key={s.id || i} className="group relative" data-aos="zoom-in" data-aos-delay={i * 100}>
                                    <div className="text-7xl font-black text-slate-200 dark:text-white/5 absolute -top-8 -left-4 group-hover:text-blue-500/20 transition-colors uppercase italic">
                                        {formatStepNumber(i)}
                                    </div>

                                    <h4 className="text-xl font-black mb-2 relative z-10 text-slate-900 dark:text-white uppercase">
                                        {s.title}
                                    </h4>
                                    <p className="text-slate-600 dark:text-slate-500 text-sm relative z-10">
                                        {s.description}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-500 col-span-4 text-center italic">Đang tải hướng dẫn...</p>
                        )}
                    </div>
                </div>

                <div className="relative py-20 flex overflow-hidden group select-none">
                    <div className="flex flex-nowrap shrink-0 items-center gap-10 min-w-full animate-[marquee_20s_linear_infinite]">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex shrink-0 items-center gap-10">
                                <span className="text-[8vw] font-black tracking-tighter text-slate-200 dark:text-white/5 hover:text-blue-500 transition-colors duration-500 uppercase">
                                    Autobot System Trading
                                </span>
                                <span className="text-5xl text-blue-600 font-black">•</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-nowrap shrink-0 items-center gap-10 min-w-full animate-[marquee_20s_linear_infinite]" aria-hidden="true">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex shrink-0 items-center gap-10">
                                <span className="text-[8vw] font-black tracking-tighter text-slate-200 dark:text-white/5 hover:text-blue-500 transition-colors duration-500 uppercase">
                                    Autobot System Trading
                                </span>
                                <span className="text-5xl text-blue-600 font-black">•</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 lg:px-20 pb-20">
                <div className="p-10 rounded-[3rem] bg-blue-600 flex flex-col lg:flex-row items-center justify-between gap-8 group cursor-pointer relative overflow-hidden">
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="w-16 h-16 bg-black rounded-3xl flex items-center justify-center text-3xl text-white shadow-2xl">
                            <FaChrome />
                        </div>
                        <h5 className="font-black text-2xl text-black">Bắt đầu giao dịch tự động ngay bây giờ</h5>
                    </div>
                    <button onClick={() => router.push(`https://smartpro.vps.com.vn/`)} className="relative z-10 px-10 py-4 bg-black text-white rounded-2xl font-black hover:scale-110 transition-transform cursor-pointer">
                        Đăng nhập Smart Pro
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Extension;