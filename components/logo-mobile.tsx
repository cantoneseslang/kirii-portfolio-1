import Link from "next/link"
import Image from "next/image"

export function LogoMobile() {
  return (
    <Link href="/" className="flex items-center pl-4">
      <Image 
        src="/logo-mobile.png" 
        alt="KIRII Logo" 
        width={200} 
        height={120} 
        className="h-auto"
      />
    </Link>
  )
}
