"use client";

import Image from "next/image";
import Link from "next/link";
import { Calendar, ArrowUpRight, Clock, Zap, TrendingUp } from "lucide-react";

// --- MOCK DATA ---
// Tôi đã thay đổi ảnh một chút để bạn thấy sự đa dạng, bạn có thể thay lại link của bạn nếu muốn
const NEWS_DATA = [
  {
    Title: "AutoBot chính thức tích hợp AI Trading thế hệ 4.0: Đột phá lợi nhuận",
    UrlAvatar: "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?q=80&w=2000&auto=format&fit=crop",
    Link: "/content/ai-update",
    Description: "Sức mạnh từ Deep Learning giúp phân tích hàng triệu điểm dữ liệu chỉ trong mili-giây. Đây không chỉ là công cụ, mà là lợi thế cạnh tranh tuyệt đối.",
    CreatedDate: "2025-11-27T09:00:00"
  },
  {
    Title: "Thị trường Crypto tuần 4/11: Sắc xanh bao phủ, Bitcoin phá đỉnh",
    UrlAvatar: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=1000&auto=format&fit=crop",
    Link: "/content/market-week-4",
    Description: "Dòng tiền tổ chức đang đổ mạnh vào thị trường. ETH và Altcoin có dấu hiệu bùng nổ theo đà tăng trưởng chung.",
    CreatedDate: "2025-11-26T14:30:00"
  },
  {
    Title: "Bảo mật 2FA: Lá chắn thép bảo vệ tài sản số của bạn",
    UrlAvatar: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1000&auto=format&fit=crop",
    Link: "/content/security-guide",
    Description: "Đừng để mất bò mới lo làm chuồng. Hướng dẫn chi tiết kích hoạt bảo mật đa lớp chuẩn quốc tế.",
    CreatedDate: "2025-11-25T10:15:00"
  },
  {
    Title: "Chiến lược DCA: Nghệ thuật trung bình giá cho người bận rộn",
    UrlAvatar: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=1000&auto=format&fit=crop",
    Link: "/content/dca-strategy",
    Description: "Đầu tư không cần canh bảng điện. Tìm hiểu cách phân bổ vốn thông minh để tối ưu hóa lợi nhuận dài hạn.",
    CreatedDate: "2025-11-24T08:00:00"
  },
  {
    Title: "Thông báo nâng cấp hệ thống máy chủ cụm Châu Á",
    UrlAvatar: "https://images.unsplash.com/photo-1558494949-efc527651087?q=80&w=1000&auto=format&fit=crop",
    Link: "/content/maintenance",
    Description: "Để đáp ứng lượng truy cập tăng đột biến, chúng tôi sẽ tiến hành nâng cấp phần cứng vào cuối tuần này.",
    CreatedDate: "2025-11-23T16:45:00"
  },
];

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', { 
        year: 'numeric', month: 'long', day: 'numeric' 
    });
};

export default function Content() {
  const featuredPost = NEWS_DATA[0];
  const otherPosts = NEWS_DATA.slice(1);

  return (
    <div className="bg-gray-50/50 min-h-screen font-sans text-gray-800 pb-20">
        
        {/* --- HERO HEADER --- */}
        <div className="relative bg-white pt-16 pb-10 px-6 md:px-12 border-b border-gray-100">
            <div className="max-w-7xl mx-auto">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider mb-4">
                    <Zap size={14} className="fill-blue-600" /> AutoBot News
                </span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight mb-4">
                    Thông tin <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600">Thị trường & Công nghệ</span>
                </h1>
                <p className="text-lg text-gray-500 max-w-2xl">
                    Cập nhật những xu hướng mới nhất, chiến lược đầu tư thông minh và thông báo quan trọng từ đội ngũ phát triển.
                </p>
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 mt-12">
            
            {/* --- FEATURED POST (WOW EFFECT) --- */}
            <div className="mb-20">
                <div className="relative group rounded-3xl overflow-hidden bg-white shadow-2xl shadow-blue-900/5 hover:shadow-blue-900/10 transition-all duration-500 border border-gray-100">
                    <div className="grid lg:grid-cols-12 gap-0">
                        {/* Image Section */}
                        <div className="lg:col-span-7 relative h-[400px] lg:h-[500px] overflow-hidden">
                            <Image 
                                src={featuredPost.UrlAvatar || ""} 
                                alt={featuredPost.Title}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent lg:hidden"></div>
                            <div className="absolute top-6 left-6">
                                <span className="bg-white/90 backdrop-blur-md text-gray-900 text-xs font-bold px-4 py-2 rounded-full shadow-sm flex items-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                    </span>
                                    Tiêu điểm
                                </span>
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="lg:col-span-5 p-8 lg:p-12 flex flex-col justify-center relative bg-white">
                            <div className="flex items-center gap-3 text-sm text-gray-500 font-medium mb-4">
                                <Calendar size={16} className="text-blue-600" />
                                {formatDate(featuredPost.CreatedDate)}
                            </div>
                            
                            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-6 group-hover:text-blue-600 transition-colors duration-300">
                                <Link href={featuredPost.Link || "#"}>
                                    {featuredPost.Title}
                                </Link>
                            </h2>
                            
                            <p className="text-gray-600 text-lg leading-relaxed mb-8 line-clamp-3">
                                {featuredPost.Description}
                            </p>
                            
                            <Link 
                                href={featuredPost.Link || "#"} 
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-blue-600 transition-all duration-300 group/btn w-fit"
                            >
                                Đọc bài viết 
                                <ArrowUpRight size={18} className="transition-transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- RECENT POSTS HEADER --- */}
            <div className="flex items-end justify-between mb-10 border-b border-gray-200 pb-4">
                <div>
                    <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <TrendingUp className="text-blue-600" /> Mới cập nhật
                    </h3>
                </div>
                <Link href="/news" className="text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors hidden sm:block">
                    Xem tất cả &rarr;
                </Link>
            </div>

            {/* --- RECENT POSTS GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                {otherPosts.map((post, index) => (
                    <article key={index} className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 border border-transparent hover:border-gray-100">
                        {/* Card Image */}
                        <Link href={post.Link || "#"} className="relative h-60 w-full overflow-hidden block">
                            <Image 
                                src={post.UrlAvatar || ""} 
                                alt={post.Title}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            {/* Overlay nhẹ khi hover */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                            
                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-bold text-gray-700 shadow-sm opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                Đọc ngay
                            </div>
                        </Link>

                        {/* Card Content */}
                        <div className="flex flex-col flex-1 p-6">
                            <div className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-3 uppercase tracking-wide">
                                <Clock size={12} className="text-blue-500" />
                                {formatDate(post.CreatedDate)}
                            </div>

                            <h4 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors duration-200">
                                <Link href={post.Link || "#"}>
                                    {post.Title}
                                </Link>
                            </h4>

                            <p className="text-sm text-gray-500 line-clamp-3 mb-5 leading-relaxed flex-1">
                                {post.Description}
                            </p>

                            <div className="pt-5 border-t border-gray-50 mt-auto flex items-center justify-between">
                                <Link 
                                    href={post.Link || "#"} 
                                    className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors flex items-center gap-1"
                                >
                                    Chi tiết
                                </Link>
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                    <ArrowUpRight size={14} />
                                </div>
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            {/* Mobile View All Link */}
            <div className="mt-8 text-center sm:hidden">
                 <Link href="/news" className="text-sm font-semibold text-blue-600 hover:underline">
                    Xem tất cả bài viết &rarr;
                </Link>
            </div>
        </div>
    </div>
  );
}