'use client';
import { MdKeyboardBackspace } from "react-icons/md";
import { InputOTPPattern } from "../shared/otp/input-otp-pattern";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { TfiEmail } from "react-icons/tfi";
import axios from "axios";
import { toast } from "sonner";
import { jwtDecode, JwtPayload } from "jwt-decode";
import Cookies from "js-cookie";
import { useDispatch } from "react-redux";
import { setUser } from "@/redux/slices/userSlice";
import { decryptEmail } from "@/utils/cryptoEmail";
import { maskEmail } from "../shared/maskemail/mask-email";
import { getDeviceFingerprint } from "@/utils/getDeviceFingerprint";
import Link from "next/link";

interface CustomJwtPayload extends JwtPayload {
    role: string;
}

const TwoStep = () => {
    const router = useRouter();
    const dispatch = useDispatch();
    const fingerprint = getDeviceFingerprint();
    const [email, setEmail] = useState<string>('');
    const [emailUser, setEmailUser] = useState<any>('');
    const [infoUser, setInfoUser] = useState<any>('');
    const [changeStep, setChangeStep] = useState<boolean>(false);
    const [otpValue, setOtpValue] = useState<string>("");
    const [countdown, setCountdown] = useState<number>(60);

    useEffect(() => {
        handleChangeEmailByIdentifier();
    }, []);

    const handleVerifyOTP = async () => {
        const res = await axios.post(`${process.env.NEXT_PUBLIC_URL_API}Authen/VerifyTwoStep`,
            {
                otp: otpValue,
                fingerprint
            });
        try {
            if (res.data.data) {
                const { accessToken, refreshToken } = res.data.data;
                const decoded: CustomJwtPayload = jwtDecode(accessToken);
                dispatch(setUser({
                    accessToken,
                    refreshToken,
                    userInfo: decoded
                }));
                router.push(decoded.role === "User" ? "/" : "/admin/dashboard");
                return;
            }
            setChangeStep(true);
        } catch (err) {
            toast.error('Mã OTP không đúng, vui lòng thử lại.');
        }
    }

    const handleChangeEmailByIdentifier = async () => {
        if (!process.env.NEXT_PUBLIC_SECRET_KEY) {
            console.error("Secret key is missing!");
            toast.error("Lỗi hệ thống, không thể gửi OTP!");
            return;
        }
        const encryptedEmail = Cookies.get("resendEmail");
        if (!encryptedEmail) {
            toast.error("Không tìm thấy email đã lưu!");
            return;
        }
        const decryptedEmail = decryptEmail(encryptedEmail);
        await axios.post(`${process.env.NEXT_PUBLIC_URL_API}Authen/GetEmailByIdentifier`, {
            identifier: decryptedEmail
        }).then(res => {
            setEmailUser(res.data.data.email);
        }).catch(err => {
            toast.error(err);
        })
    }

    useEffect(() => {
        if (otpValue.length === 6) {
            handleVerifyOTP();
        }
    }, [otpValue]);

    const handleSendCode = async () => {
        if (!process.env.NEXT_PUBLIC_SECRET_KEY) {
            toast.error("Lỗi hệ thống, không thể gửi OTP!");
            return;
        }

        try {
            const encryptedEmail = Cookies.get("resendEmail");
            if (!encryptedEmail) {
                toast.error("Không tìm thấy email đã lưu!");
                return;
            }
            const decryptedEmail = await decryptEmail(encryptedEmail);

            if (!decryptedEmail) {
                toast.error("Không tìm thấy email đã lưu!");
                return;
            }
            const res = await axios.post(`${process.env.NEXT_PUBLIC_URL_API}Authen/ResendOtpForTwoStep`, { identifier: decryptedEmail });

            if (res.status === 200) {
                toast.success("Đã gửi lại mã OTP.");
                setCountdown(60);
            }
        } catch (err) {
            console.log(err);
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
                        key={'key2'}
                        initial={{ opacity: 0, x: 80 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -80 }}
                        transition={{ duration: 0.4 }}
                        className="w-full max-w-sm lg:max-w-md bg-white dark:bg-[#1C2129] rounded-xl shadow-2xl p-8 sm:p-10 lg:p-12"
                    >
                        <div className="flex flex-col items-start text-left">
                            <TfiEmail className="text-5xl text-gray-400 mb-6" />

                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                Xác minh danh tính của bạn
                            </h2>

                            <p className="mt-4 text-sm text-gray-600 dark:text-white">
                                Nhập mã chúng tôi vừa gửi đến:
                            </p>

                            <p className="mt-1 font-semibold text-gray-700 dark:text-white">
                                {emailUser ? maskEmail(emailUser) : infoUser ? maskEmail(infoUser.email) : email}
                            </p>

                            <div className="mt-8 w-full flex flex-col items-center">
                                <InputOTPPattern value={otpValue} onChange={setOtpValue} />

                                <p className="mt-4 text-xs text-gray-500 dark:text-white text-center">
                                    Mã bạn đã nhập: <span className="font-semibold text-black dark:text-white">{otpValue}</span>
                                </p>

                                <div className="mt-8 space-y-2 text-center">
                                    <p className="text-xs text-gray-600 dark:text-white">Bạn không nhận được mã xác nhận?</p>
                                    <button
                                        onClick={handleSendCode}
                                        disabled={countdown > 0}
                                        className={`text-sm font-bold transition-colors ${countdown === 0
                                                ? "text-blue-500 hover:text-blue-600 cursor-pointer"
                                                : "text-black dark:text-white pointer-events-none"
                                            }`}
                                    >
                                        Gửi lại mã
                                    </button>

                                    {countdown > 0 && (
                                        <p className="text-xs text-gray-400">
                                            Gửi lại sau <span className="font-medium text-gray-600">{countdown}s</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="mt-10 mb-6 w-full h-px bg-gray-200"></div>

                            {/* Back Link - Căn trái theo bố cục mới */}
                            <div
                                onClick={() => router.back()}
                                className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-white hover:text-blue-500 cursor-pointer transition-colors"
                            >
                                <MdKeyboardBackspace className="text-lg" />
                                <span>Trở về trang trước</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

export default TwoStep;