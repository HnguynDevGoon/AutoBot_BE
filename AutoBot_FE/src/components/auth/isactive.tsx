'use client';
import Image from "next/image";
import { motion } from "framer-motion";
import { InputOTPPattern } from "../shared/otp/input-otp-pattern";
import { useEffect, useState } from "react";
import { MdKeyboardBackspace } from "react-icons/md";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { decryptEmail } from "@/utils/cryptoEmail";
import Cookies from "js-cookie";
import { maskEmail } from "../shared/maskemail/mask-email";
import Link from "next/link";

const Active = () => {
    const router = useRouter();
    const [otpValue, setOtpValue] = useState<string>("");
    const [countdown, setCountdown] = useState(60);
    const encryptedEmail = Cookies.get("resendEmail") || "";
    const decryptedEmail = decryptEmail(encryptedEmail) || "";

    useEffect(() => {
        if (otpValue.length === 6) {
            handleVerify();
        }
    }, [otpValue]);

    const handleVerify = async () => {
        const result = await axios.post(`${process.env.NEXT_PUBLIC_URL_API}Authen/AccountVerification`, {
            code: otpValue,
        });
        if (result.data.status === 200) {
            toast.success(`${result.data.message}`);
            router.push("/auth/signin");
        } else {
            toast.error(`${result.data.message}`);
        }
    }

    const handleSendPass = async () => {
        if (!process.env.NEXT_PUBLIC_SECRET_KEY) {
            toast.error("Lỗi hệ thống, không thể gửi OTP!");
            return;
        }

        if (!encryptedEmail) {
            toast.error("Không tìm thấy email đã lưu!");
            return;
        }
        try {

            if (!decryptedEmail) {
                toast.error("Không tìm thấy email đã lưu!");
                return;
            }
            const res = await axios.post(`${process.env.NEXT_PUBLIC_URL_API}Authen/ResendOtpForCreateUser`, { identifier: decryptedEmail });

            if (res.status === 200) {
                toast.success("Đã gửi lại mã OTP.");
                setCountdown(60);
            }
        } catch (err) {
            toast.error("Gửi OTP thất bại!");
        }
    };


    useEffect(() => {
        if (countdown === 0) return;
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [countdown]);

    return (
        <div className="min-h-screen bg-[#111827]">
            <div className="relative w-full h-screen max-h-full flex justify-center items-center">
                <Image
                    loading="lazy"
                    src="/assets/images/home/bg.jpg"
                    alt="Trading Background"
                    fill
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
                <div className="relative z-20 flex items-center lg:justify-center w-full h-full p-4 lg:px-16 lg:gap-x-20">
                    <div className="hidden lg:flex flex-col justify-center w-1/2 max-w-lg px-0 space-y-6">
                        <Link
                            href={"/"}
                            className="text-white text-sm font-medium border border-gray-500/50 py-2 px-4 rounded-full w-fit hover:bg-white/10 transition duration-300"
                        >
                            Trang chủ
                        </Link>
                        <h1 className="text-white text-4xl xl:text-4xl lg:text-4xl font-extrabold leading-snug">
                            Giao Dịch Thông Minh, <br />Tiếp Cận Cơ Hội
                        </h1>
                        <p className="text-gray-300 text-lg italic">
                            “Chứng khoán tự động, lợi nhuận chủ động”
                        </p>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, x: 80 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -80 }}

                        transition={{ duration: 0.4 }}
                        className="w-[31.8%] bg-white dark:bg-[#1C2129] rounded-2xl py-3 p-8"
                    >
                        <div>
                            <div className="py-12 pl-5 pr-10">
                                <div className="text-2xl font-semibold">Kích hoạt tài khoản</div>
                                <div className="mt-5 space-y-4">
                                    <div className="text-xs">
                                        Mã xác thực đã được gửi qua địa chỉ Email{" "}
                                        <span className="font-semibold">
                                            {decryptedEmail ? maskEmail(decryptedEmail) : ""}
                                        </span>
                                        , vui lòng đợi trong ít phút.
                                    </div>
                                    <div>
                                        <label className="text-xs">Mã xác thực</label>
                                        <div className="mt-1">
                                            <InputOTPPattern value={otpValue} onChange={setOtpValue} />
                                        </div>
                                        <div className="mt-3 text-xs text-center"> Mã bạn đã nhập: <span className="font-semibold">{otpValue}</span></div>
                                        <div className="text-center">
                                            <div className="mt-5 text-xs">Bạn không nhận được mã xác nhận?</div>
                                            <div onClick={handleSendPass}
                                                className={`text-sm font-semibold cursor-pointer ${countdown === 0
                                                    ? "text-blue-500"
                                                    : "text-black dark:text-white pointer-events-none"
                                                    }`}
                                            >
                                                Gửi lại mã
                                            </div>

                                            {countdown > 0 && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Bạn có thể gửi lại sau {countdown}s
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-20 w-full h-px bg-gray-500"></div>
                                    <div onClick={() => router.push('/auth/signin')} className="text-xs font-medium flex gap-1 items-center hover:underline cursor-pointer">
                                        <MdKeyboardBackspace />
                                        <div>Trở về trang trước</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

export default Active;