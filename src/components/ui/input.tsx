import { cn } from "@/lib/utils";

import { InputHTMLAttributes, forwardRef } from "react";



const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(

  ({ className, type, ...props }, ref) => (

    <input

      type={type}

      className={cn(

        "flex h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 ring-offset-slate-950 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",

        className

      )}

      ref={ref}

      {...props}

    />

  )

);

Input.displayName = "Input";



export { Input };


