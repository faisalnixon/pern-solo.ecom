import { useSearchParams } from "react-router";
import { apiFetch } from "../lib/api.js";
import { useQuery } from "@tanstack/react-query";
import type { Product } from "../types/types.js";

type CategoriesResponse = {
  categories: string[];
};

type ProductsResponse = {
  products: Product[];
};

export function useHomeCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFilter = searchParams.get("category")?.trim() ?? "";

  const setCategory = (category :string | null) => {
    const next = new URLSearchParams(searchParams);

    if (!category) next.delete("category");
    else next.set("category", category);

    setSearchParams(next, { replace: true });
  };

  const { data: categoriesData, isLoading: loadingCategories } = useQuery({
    queryKey: ["product-categories"],
    queryFn: () => apiFetch<CategoriesResponse>("/api/products/categories"),
  });

  const {
    data: productsData,
    isLoading: loadingList,
    error,
  } = useQuery({
    queryKey: ["products", categoryFilter],
    queryFn: () =>
      apiFetch<ProductsResponse>(
        categoryFilter
          ? `/api/products?category=${encodeURIComponent(categoryFilter)}` 
          : "/api/products",
        //   in url we can not have this url "camara and others" so thats why encodeURIComponent is used which will  fill the empty spaces with something like %20 & others for the unnecessary part as example it will make the url "camara%20and%20others"
      ),
  });

  const categories = categoriesData?.categories ?? [];
  const products = productsData?.products ?? [];
  const categoryChipsLoading = loadingCategories && categories.length === 0;

  return {
    categoryFilter,
    setCategory,
    categories,
    products,
    categoryChipsLoading,
    loadingCategories,
    loadingList,
    error,
  };
}
