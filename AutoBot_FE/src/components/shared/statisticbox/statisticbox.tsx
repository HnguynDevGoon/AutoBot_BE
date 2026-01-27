'use client';

import { TrendingUp } from "lucide-react";

const StatisticBox = ({ title, value, detail, icon: Icon, color, chartColor, isPositive, isNeutral }: any) => (
    <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start">
            <div className={`p-2 md:p-2.5 rounded-xl ${color} text-white shadow-lg shadow-blue-100`}>
                <Icon size={20} className="w-5 h-5" />
            </div>
            <div className="text-right">
                <p className="text-[10px] md:text-xs font-medium text-gray-400 uppercase tracking-wider">{title}</p>
                <h3 className="text-lg md:text-xl font-bold text-gray-800 mt-0.5">{value}</h3>
            </div>
        </div>

        <div className="mt-4 flex items-end gap-2">
            <div className="flex-1 h-8 md:h-10 flex items-end gap-1">
                {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                    <div
                        key={i}
                        className={`flex-1 ${chartColor} rounded-t-sm opacity-20`}
                        style={{ height: `${h}%` }}
                    ></div>
                ))}
            </div>

            <div className={`flex items-center gap-0.5 md:gap-1 text-[10px] md:text-[11px] font-bold px-1.5 md:px-2 py-0.5 rounded-md ${isNeutral
                ? "text-gray-500 bg-gray-100"
                : isPositive
                    ? "text-green-600 bg-green-50"
                    : "text-red-600 bg-red-50"
                }`}>
                {!isNeutral && (
                    <TrendingUp size={12} className={isPositive ? "" : "rotate-180"} />
                )}
                <span>
                    {!isNeutral && isPositive ? "+" : ""}
                    {detail}%
                </span>
            </div>
        </div>
    </div>
);

export default StatisticBox;

