"use client";
import React, { useState } from "react";
import { MdOutlineLocalGroceryStore, MdLogin } from "react-icons/md";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { FaGoogle, FaGithub, FaDiscord } from "react-icons/fa";
import { RiTwitterXFill } from "react-icons/ri";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import logo from "../../../public/logo.png";

const Navbar = () => {
  const router = useRouter();
  const [loginDropdownSelected, setLoginDropdownSelected] = useState(false);
  const { data: session } = useSession();

  return (
    <div className="fixed inset-x-0 top-0 pt-2 z-50 border-b border-white/10">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 bg-transparent">
        {/* Bar */}
        <div className="h-16 flex items-center justify-between">
          {/* Left: Logo */}
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Image
              src={logo}
              alt="Moonopoly"
              priority
              className="h-20 w-auto object-contain" // ~40px tall, keeps aspect
            />
          </button>

          {/* Right: Actions */}
          <nav className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                // router.push("/store");
              }}
              className="hidden cursor-pointer sm:flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/10 transition"
            >
              <MdOutlineLocalGroceryStore className="text-lg" color="#A4A4AE" />
              <span className="text-[#A4A4AE] cursor-not-allowed">Store (Coming Soon)</span>
            </button>

            {/* Login / User */}
            <div className="relative">
              {!session ? (
                <button
                  onClick={() =>
                    setLoginDropdownSelected((v) => !v)
                  }
                  className="flex items-center gap-2 cursor-pointer rounded-lg px-3 py-2 hover:bg-white/10 transition"
                >
                  <MdLogin className="text-lg" />
                  <span>Login</span>
                </button>
              ) : (
                <button
                  onClick={() =>
                    setLoginDropdownSelected((v) => !v)
                  }
                  className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-white/10 transition"
                >
                  {session.user?.image && (
                    <Image
                      src={session.user.image}
                      alt={session.user?.name ?? "User"}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  )}
                  <span className="max-w-[10rem] truncate">
                    {session.user?.name}
                  </span>
                </button>
              )}

              {/* Dropdown */}
              {loginDropdownSelected && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-lg bg-slate-800 p-3 shadow-xl ring-1 ring-black/10">
                  {!session ? (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => signIn("google")}
                        className="flex cursor-pointer items-center gap-2 rounded-md border border-white/10 px-3 py-2 hover:bg-white/10 transition"
                      >
                        <FaGoogle /> Log in with Google
                      </button>
                      <button
                        onClick={() => signIn("github")}
                        className="flex cursor-pointer items-center gap-2 rounded-md border border-white/10 px-3 py-2 hover:bg-white/10 transition"
                      >
                        <FaGithub /> Log in with GitHub
                      </button>
                      <button
                        onClick={() => signIn("twitter")}
                        className="flex cursor-pointer items-center gap-2 rounded-md border border-white/10 px-3 py-2 hover:bg-white/10 transition"
                      >
                        <RiTwitterXFill /> Log in with Twitter
                      </button>
                      <button
                        onClick={() => signIn("discord")}
                        className="flex cursor-pointer items-center gap-2 rounded-md border border-white/10 px-3 py-2 hover:bg-white/10 transition"
                      >
                        <FaDiscord /> Log in with Discord
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => signOut()}
                      className="w-full rounded-md bg-blue-600 px-3 py-2 hover:bg-blue-500 transition"
                    >
                      Sign out
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Wallet */}
            <div className="shrink-0">
              <ConnectButton />
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
