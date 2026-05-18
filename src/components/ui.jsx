import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "../lib/utils" // create cn helper if not already

// ------------------ Button ------------------
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
    "disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-black text-white hover:bg-gray-800",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        outline: "border border-gray-300 bg-white hover:bg-gray-100",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

// ------------------ Input ------------------
const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm " +
          "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

// ------------------ Label ------------------
const Label = React.forwardRef(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
    {...props}
  />
))
Label.displayName = "Label"

// ------------------ Card ------------------
function Card({ className, ...props }) {
  return (
    <div
      className={cn("rounded-lg border bg-white text-gray-900 shadow-sm", className)}
      {...props}
    />
  )
}
function CardHeader({ className, ...props }) {
  return <div className={cn("p-4 border-b", className)} {...props} />
}
function CardTitle({ className, ...props }) {
  return <h3 className={cn("font-semibold leading-none tracking-tight", className)} {...props} />
}
function CardContent({ className, ...props }) {
  return <div className={cn("p-4", className)} {...props} />
}

// ------------------ Exports ------------------
export { Button, Input, Label, Card, CardHeader, CardTitle, CardContent }
