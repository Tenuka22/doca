import type { ComponentProps } from "react";

interface WordmarkProps extends ComponentProps<"a"> {
  size?: "default" | "footer";
}

export function Wordmark({
  size = "default",
  className = "",
  ...props
}: WordmarkProps) {
  return (
    <a
      className={`font-serif leading-none tracking-[-0.045em] ${
        size === "footer" ? "text-[40px]" : "text-[51px]"
      } ${className}`}
      {...props}
    >
      Suwa
    </a>
  );
}
