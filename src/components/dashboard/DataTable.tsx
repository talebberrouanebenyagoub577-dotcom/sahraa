"use client";



import { cn } from "@/lib/utils";



interface Column {

  key: string;

  label: string;

  render?: (row: Record<string, unknown>) => React.ReactNode;

}



interface DataTableProps {

  columns: Column[];

  data: Record<string, unknown>[];

  loading?: boolean;

  emptyMessage?: string;

  onRowClick?: (row: Record<string, unknown>) => void;

}



export function DataTable({

  columns,

  data,

  loading,

  emptyMessage = "No data",

  onRowClick,

}: DataTableProps) {

  if (loading) {

    return <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">Loading...</div>;

  }



  if (!data.length) {

    return <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">{emptyMessage}</div>;

  }



  return (

    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">

      <table className="w-full text-sm text-slate-200">

        <thead>

          <tr className="border-b border-slate-800 bg-slate-950">

            {columns.map((col) => (

              <th key={col.key} className="px-4 py-3 text-start font-medium text-slate-400">

                {col.label}

              </th>

            ))}

          </tr>

        </thead>

        <tbody>

          {data.map((row, i) => (

            <tr

              key={i}

              className={cn("border-b border-slate-800/80 hover:bg-slate-800/50", onRowClick && "cursor-pointer")}

              onClick={() => onRowClick?.(row)}

            >

              {columns.map((col) => (

                <td key={col.key} className="px-4 py-3">

                  {col.render ? col.render(row) : String(row[col.key] ?? "")}

                </td>

              ))}

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );

}


