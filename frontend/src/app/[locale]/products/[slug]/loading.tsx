export default function ProductLoading() {
  return (
    <main
      className="mx-auto w-full max-w-7xl animate-pulse px-4 py-8"
      aria-busy="true"
      aria-label="Loading product"
    >
      <div className="mb-6 h-4 w-64 rounded bg-slate-200" />
      <div className="grid gap-8 lg:grid-cols-2 xl:gap-12">
        <div className="aspect-square rounded-2xl bg-slate-200" />
        <div>
          <div className="h-6 w-28 rounded-full bg-slate-200" />
          <div className="mt-5 h-9 w-4/5 rounded bg-slate-200" />
          <div className="mt-3 h-5 w-56 rounded bg-slate-200" />
          <div className="mt-6 h-28 rounded-2xl bg-slate-200" />
          <div className="mt-5 h-12 rounded-xl bg-slate-200" />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="h-12 rounded-xl bg-slate-200" />
            <div className="h-12 rounded-xl bg-slate-200" />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="h-24 rounded-xl bg-slate-200" />
            <div className="h-24 rounded-xl bg-slate-200" />
          </div>
        </div>
      </div>
      <div className="mt-14 h-56 rounded-2xl bg-slate-200" />
    </main>
  );
}
