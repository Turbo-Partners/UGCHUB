"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      closeButton={true}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:pr-10",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "group-[.toaster]:!bg-muted group-[.toaster]:!border-border group-[.toaster]:!text-foreground group-[.toaster]:hover:!bg-muted-foreground/20 group-[.toaster]:!w-6 group-[.toaster]:!h-6 group-[.toaster]:!top-2 group-[.toaster]:!right-2 group-[.toaster]:!left-auto group-[.toaster]:!translate-x-0 group-[.toaster]:!translate-y-0",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
