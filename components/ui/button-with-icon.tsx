import { Button } from "@/components/ui/button"
import { ArrowUpRight } from "lucide-react"

type ButtonWithIconProps = {
  label?: string
  onClick?: () => void
  pressed?: boolean
}

export function ButtonWithIcon({
  label = "Voice",
  onClick,
  pressed = false,
}: ButtonWithIconProps) {
  return (
    <Button
      aria-pressed={pressed}
      onClick={onClick}
      className="group relative h-12 w-fit cursor-pointer overflow-hidden rounded-full p-1 ps-6 pe-14 text-sm font-medium transition-all duration-500 hover:ps-14 hover:pe-6"
    >
      <span className="relative z-10 transition-all duration-500">{label}</span>
      <span className="absolute right-1 flex h-10 w-10 items-center justify-center rounded-full bg-background text-foreground transition-all duration-500 group-hover:right-[calc(100%-44px)] group-hover:rotate-45">
        <ArrowUpRight size={16} />
      </span>
    </Button>
  )
}

export default ButtonWithIcon
