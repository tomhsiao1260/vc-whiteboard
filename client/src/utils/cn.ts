import { cx } from "@emotion/css";
import { twMerge } from "tailwind-merge";

const cn = (...args: string[]): string => {
  return cx(twMerge(...args));
};

export { cn };
