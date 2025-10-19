"use server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function saLogout() {
  const cookieStore = await cookies();

  //   cookieStore.set("id_token", "", {
  //     httpOnly: false,
  //     sameSite: "lax",
  //     path: "/",
  //     secure: process.env.NODE_ENV !== "development" ? true : false,
  //     expires: 0,
  //   });

  cookieStore.set("access_token", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV !== "development" ? true : false,
    expires: 0,
  });

  return redirect("/login");
}
