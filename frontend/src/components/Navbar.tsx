import { Show, SignInButton, useAuth, UserButton } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import {
  LogInIcon,
  MenuIcon,
  PackageIcon,
  SettingsIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  StoreIcon,
} from "lucide-react";

import { apiFetch } from "../lib/api";
import { ThemeToggle } from "./ThemeToggle";
import { useCart } from "../store/cart";

type Role = "customer" | "support" | "admin";

type User = {
  id: string;
  clerk_user_id: string;
  email: string;
  display_name: string | null;
  role: Role;
  created_at: string;
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

  const role = meData?.user.role;

  const cartCount = useCart((s) =>
    s.items.reduce((n, line) => n + line.quantity, 0),
  );

  return (
    <header className="sticky top-0 z-50 border-b border-base-300 bg-base-100/95 shadow-sm backdrop-blur-md">
      <div className="navbar mx-auto max-w-7xl px-4 py-2 md:px-6">
        {/* Logo */}
        <div className="flex-1">
          <Link
            to="/"
            className="btn btn-ghost gap-2 px-2 font-mono text-lg font-semibold uppercase tracking-wide md:text-xl"
          >
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <StoreIcon className="size-7 text-lime-500" />
            </span>

            <span className="hidden xs:inline leading-none">
              pern-solo.ecom
            </span>
          </Link>
        </div>

        {/* ---------------- Desktop ---------------- */}
        <nav className="hidden items-center gap-1.5 md:flex">
          <ThemeToggle />

          <Link to="/" className="btn btn-ghost gap-2">
            <ShoppingBagIcon className="size-5" />
            <span>Shop</span>
          </Link>

          <Show when={"signed-in"}>
            <Link to="/orders" className="btn btn-ghost gap-2">
              <PackageIcon className="size-5" />
              <span>Orders</span>
            </Link>

            {role === "admin" && (
              <Link
                to="/admin"
                className="btn btn-ghost gap-2 text-secondary"
              >
                <SettingsIcon className="size-5" />
                <span>Admin</span>
              </Link>
            )}
          </Show>

          <Link
            to="/cart"
            className="btn btn-ghost gap-2 indicator"
            aria-label={
              cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"
            }
          >
            {cartCount > 0 && (
              <span className="indicator-item badge badge-primary badge-sm bg-lime-800 text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}

            <ShoppingCartIcon className="size-5" />
            <span>Cart</span>
          </Link>

          <Show when={"signed-out"}>
            <SignInButton mode="modal">
              <button className="btn btn-primary btn-sm gap-2">
                <LogInIcon className="size-4" />
                Sign in
              </button>
            </SignInButton>
          </Show>

          <Show when={"signed-in"}>
            <div className="flex items-center gap-2 border-l border-base-300 pl-3">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-10 w-10 ring-2 ring-base-300",
                  },
                }}
              />

              {(role === "support" || role === "admin") && (
                <span className="badge badge-primary badge-sm capitalize">
                  {role}
                </span>
              )}
            </div>
          </Show>
        </nav>

        {/* ---------------- Mobile ---------------- */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            to="/cart"
            className="btn btn-ghost btn-circle indicator"
          >
            {cartCount > 0 && (
              <span className="indicator-item badge badge-primary badge-sm bg-lime-800 text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}

            <ShoppingCartIcon className="size-5" />
          </Link>

          <Show when={"signed-in"}>
            <UserButton />
          </Show>

          <Show when={"signed-out"}>
            <SignInButton mode="modal">
              <button className="btn btn-primary btn-sm">
                <LogInIcon className="size-4" />
              </button>
            </SignInButton>
          </Show>

          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle">
              <MenuIcon className="size-6" />
            </label>

            <ul
              tabIndex={0}
              className="menu dropdown-content z-[100] mt-3 w-64 rounded-box border border-base-300 bg-base-100 p-2 shadow-xl"
            >
              <li>
                <Link to="/">
                  <ShoppingBagIcon className="size-4" />
                  Shop
                </Link>
              </li>

              <Show when={"signed-in"}>
                <li>
                  <Link to="/orders">
                    <PackageIcon className="size-4" />
                    Orders
                  </Link>
                </li>
              </Show>

              {role === "admin" && (
                <li>
                  <Link to="/admin">
                    <SettingsIcon className="size-4" />
                    Admin
                  </Link>
                </li>
              )}

              <li>
                <div className="flex items-center justify-between">
                  <span>Theme</span>
                  <ThemeToggle />
                </div>
              </li>

              {(role === "support" || role === "admin") && (
                <>
                  <li>
                    <hr />
                  </li>

                  <li className="menu-title">
                    <span className="capitalize">{role}</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;




