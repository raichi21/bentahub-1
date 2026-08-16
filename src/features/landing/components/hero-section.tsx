"use client"

import Image from "next/image"
import { useStoreSettings } from "@/hooks/useStoreSettings"

export function HeroSection() {
  const { storeName } = useStoreSettings()

  return (
    <section className="relative h-[650px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/landing/hero.png"
          alt="Filipino Sari-Sari Store"
          fill
          className="object-cover"
          priority
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-2xl text-white">

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            {storeName}, <span className="text-accent">Now Digital</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-gray-300 mb-8 max-w-xl">
            BentaHub brings your local stores online. Browse real-time inventory, reserve items, and pick them up when ready. Convenient, and easy to use.
          </p>

        </div>
      </div>
    </section>
  )
}
