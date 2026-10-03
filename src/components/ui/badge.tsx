import { cn } from "@/lib/utils";



interface BadgeProps {

  children: React.ReactNode;

  variant?: "default" | "success" | "warning" | "danger" | "outline";

  className?: string;

}



export function Badge({ children, variant = "default", className }: BadgeProps) {

  const variants = {

    default: "bg-amber-500/20 text-amber-300",

    success: "bg-emerald-500/20 text-emerald-300",

    warning: "bg-orange-500/20 text-orange-300",

    danger: "bg-red-500/20 text-red-300",

    outline: "border border-slate-600 text-slate-300",

  };



  return (

    <span

      className={cn(

        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",

        variants[variant],

        className

      )}

    >

      {children}

    </span>

  );

}


