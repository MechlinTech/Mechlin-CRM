"use client"

import Image from "next/image"

export function BrandedHeader() {
  return (
    <div className="flex flex-col items-center mb-6 pt-1">

      <div className="flex items-center gap-2.5 px-5 py-2.5">
        <Image
          src="https://devcrm.mechlintech.com/logo.png"
          alt="ClientSphere"
          width={44}
          height={44}
          className="h-16 w-16 object-contain"
        />
        <span className="text-4xl font-bold tracking-tight text-gray-600">
          Client<span className="text-[#006AFF]">Sphere</span>
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="h-px w-8 bg-gray-200" />
        <span className="text-[10px] uppercase tracking-[0.25em] text-gray-400 font-medium">powered by</span>
        <div className="h-px w-8 bg-gray-200" />
      </div>

      <Image
        src="/mechlin-logo.png"
        alt="Mechlin"
        width={100}
        height={25}
        className="h-10 w-auto object-contain mb-2"
      />
    </div>
  )
}