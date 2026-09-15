"use client";

import { X } from "lucide-react";

export default function CloseButton({
  id,
  onClick,
  type = "button",
  className = "text-muted hover:text-ink p-2 hover:bg-porcelain rounded-full transition",
  iconClassName = "w-5 h-5",
  icon: Icon = X,
  title,
  children,
}) {
  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      className={className}
      title={title}
      aria-label={title}
    >
      {children ?? <Icon className={iconClassName} />}
    </button>
  );
}
