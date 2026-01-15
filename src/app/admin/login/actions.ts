"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createAdminSessionToken, verifyAdminPassword } from "@/lib/adminAuth";

const LoginSchema = z.object({
  password: z.string().min(1),
});

export async function loginAction(formData: FormData) {
  console.log(
    "ENV_HAS_ADMIN_PASSWORD",
    Object.prototype.hasOwnProperty.call(process.env, "ADMIN_PASSWORD"),
  );
  console.log(
    "ENV_ADMIN_PASSWORD_LEN",
    process.env.ADMIN_PASSWORD?.length ?? 0,
  );
  if (!process.env.ADMIN_PASSWORD) {
    redirect("/admin/login?error=missing-env");
  }
  const parsed = LoginSchema.safeParse({
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    redirect("/admin/login?error=required");
  }

  if (!verifyAdminPassword(parsed.data.password, process.env.ADMIN_PASSWORD)) {
    redirect("/admin/login?error=invalid");
  }

  const cookieStore = await cookies();
  cookieStore.set("admin_session", createAdminSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/admin");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.set("admin_session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  redirect("/admin/login");
}
