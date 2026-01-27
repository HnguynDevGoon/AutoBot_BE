"use client";
import Image from "next/image";
import Link from "next/link";
import {
    FaClock,
    FaFacebook,
    FaPhoneAlt,
    FaTelegram,
} from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { SiZalo } from "react-icons/si";

const DIVIDER_COLOR = "bg-gray-700"; 
const ACCENT_COLOR_CLASS = "text-blue-400"; 
const TEXT_COLOR_CLASS = "text-gray-300"; 

const Footer = () => {
    return (
        <footer className={`relative z-50 overflow-hidden`}>
            
            {/* Loại bỏ các glow và gradient sáng không phù hợp với Dark Mode */}
            {/* <div className="absolute inset-0 bg-linear-to-br from-blue-50 via-white to-purple-50"></div>
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"></div> */}
            <div className="relative border-t border-gray-700 pt-12 pb-24">
                <div className="flex items-center justify-center md:justify-start px-6 md:px-14 gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg">
                        <Image
                            src="/assets/images/logo.png"
                            alt="Logo"
                            width={40}
                            height={40}
                            className="object-contain"
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-wide dark:text-white text-black">
                            TradingBot
                        </h1>
                        <p className={`text-sm dark:${TEXT_COLOR_CLASS} text-gray-600`}>
                            Automated Trading Platform
                        </p>
                    </div>
                </div>

                <div className={`h-px w-full ${DIVIDER_COLOR} my-8`}></div>
                <div
                    className="
                        grid gap-12
                        px-6 md:px-14
                        grid-cols-1
                        sm:grid-cols-2
                        lg:grid-cols-4
                    "
                >
                    <FooterBlock title="Liên hệ">
                        <FooterItem icon={<FaPhoneAlt />} accent={ACCENT_COLOR_CLASS}>
                            0936 793 913
                        </FooterItem>
                        <FooterItem icon={<MdEmail />} accent={ACCENT_COLOR_CLASS}>
                            abc@gmail.com
                        </FooterItem>
                        <FooterItem icon={<FaClock />} accent={ACCENT_COLOR_CLASS}>
                            Thứ 2 - Thứ 7 (8:00 - 19:30)
                        </FooterItem>
                    </FooterBlock>

                    <FooterBlock title="Về chúng tôi">
                        <FooterLink href="/">Giới thiệu</FooterLink>
                        <FooterLink href="/price">
                            Bảng giá dịch vụ
                        </FooterLink>
                        <FooterLink href="/">
                            Tải Extension
                        </FooterLink>
                    </FooterBlock>

                    <FooterBlock title="Tài khoản">
                        <FooterLink href="/auth/signup">
                            Đăng ký
                        </FooterLink>
                        <FooterLink href="/auth/signin">
                            Đăng nhập
                        </FooterLink>
                    </FooterBlock>

                    <FooterBlock title="Kết nối">
                        <div className="flex gap-4 pt-2">
                            <SocialIcon accentHover="hover:bg-blue-500">
                                <FaFacebook />
                            </SocialIcon>
                            <SocialIcon accentHover="hover:bg-blue-500">
                                <SiZalo />
                            </SocialIcon>
                            <SocialIcon accentHover="hover:bg-blue-500">
                                <FaTelegram />
                            </SocialIcon>
                        </div>
                    </FooterBlock>
                </div>

                <div className="mt-12 text-center text-sm text-gray-500">
                    © {new Date().getFullYear()} TradingBot. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;

const FooterBlock = ({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) => (
    <div className="space-y-4">
        <h3 className="text-lg font-bold dark:text-white text-black relative inline-block">
            {title}
            <span className="absolute left-0 -bottom-1 w-8 h-0.5 bg-blue-500 rounded-full"></span> 
        </h3>
        <div className="space-y-3">{children}</div>
    </div>
);

const FooterItem = ({
    icon,
    children,
    accent,
}: {
    icon: React.ReactNode;
    children: React.ReactNode;
    accent: string;
}) => (
    <div className={`flex items-center gap-3 dark:${TEXT_COLOR_CLASS} text-gray-600 text-sm`}>
        <span className={accent}>{icon}</span> 
        <span>{children}</span>
    </div>
);

const FooterLink = ({
    href,
    children,
}: {
    href: string;
    children: React.ReactNode;
}) => (
    <Link
        href={href}
        className={`
            block text-sm dark:${TEXT_COLOR_CLASS} text-gray-600
            hover:text-blue-500
            hover:translate-x-1
            transition-all duration-300
        `}
    >
        {children}
    </Link>
);

const SocialIcon = ({ children, accentHover }: { children: React.ReactNode, accentHover: string }) => (
    <div
        className={`
            w-11 h-11 rounded-full
            flex items-center justify-center
            bg-[#33353A] 
            text-gray-400
            shadow-lg
            hover:shadow-blue-500/50
            ${accentHover}
            hover:text-white
            transition-all duration-300
            cursor-pointer
        `}
    >
        {children}
    </div>
);