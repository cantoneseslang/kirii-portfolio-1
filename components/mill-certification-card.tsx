"use client"

import React from "react"
import { NewFeatureBadge } from "@/components/new-feature-badge"

const MillCertificationCard = () => {
  return (
    <div className="block w-full md:w-[420px]">
      <a href="/mill-certification" className="block w-full">
        <div className="w-full min-h-[92px] relative p-4 rounded-xl bg-[#f1f1f3] shadow-sm cursor-pointer transition-all hover:shadow-md">
          <h3 className="flex flex-nowrap items-center gap-2 text-xl font-bold transition-colors">
            <span className="hover:text-[#02315a] hover:underline whitespace-nowrap">
              Mill Certification
            </span>
            <NewFeatureBadge className="shrink-0" />
          </h3>
          <p className="text-[#3c3852] text-sm mt-4">原材料質量證明書</p>

          <div className="absolute bottom-0 right-0 bg-[#02315a] p-1.5 rounded-tl-xl rounded-br-xl flex items-center justify-center transition-colors hover:bg-[#02315a] group">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              height={15}
              width={15}
              className="transition-transform group-hover:translate-x-0.5"
            >
              <path
                fill="#fff"
                d="M13.4697 17.9697C13.1768 18.2626 13.1768 18.7374 13.4697 19.0303C13.7626 19.3232 14.2374 19.3232 14.5303 19.0303L20.3232 13.2374C21.0066 12.554 21.0066 11.446 20.3232 10.7626L14.5303 4.96967C14.2374 4.67678 13.7626 4.67678 13.4697 4.96967C13.1768 5.26256 13.1768 5.73744 13.4697 6.03033L18.6893 11.25H4C3.58579 11.25 3.25 11.5858 3.25 12C3.25 12.4142 3.58579 12.75 4 12.75H18.6893L13.4697 17.9697Z"
              />
            </svg>
          </div>
        </div>
      </a>
      {/* Reserve same footnote height as PQ-Form ISO line */}
      <p className="text-sm mt-1 ml-1 min-h-[1.25rem] invisible select-none" aria-hidden="true">
        ISO-FAC-10(03/26)
      </p>
    </div>
  )
}

export default MillCertificationCard
