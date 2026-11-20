"use client";
import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { transitionTo } from "./Curtain";

type Props = LinkProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
  children: ReactNode;
  /** Word shown on the transition curtain. */
  curtainLabel?: string;
};

/** A real <a href> (crawlable, middle-click and keyboard friendly) that plays the curtain transition on plain clicks. */
export default function TransitionLink({ href, onClick, curtainLabel, children, ...rest }: Props) {
  const handle = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || rest.target === "_blank") return;
    const url = typeof href === "string" ? href : href.pathname ?? "/";
    if (/^(https?:|mailto:|tel:)/.test(url)) return;
    event.preventDefault();
    transitionTo(url, curtainLabel);
  };
  return <Link href={href} onClick={handle} {...rest}>{children}</Link>;
}
