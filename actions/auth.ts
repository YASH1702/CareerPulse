"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import prisma from "@/lib/db/client";
import { AuthError } from "next-auth";

// ─── Schemas ───────────────────────────────────────────────────────────────

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

// ─── Types ─────────────────────────────────────────────────────────────────

export type ActionResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

// ─── Sign Up ───────────────────────────────────────────────────────────────

export async function signUpAction(
  prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // Validate
  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = parsed.data;

  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      success: false,
      error: "An account with this email already exists.",
    };
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  // Auto sign in after registration
  await signIn("credentials", {
    email,
    password,
    redirect: false,
  });

  redirect("/");
}

// ─── Sign In ───────────────────────────────────────────────────────────────

export async function signInAction(
  prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // Validate
  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const callbackUrl = (formData.get("callbackUrl") as string) || "/";

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, error: "Invalid email or password." };
        default:
          return {
            success: false,
            error: "Something went wrong. Please try again.",
          };
      }
    }
    throw error; // Re-throw redirect errors
  }

  return { success: true };
}

// ─── Sign Out ──────────────────────────────────────────────────────────────

export async function signOutAction() {
  const { signOut } = await import("@/auth");
  await signOut({ redirectTo: "/signin" });
}