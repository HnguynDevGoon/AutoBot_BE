import Home from "@/components/client/home/home";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Trang chủ - AutoBot Phái Sinh',
    description: 'Trang chủ AutoBot - Cho thuê bot chứng khoán phái sinh'
}

export default function HomePage() {
  return (
    <div>
      <Home />
    </div>
  );
}
