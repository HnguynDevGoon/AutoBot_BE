"use client"

import * as React from "react"
import useEmblaCarousel from "embla-carousel-react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import Autoplay from "embla-carousel-autoplay"

type CarouselApi = ReturnType<typeof useEmblaCarousel>[1]

interface CarouselProps extends React.HTMLAttributes<HTMLDivElement> {
    opts?: Parameters<typeof useEmblaCarousel>[0]
    setApi?: (api: CarouselApi) => void
}

const CarouselContext = React.createContext<{
    api: CarouselApi
} | null>(null)

/* ================= ROOT ================= */

export function Carousel({
    opts,
    setApi,
    className,
    children,
    ...props
}: CarouselProps) {
    const [viewportRef, api] = useEmblaCarousel(
        {
            align: "start",
            loop: true, // ⚠️ bắt buộc để chạy mượt
            ...opts,
        },
        [
            Autoplay({
                delay: 3000,       // 3 giây
                stopOnInteraction: false, // không dừng khi user chạm
            }),
        ]
    )

    React.useEffect(() => {
        if (api && setApi) setApi(api)
    }, [api, setApi])

    return (
        <CarouselContext.Provider value={{ api }}>
            <div className={cn("relative", className)} {...props}>
                <div ref={viewportRef} className="overflow-hidden">
                    {children}
                </div>
            </div>
        </CarouselContext.Provider>
    )
}

/* ================= CONTENT ================= */

export function CarouselContent({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("flex", className)}
            {...props}
        />
    )
}

/* ================= ITEM ================= */

export function CarouselItem({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "shrink-0 grow-0 basis-full md:basis-1/2 lg:basis-1/3",
                className
            )}
            {...props}
        />
    )
}

/* ================= BUTTONS ================= */

export function CarouselPrevious({
    className,
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    const context = React.useContext(CarouselContext)
    if (!context) return null

    return (
        <button
            type="button"
            onClick={() => context.api?.scrollPrev()}
            className={cn(
                "absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white p-2 shadow",
                className
            )}
            {...props}
        >
            <ChevronLeft className="h-4 w-4" />
        </button>
    )
}

export function CarouselNext({
    className,
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    const context = React.useContext(CarouselContext)
    if (!context) return null

    return (
        <button
            type="button"
            onClick={() => context.api?.scrollNext()}
            className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white p-2 shadow",
                className
            )}
            {...props}
        >
            <ChevronRight className="h-4 w-4" />
        </button>
    )
}
