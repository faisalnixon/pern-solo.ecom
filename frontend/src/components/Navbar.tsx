import { Show, SignInButton, useAuth, UserButton } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { Link } from "react-router";
import { ThemeToggle } from "./ThemeToggle";


import {
  LogInIcon,
  PackageIcon,
  SettingsIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  StoreIcon,
} from "lucide-react";
import { useCart } from "../store/cart";

type Role = "customer" | "support" | "admin";

type User = {
  id: string;
  clerk_user_id: string;
  email: string;
  display_name: string | null;
  role: Role;
  created_at: string; // ISO timestamp string over JSON — Date doesn't survive JSON.stringify
  updated_at: string;
};

type MeResponse = {
  user: User;
};

const Navbar = () => {
  const { getToken, isSignedIn } = useAuth();

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<MeResponse>("/api/me", { getToken }),
    enabled: isSignedIn,
  });

  // console.log(meData);
  const role = meData?.user?.role;

  const cartCount = useCart((s) =>
    s.items.reduce((n: number, line) => n + line.quantity, 0),
  );
  // const cartCount = 5;

  return (
    <header className="sticky top-0 z-50 border-b border-base-300 bg-base-100/95 shadow-sm backdrop-blur-md">
      <div className="navbar mx-auto min-h-14 max-w-7xl px-4 py-2.5 md:px-6 md:py-3">
        <div className="flex-1">
          <Link
            to="/"
            className="btn btn-ghost gap-2 px-2 font-mono text-lg font-semibold uppercase tracking-wide md:text-xl"
          >
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/15 p-1 text-primary">
              <StoreIcon className="size-8 text-lime-500" aria-hidden />
            </span>
            <span className="leading-none">Northwind</span>
          </Link>
        </div>

        <nav className="flex items-center gap-1 md:gap-1.5">
          <ThemeToggle/>
          <Link to="/" className="btn btn-ghost gap-2 font-medium">
            <ShoppingBagIcon className="size-6 opacity-90" aria-hidden />
            <span className="hidden sm:inline">Shop</span>
          </Link>

          <Show when={"signed-in"}>
            {" "}
            {/* the belloow element will be shown when user is signed in by clerk */}
            <Link to="/orders" className="btn btn-ghost gap-2 font-medium">
              <PackageIcon className="size-6 opacity-90" aria-hidden />
              <span className="hidden sm:inline">Orders</span>
            </Link>
            {role === "admin" ? (
              <Link
                to="/admin"
                className="btn btn-ghost gap-2 font-medium text-secondary"
              >
                <SettingsIcon className="size-6" aria-hidden />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            ) : null}
          </Show>

          <Link
            to="/cart"
            className="btn btn-ghost gap-2 font-medium indicator"
            aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"}
          >
            {cartCount > 0 ? (
              <span className="indicator-item badge badge-sm badge-primary min-w-2 px-1.5 font-sans text-xs tabular-nums bg-lime-800">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
            <ShoppingCartIcon className="size-6 opacity-90" aria-hidden />
            <span className="hidden sm:inline">Cart</span>
          </Link>

          <Show when={"signed-out"}>
            <SignInButton mode="modal">
              <button
                type="button"
                className="btn btn-primary btn-sm gap-1.5 px-3 shadow-md"
              >
                <LogInIcon className="size-4 drop-shadow-sm" aria-hidden />
                Sign in
              </button>
            </SignInButton>
          </Show>

          <Show when={"signed-in"}>
            <div className="flex items-center gap-2 border-l border-base-300 pl-3">
              <UserButton
                appearance={{
                  elements: { avatarBox: "h-10 w-10 ring-2 ring-base-300" },
                }}
              />
              {role === "support" || role === "admin" ? (
                <span className="badge badge-primary badge-sm hidden capitalize md:inline-flex">
                  {role}
                </span>
              ) : null}
            </div>
          </Show>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
