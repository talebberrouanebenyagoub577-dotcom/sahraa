import { cn } from "@/lib/utils";

import { TextareaHTMLAttributes, forwardRef } from "react";



const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(

  ({ className, ...props }, ref) => (

    <textarea

      className={cn(

        "flex min-h-[80px] w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 ring-offset-slate-950 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",

        className

      )}

      ref={ref}

      {...props}

    />

  )

);

Textarea.displayName = "Textarea";



export { Textarea };


