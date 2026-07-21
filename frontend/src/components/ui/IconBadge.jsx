"use client";

export default function IconBadge({
  icon: Icon,
  size = "w-12 h-12",
  iconSize = "w-6 h-6",
  className = "",
  iconClassName = "",
  center = false,
}) {
  return (
    <div
      className={[
        "flex items-center justify-center",
        size,
        center ? "mx-auto" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Icon className={[iconSize, iconClassName].filter(Boolean).join(" ")} />
    </div>
  );
}