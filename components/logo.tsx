import Image from "next/image"
import Link from "next/link"

export function Logo() {
  return (
    <Link href="/">
      <Image src="/logo.png" alt="KIRII" width={200} height={120} className="h-auto" priority />
    </Link>
  )
}
