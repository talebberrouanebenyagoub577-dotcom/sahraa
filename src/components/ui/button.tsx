import { cn } from "@/lib/utils";

import { cva, type VariantProps } from "class-variance-authority";

import { ButtonHTMLAttributes, forwardRef } from "react";



const buttonVariants = cva(

  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:pointer-events-none disabled:opacity-50",

  {

    variants: {

      variant: {

        default: "bg-amber-500 text-white hover:bg-amber-600 shadow-sm",

        secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700",

        outline: "border border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800",

        ghost: "text-slate-200 hover:bg-slate-800",

        destructive: "bg-red-500 text-white hover:bg-red-600",

        link: "text-amber-400 underline-offset-4 hover:underline",

      },

      size: {

        default: "h-10 px-4 py-2 text-sm",

        sm: "h-8 px-3 text-xs",

        lg: "h-12 px-6 text-base",

        icon: "h-10 w-10",

      },

    },

    defaultVariants: { variant: "default", size: "default" },

  }

);



export interface ButtonProps

  extends ButtonHTMLAttributes<HTMLButtonElement>,

    VariantProps<typeof buttonVariants> {}



const Button = forwardRef<HTMLButtonElement, ButtonProps>(

  ({ className, variant, size, ...props }, ref) => (

    <button

      className={cn(buttonVariants({ variant, size, className }))}

      ref={ref}

      {...props}

    />

  )

);

Button.displayName = "Button";



export { Button, buttonVariants };


