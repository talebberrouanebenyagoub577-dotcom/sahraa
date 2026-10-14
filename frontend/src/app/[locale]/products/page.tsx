import { Suspense } from "react";
import { ProductsList } from "./ProductsList";

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <ProductsList />
    </Suspense>
  );
}
