"use client";

export default function PingDotSpinner() {
  return (
    <span className="relative flex h-8 w-8">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
      <span className="relative inline-flex rounded-full h-8 w-8 bg-gold"></span>
    </span>
  );
}
