import Image from "next/image"
import Link from "next/link"

export function Logo() {
  return (
    <Link href="/">
      <Image src="/logo.png" alt="KIRII" width={100} height={27} priority />
    </Link>
  )
}
