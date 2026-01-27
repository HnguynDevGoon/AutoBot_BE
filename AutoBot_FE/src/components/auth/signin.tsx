'use client';

import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { jwtDecode, JwtPayload } from "jwt-decode";
import Cookies from "js-cookie";
import { useDispatch } from "react-redux";
import { setUser } from "@/redux/slices/userSlice";
import GoogleLoginButton from "./googlelogin";
import CryptoJS from "crypto-js";
import { encryptEmail } from "@/utils/cryptoEmail";
import { getDeviceFingerprint } from "@/utils/getDeviceFingerprint";
import { isEmailValid, isPasswordValid, isPhoneNumberValid, isUserNameValid } from "../shared/validator/checkform";

interface CustomJwtPayload extends JwtPayload {
    role: string;
}

const Signin = () => {
    const router = useRouter();
    const dispatch = useDispatch();
    const fingerprint = getDeviceFingerprint();
    const [email, setEmail] = useState<string>('');
    const [errEmail, setErrEmail] = useState<boolean>(false);
    const [password, setPassword] = useState<string>('');
    const [errPassword, setErrPassword] = useState<boolean>(false);
    const [agree, setAgree] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [errPhoneNumber, setErrPhoneNumber] = useState<boolean>(false);
    const [userName, setUserName] = useState<string>('');
    const [errUserName, setErroUserName] = useState<boolean>(false);
    const [showRegion, setShowRegion] = useState<boolean>(false);
    const encryptedEmail = encryptEmail(email);
    const [loading, setLoading] = useState<boolean>(false);
    const [isMounted, setIsMounted] = useState<boolean>(false);

    useEffect(() => {
        if (/^[0-9]/.test(email)) {
            setShowRegion(true);
        } else if (/^[a-zA-Z]/.test(email)) {
            setShowRegion(false);
        } else if (email === "") {
            setShowRegion(false);
            setShowPassword(false);
        }
    }, [email]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleLogin = async () => {
        let hasError = false;

        !email
            ? (toast.error('Vui lòng nhập địa chỉ email hoặc số điện thoại'),
                setErrEmail(true),
                hasError = true)
            : isEmailValid(email)
                ? (setErrEmail(false),
                    setUserName(email),
                    setErroUserName(false),
                    setErrPhoneNumber(false))
                : isPhoneNumberValid(email)
                    ? (setPhoneNumber(email),
                        setErrEmail(false),
                        setErrPhoneNumber(false),
                        setErroUserName(false))
                    : isUserNameValid(email)
                        ? (setUserName(email),
                            setErroUserName(false),
                            setErrEmail(false),
                            setErrPhoneNumber(false))
                        : (toast.error('Địa chỉ email, số điện thoại hoặc tên đăng nhập không hợp lệ.'),
                            setErrEmail(true),
                            hasError = true);


        !password
            ? (toast.error('Vui lòng nhập mật khẩu'), setErrPassword(true), hasError = true)
            : !isPasswordValid(password)
                ? (toast.error('Mật khẩu phải có ít nhất 8 ký tự.'), setErrPassword(true), hasError = true)
                : setErrPassword(false);

        !agree && (toast.error('Vui lòng xác nhận đủ 18 tuổi và đồng ý điều khoản.'), hasError = true);

        if (hasError) return;
        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_URL_API}Authen/UserLogin`, {
                loginIdentifier: email,
                passWord: password,
                fingerprint
            });
            const result = res.data;
            if (result.status === 200) {
                const { accessToken, refreshToken } = result.data;
                const decoded: CustomJwtPayload = jwtDecode(accessToken);
                dispatch(setUser({
                    accessToken,
                    refreshToken,
                    userInfo: decoded
                }));
                if (accessToken && decoded.role === "User" && isMounted) {
                    let guestId: any = localStorage.getItem("guestId");
                    handleSyncChat(guestId, accessToken);
                }
                decoded.role === "User" ? router.push("/") : router.push("/admin/dashboard");
            } else if (result.status === 401) {
                if (encryptedEmail) {
                    Cookies.set("resendEmail", encryptedEmail, { expires: 7 });
                }
                router.push(`/auth/active`);
            } else if (result.status === 412) {
                if (encryptedEmail) {
                    Cookies.set("resendEmail", encryptedEmail, { expires: 7 });
                }
                router.push(`/auth/twostep`);
            } else {
                toast.error("Đăng nhập thất bại.");
            }
        } catch (err: any) {
            toast.error('Tài khoản hoặc mật khẩu sai, vui lòng thử lại');
        }
    }

    const handleSyncChat = async (guestId: string, accessToken: string) => {
        await axios.post(`${process.env.NEXT_PUBLIC_URL_API}Chat/SyncChat`, {
            guestId,
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
    };

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
                        className="w-full max-w-sm lg:max-w-md bg-white dark:bg-[#1C2129] rounded-xl shadow-2xl p-8 sm:p-10 lg:p-12"
                    >
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleLogin();
                        }}>
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center">Đăng nhập</h2>

                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="login-identifier" className="text-sm font-medium text-gray-700 dark:text-white block mb-1">
                                            Email, Username hoặc SĐT
                                        </label>
                                        <div className="relative">
                                            {showRegion && (
                                                <div className="absolute left-0 top-0 bottom-0 flex items-center text-black dark:text-white rounded-l-lg border-r pr-2 pl-3">
                                                    <Image
                                                        src={`/assets/images/signup/flagvn.webp`}
                                                        width={20}
                                                        height={20}
                                                        alt="Vietnam"
                                                        className="w-5 h-5 rounded-full"
                                                    />
                                                    <div className="text-xs text-gray-600 dark:text-white ml-1">+84</div>
                                                </div>
                                            )}

                                            <input
                                                id="login-identifier"
                                                type="text"
                                                value={email}
                                                autoFocus
                                                onChange={(e) => {
                                                    setEmail(e.target.value);
                                                    if (errEmail) setErrEmail(false);
                                                }}
                                                placeholder="Địa chỉ email, username hoặc số điện thoại"
                                                className={`w-full py-2.5 px-3 text-sm border rounded-lg outline-none text-black dark:text-white transition-all focus:ring-2 
                                                    ${showRegion ? 'pl-18' : 'pl-4'} 
                                                    ${errEmail || errPhoneNumber ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                                                        : (!email
                                                            ? "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                                            : (isEmailValid(email) || (showRegion && isPhoneNumberValid(email)) || (isUserNameValid(email)))
                                                                ? "border-blue-400 focus:border-blue-400 focus:ring-blue-100" /* ĐÃ SỬA MÀU TỪ GREEN SANG BLUE-400 */
                                                                : "border-red-500 focus:border-red-500 focus:ring-red-100")
                                                    }`}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-white block mb-1">
                                            Mật khẩu
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => {
                                                    setPassword(e.target.value);
                                                    if (errPassword) setErrPassword(false);
                                                }}
                                                placeholder="Mật khẩu"
                                                className={`w-full py-2.5 px-3 text-sm border rounded-lg outline-none text-black dark:text-white transition-all focus:ring-2
                                                    ${errPassword ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                                                        : (!password
                                                            ? "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                                            : isPasswordValid(password)
                                                                ? "border-blue-400 focus:border-blue-400 focus:ring-blue-100" /* ĐÃ SỬA MÀU TỪ GREEN SANG BLUE-400 */
                                                                : "border-red-500 focus:border-red-500 focus:ring-red-100")
                                                    }`}
                                            />
                                            <div
                                                className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-500 dark:text-white cursor-pointer hover:text-gray-700 dark:hover:text-gray-400 transition"
                                                onClick={() => setShowPassword((prev) => !prev)}
                                            >
                                                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                                            </div>
                                        </div>
                                        <div className="mt-2 text-right">
                                            <Link
                                                href={"/auth/forgot"}
                                                className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition duration-300"
                                            >
                                                Quên mật khẩu?
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-2 space-y-4">
                                    <div className="flex items-start gap-2">
                                        <input
                                            type="checkbox"
                                            checked={agree}
                                            onChange={(e) => setAgree(e.target.checked)}
                                            className="mt-1.5 cursor-pointer w-4 h-4 text-blue-400 bg-gray-100 border-gray-300 rounded focus:ring-blue-400" /* ĐÃ SỬA MÀU TỪ GREEN SANG BLUE-400 */
                                        />
                                        <label className="text-xs sm:text-sm text-gray-600 dark:text-white">
                                            Tôi đủ 18 tuổi và tôi đã đọc các <a href="#" className="text-blue-500 hover:text-blue-600 transition font-semibold underline">Thời hạn và Điều kiện</a> và <a href="#" className="text-blue-500 hover:text-blue-600 transition font-semibold underline">Chính sách bảo mật</a>
                                        </label>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full mt-6 py-2.5 px-4 font-bold text-base rounded-lg text-white 
                                     bg-blue-400 cursor-pointer transition-all duration-300 shadow-md
                                     hover:shadow-lg hover:shadow-blue-400/50
                                     ${loading ? "bg-blue-500 cursor-not-allowed" : "hover:bg-blue-500"}`}
                                >
                                    {loading ? (
                                        <svg
                                            className="animate-spin h-5 w-5 mx-auto text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                            ></path>
                                        </svg>
                                    ) : (
                                        "Đăng nhập"
                                    )}
                                </button>
                                <div className="relative w-full flex items-center justify-center my-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-200"></div>
                                    </div>
                                    <div className="px-3 bg-white dark:bg-[#1C2129] text-gray-500 dark:text-white text-xs font-medium z-10">
                                        HOẶC
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="relative w-full group cursor-pointer text-black">
                                        <div className="w-full flex py-2.5 px-4 text-sm font-semibold text-center items-center justify-center rounded-lg border border-gray-300 gap-3 bg-white transition-all duration-300
                                                    hover:border-blue-500 shadow-sm hover:shadow-md">
                                            <svg className="h-6" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" viewBox="0 0 256 262">
                                                <path fill="#4285F4" d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"></path>
                                                <path fill="#34A853" d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"></path>
                                                <path fill="#FBBC05" d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"></path>
                                                <path fill="#EB4335" d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"></path>
                                            </svg>
                                            <span>Tiếp tục với Google</span>
                                        </div>

                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            className="absolute top-0 left-0 w-full h-full opacity-0 z-10">
                                            <GoogleLoginButton />
                                        </div>
                                    </div>

                                    <button className="w-full flex py-2.5 px-4 text-sm font-semibold text-center items-center justify-center rounded-lg border border-gray-300 gap-3 bg-white text-black cursor-pointer transition-all duration-300 hover:border-blue-500 shadow-sm hover:shadow-md">
                                        <svg viewBox="0 0 16 16" className="bi bi-facebook" fill="#0163E0" height="24" width="24" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"></path>
                                        </svg>
                                        <span>Tiếp tục với Facebook</span>
                                    </button>
                                </div>

                                <div className="mt-8 text-center text-sm text-gray-600 dark:text-white">
                                    Bạn chưa có tài khoản? <Link href={'/auth/signup'} className="text-blue-500 hover:text-blue-600 transition-all duration-300 font-semibold underline">Đăng ký ngay</Link>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}


export default Signin;