import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function nl2br(text: string) {
  return text.replace(/(?:\r\n|\r|\n)/g, "<br />");
}
