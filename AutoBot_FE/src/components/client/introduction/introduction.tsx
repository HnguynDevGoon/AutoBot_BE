'use client';
import { useEffect, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { TbPigMoney, TbActivity, TbTargetArrow } from "react-icons/tb";
import { FaShieldAlt, FaLightbulb, FaLayerGroup } from "react-icons/fa";
import { IoIosSettings, IoIosTrendingUp, IoMdRocket } from "react-icons/io";
import axios from "axios";

const Introduction = () => {
    const otherType = 'vision-introduction';
    const otherTypeTech = 'technology-introduction';
    
    const [isLoadingVision, setIsLoadingVision] = useState(true);
    const [isLoadingTech, setIsLoadingTech] = useState(true);
    
    const [listVision, setListVision] = useState<any>([]);
    const [listTech, setListTech] = useState<any>([]);

    const VISION_STYLES = [
        { icon: <FaShieldAlt />, color: "text-emerald-500", bg: "bg-emerald-500/10", hoverBorder: "hover:border-emerald-500/50" },
        { icon: <IoIosSettings />, color: "text-blue-400", bg: "bg-blue-500/10", hoverBorder: "hover:border-blue-500/50" },
        { icon: <TbPigMoney />, color: "text-amber-500", bg: "bg-amber-500/10", hoverBorder: "hover:border-amber-500/50" },
        { icon: <FaLightbulb />, color: "text-white", bg: "bg-white/20", hoverBorder: "" }
    ];

    const TECH_COLORS = ["bg-red-500", "bg-blue-500", "bg-yellow-500"];

    useEffect(() => { AOS.init({ duration: 1200, once: true }); }, []);

    useEffect(() => {
        handleGetVision(otherType);
        handleGetTechnology(otherTypeTech);
    }, []);

    const handleGetVision = async (otherType: string) => {
        setIsLoadingVision(true);
        axios.get(`${process.env.NEXT_PUBLIC_URL_API}OtherContent/GetByOtherType?otherType=${otherType}`)
            .then(res => {
                setListVision(res.data.data);
            })
            .catch(err => console.log(err))
            .finally(() => setIsLoadingVision(false));
    }

    const handleGetTechnology = async (otherType: string) => {
        setIsLoadingTech(true);
        axios.get(`${process.env.NEXT_PUBLIC_URL_API}OtherContent/GetByOtherType?otherType=${otherType}`)
            .then(res => {
                setListTech(res.data.data);
            })
            .catch(err => console.log(err))
            .finally(() => setIsLoadingTech(false));
    }

    return (
        <div className="min-h-screen dark:bg-[#1C2129] bg-white text-white selection:bg-blue-500/30 overflow-hidden">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]" />
            </div>

            <section className="relative min-h-[90vh] flex items-center pt-20 px-6 lg:px-24">
                <div className="container mx-auto grid lg:grid-cols-12 gap-12 items-center">
                    <div className="lg:col-span-7 z-10" data-aos="zoom-out-right">
                        <div className="inline-block px-4 py-1.5 mb-6 rounded-full border border-blue-500/30 bg-blue-500/10 backdrop-blur-md">
                            <span className="text-blue-400 text-sm font-medium tracking-widest uppercase">Kỷ nguyên đầu tư AI 4.0</span>
                        </div>
                        <h1 className="text-5xl text-gray-600 dark:text-white lg:text-8xl font-black leading-[1.1] mb-8 tracking-tighter">
                            Đầu Tư <br />
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-cyan-400 to-indigo-500 animate-gradient-x">
                                Thông Minh Hơn
                            </span>
                        </h1>
                        <p className="text-lg lg:text-xl text-slate-400 leading-relaxed max-w-2xl mb-10 font-light">
                            Chúng tôi kết hợp sức mạnh của <span className="text-gray-600 dark:text-white font-medium border-b border-blue-500">Machine Learning</span> và dữ liệu <span className=" text-gray-600 dark:text-white font-medium border-b border-blue-500">Amibroker</span> để biến những con số vô hồn thành lợi nhuận thực tế.
                        </p>
                        <div className="flex gap-4">
                            <button className="px-10 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(37,99,235,0.4)]">
                                Bắt đầu ngay
                            </button>
                        </div>
                    </div>
                    <div className="lg:col-span-5 relative" data-aos="fade-left">
                        {/* VIDEO FRAME (Giữ nguyên) */}
                        <div className="relative z-10 group">
                            <div className="absolute -inset-1 bg-linear-to-r from-blue-600 to-cyan-500 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                            <div className="relative rounded-[2.5rem] border border-white/10 bg-[#0a0a0a] overflow-hidden shadow-2xl">
                                <video autoPlay loop muted playsInline className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-all duration-700 grayscale-20 group-hover:grayscale-0 scale-100 group-hover:scale-105">
                                    <source src="/assets/videos/botvideo.mp4" type="video/mp4" />
                                </video>
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>
                            </div>
                        </div>
                        {/* FLOATING CARD (Giữ nguyên) */}
                        <div className="absolute -bottom-6 -left-4 md:-bottom-10 md:-left-12 bg-[#050505]/80 backdrop-blur-xl p-5 pr-8 rounded-4xl border border-white/10 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] animate-[bounce_4s_infinite] flex items-center gap-5 z-20" data-aos="fade-up" data-aos-delay="500">
                            <div className="relative w-20 h-20 rounded-full bg-black border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.3)] overflow-hidden shrink-0">
                                <video autoPlay loop muted playsInline className="w-full h-full object-cover scale-110">
                                    <source src="/assets/videos/botvideo.mp4" type="video/mp4" />
                                </video>
                                <div className="absolute bottom-1 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-black animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">Live Signal</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-3xl font-black text-white leading-none tracking-tight">+89.4%</p>
                                    <IoIosTrendingUp className="text-green-400 text-xl animate-bounce" />
                                </div>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Accuracy Rate</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 2: VISION - CÓ SKELETON */}
            <section className="py-32 px-6 lg:px-24 relative">
                <div className="text-center mb-20" data-aos="fade-up">
                    <h2 className="text-4xl text-gray-600 dark:text-white lg:text-6xl font-bold tracking-tight">
                        Mục Tiêu <span className="text-blue-500">&</span> Tầm Nhìn
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                    {/* 3. Logic hiển thị Skeleton cho Vision */}
                    {isLoadingVision ? (
                        // SKELETON UI CHO VISION
                        <>
                            <div className="md:col-span-2 md:row-span-2 h-[400px] bg-slate-200 dark:bg-slate-800 rounded-[2.5rem] animate-pulse"></div>
                            <div className="h-[200px] bg-slate-200 dark:bg-slate-800 rounded-[2.5rem] animate-pulse"></div>
                            <div className="h-[200px] bg-slate-200 dark:bg-slate-800 rounded-[2.5rem] animate-pulse"></div>
                            <div className="md:col-span-2 h-[150px] bg-slate-200 dark:bg-slate-800 rounded-[2.5rem] animate-pulse"></div>
                        </>
                    ) : listVision && listVision.length > 0 ? (
                        // DỮ LIỆU THẬT
                        <>
                            {listVision[3] && (
                                <div className="md:col-span-2 md:row-span-2 p-10 rounded-[2.5rem] bg-linear-to-br from-blue-600 to-indigo-800 flex flex-col justify-between group overflow-hidden relative" data-aos="fade-right">
                                    <IoMdRocket className="absolute -right-10 -top-10 text-[250px] text-white/10 group-hover:rotate-12 transition-transform duration-700" />
                                    <div>
                                        <div className={`w-16 h-16 ${VISION_STYLES[3].bg} rounded-2xl flex items-center justify-center text-3xl mb-8 backdrop-blur-md`}>
                                            {VISION_STYLES[3].icon}
                                        </div>
                                        <h3 className="text-4xl font-bold mb-4">{listVision[3].title}</h3>
                                        <p className="text-blue-100/80 leading-relaxed text-lg max-w-xs">{listVision[3].description}</p>
                                    </div>
                                    <div className="mt-8 pt-8 border-t border-white/20">
                                        <span className="font-bold text-xl tracking-tighter italic">"In Math We Trust"</span>
                                    </div>
                                </div>
                            )}

                            {listVision[2] && (
                                <div className={`p-8 rounded-[2.5rem] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 ${VISION_STYLES[2].hoverBorder} transition-all group`} data-aos="fade-up">
                                    <div className={`w-12 h-12 ${VISION_STYLES[2].bg} rounded-xl flex items-center justify-center text-2xl ${VISION_STYLES[2].color} mb-6 group-hover:bg-amber-500 group-hover:text-black transition-all`}>
                                        {VISION_STYLES[2].icon}
                                    </div>
                                    <h4 className="text-xl text-gray-800 dark:text-white font-bold mb-2">{listVision[2].title}</h4>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">{listVision[2].description}</p>
                                </div>
                            )}

                            {listVision[0] && (
                                <div className={`p-8 rounded-[2.5rem] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 ${VISION_STYLES[0].hoverBorder} transition-all group`} data-aos="fade-up" data-aos-delay="100">
                                    <div className={`w-12 h-12 ${VISION_STYLES[0].bg} rounded-xl flex items-center justify-center text-2xl ${VISION_STYLES[0].color} mb-6 group-hover:bg-emerald-500 group-hover:text-black transition-all`}>
                                        {VISION_STYLES[0].icon}
                                    </div>
                                    <h4 className="text-xl text-gray-800 dark:text-white font-bold mb-2">{listVision[0].title}</h4>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">{listVision[0].description}</p>
                                </div>
                            )}

                            {listVision[1] && (
                                <div className={`md:col-span-2 p-8 rounded-[2.5rem] bg-white dark:bg-[#111] border border-slate-200 dark:border-white/5 flex items-center gap-8 group ${VISION_STYLES[1].hoverBorder}`} data-aos="fade-left">
                                    <div className={`w-20 h-20 ${VISION_STYLES[1].bg} rounded-full shrink-0 flex items-center justify-center text-4xl ${VISION_STYLES[1].color} group-hover:rotate-180 transition-all duration-700`}>
                                        {VISION_STYLES[1].icon}
                                    </div>
                                    <div>
                                        <h4 className="text-2xl text-gray-800 dark:text-white font-bold mb-2">{listVision[1].title}</h4>
                                        <p className="text-slate-500 dark:text-slate-400">{listVision[1].description}</p>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        // TRƯỜNG HỢP KHÔNG CÓ DỮ LIỆU
                        <div className="col-span-full text-center text-slate-500 py-10">
                            Không có dữ liệu tầm nhìn.
                        </div>
                    )}
                </div>
            </section>

            {/* SECTION 3: TECHNOLOGY - CÓ SKELETON */}
            <section className="py-32 bg-[#f5f5f5] dark:bg-[#1C2129] relative selection:bg-blue-500/30 overflow-hidden">
                <div className="container mx-auto px-6 lg:px-24">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <div className="space-y-12">
                            <div data-aos="fade-right">
                                <h2 className="text-4xl text-gray-600 dark:text-white lg:text-6xl font-bold mb-6">
                                    Lõi Công Nghệ <br />
                                    <span className="text-blue-500 text-3xl">Amibroker x AI</span>
                                </h2>
                                <p className="text-slate-400 text-lg">
                                    Chúng tôi không chỉ viết code, chúng tôi xây dựng một hệ sinh thái phân tích dữ liệu chuyên sâu.
                                </p>
                            </div>

                            <div className="space-y-6">
                                {/* 4. Logic hiển thị Skeleton cho Tech */}
                                {isLoadingTech ? (
                                    // SKELETON UI CHO TECH
                                    [1, 2, 3].map((i) => (
                                        <div key={i} className="p-6 rounded-2xl bg-slate-200 dark:bg-white/5 animate-pulse">
                                            <div className="flex items-center gap-4 mb-3">
                                                <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700" />
                                                <div className="h-6 w-1/3 bg-slate-300 dark:bg-slate-700 rounded"></div>
                                            </div>
                                            <div className="h-4 w-full bg-slate-300 dark:bg-slate-700 rounded"></div>
                                        </div>
                                    ))
                                ) : listTech && listTech.length > 0 ? (
                                    // DỮ LIỆU THẬT
                                    listTech.map((tech: any, idx: number) => (
                                        <div
                                            key={tech.id || idx}
                                            className="group p-6 rounded-2xl bg-white/5 border-l-4 border-transparent hover:border-blue-500 hover:bg-white/10 transition-all cursor-default"
                                            data-aos="fade-up"
                                            data-aos-delay={idx * 100}
                                        >
                                            <div className="flex items-center gap-4 mb-2">
                                                <div className={`w-3 h-3 rounded-full ${TECH_COLORS[idx % TECH_COLORS.length]} shadow-[0_0_10px_rgba(255,255,255,0.3)] animate-ping`} />
                                                <h4 className="text-xl text-gray-800 dark:text-white font-bold">
                                                    {tech.title}
                                                </h4>
                                            </div>
                                            <p className="text-slate-500 group-hover:text-slate-300 transition-colors">
                                                {tech.description}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    // TRƯỜNG HỢP KHÔNG CÓ DỮ LIỆU
                                    <p className="text-slate-500 italic">Đang cập nhật công nghệ...</p>
                                )}
                            </div>
                        </div>

                        {/* Phần hình ảnh minh họa (Giữ nguyên) */}
                        <div className="relative flex justify-center" data-aos="zoom-in">
                            <div className="w-[350px] h-[350px] lg:w-[500px] lg:h-[500px] rounded-full border border-blue-500/20 flex items-center justify-center relative">
                                <div className="absolute inset-0 border border-blue-500/10 rounded-full animate-spin-slow" />
                                <div className="absolute inset-10 border border-cyan-500/10 rounded-full animate-reverse-spin" />
                                <div className="z-10 bg-blue-600 w-32 h-32 rounded-3xl rotate-12 flex items-center justify-center text-5xl shadow-[0_0_50px_rgba(37,99,235,0.5)]">
                                    <TbActivity className="animate-pulse text-white" />
                                </div>
                                <div className="absolute top-10 right-10 p-4 dark:bg-slate-800 bg-white rounded-xl animate-float">
                                    <TbTargetArrow className="text-red-400 text-2xl" />
                                </div>
                                <div className="absolute bottom-10 left-10 p-4 dark:bg-slate-800 bg-white rounded-xl animate-float-delayed">
                                    <FaLayerGroup className="text-cyan-400 text-2xl" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-40 text-center relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15vw] font-black opacity-[0.02] whitespace-nowrap select-none">
                    ECOSYSTEM PRODUCTS
                </div>
                <div data-aos="fade-up">
                    <h2 className="text-5xl text-gray-800 dark:text-white lg:text-8xl font-black mb-6 italic tracking-tighter">
                        READY TO <span className="text-blue-600">TRADE?</span>
                    </h2>
                    <p className="text-slate-500 tracking-[0.5em] uppercase text-sm">Khám phá hệ sinh thái sản phẩm của chúng tôi</p>
                </div>
            </section>
        </div>
    );
};

export default Introduction;