import { useRouter } from "next/router";
import React, { useState } from "react";
import { MdOutlineLocalGroceryStore, MdLogin } from "react-icons/md";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { FaGoogle } from "react-icons/fa";
import { FaGithub } from "react-icons/fa";
import { RiTwitterXFill } from "react-icons/ri";
import { FaDiscord } from "react-icons/fa";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";

const Navbar = () => {
  const router = useRouter();
  const [loginDropdownSelected, setLoginDropdownSelected] =
    useState<boolean>(false);
  const { data: session } = useSession();

  return (
    <div className="h-8 fixed p-6 flex justify-between w-full">
      <div
        className="flex cursor-pointer"
        onClick={() => {
          router.push("/");
        }}
      >
        Logo
      </div>
      <div className="flex gap-4">
        <div
          className="flex gap-2 items-center cursor-pointer p-5 hover:bg-gray-800  rounded"
          onClick={() => {
            router.push("/store");
          }}
        >
          <div>
            <MdOutlineLocalGroceryStore />
          </div>
          <div>Store</div>
        </div>
        {!session ? (
          <div
            className="flex gap-2 items-center cursor-pointer p-5 hover:bg-gray-800 rounded"
            onClick={() => {
              setLoginDropdownSelected(!loginDropdownSelected);
            }}
          >
            <div>
              <MdLogin />
            </div>
            <div>Login</div>
          </div>
        ) : (
          <div className="flex gap-2 items-center cursor-pointer p-5 rounded" onClick={()=>{
            setLoginDropdownSelected(!loginDropdownSelected)
          }}>
            {session.user?.image &&<Image
            src={session.user?.image}
            alt="Hello"
            width={30}
            height={30}
            style={{borderRadius:'100px'}}
            />}
            <text>
                {session.user?.name}
            </text>
          </div>
        )}
        <div>
          <ConnectButton />
        </div>
        {loginDropdownSelected && (
            session?
            <div className="right-70 mt-[3.5rem] bg-blue-800 p-4 rounded cursor-pointer absolute" onClick={()=>{
                signOut()
            }}>
                Sign Out
            </div>:
          <div className="fixed right-15 top-24 bg-blue-800 p-4 rounded">
            <div className="flex flex-col gap-3">
              <div
                className="flex gap-2 items-center cursor-pointer border rounded p-2"
                onClick={() => {
                  signIn("google");
                }}
              >
                <FaGoogle />
                Log In With Google
              </div>
              <div
                className="flex gap-2 items-center cursor-pointer border rounded p-2"
                onClick={() => {
                  signIn("github");
                }}
              >
                <FaGithub />
                Log In With Github
              </div>
              <div
                className="flex gap-2 items-center cursor-pointer border rounded p-2"
                onClick={() => {
                  signIn("twitter");
                }}
              >
                <RiTwitterXFill />
                Log In With Twitter
              </div>
              <div
                className="flex gap-2 items-center cursor-pointer border rounded p-2"
                onClick={() => {
                  signIn("discord");
                }}
              >
                <FaDiscord />
                Log In With Discord
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
