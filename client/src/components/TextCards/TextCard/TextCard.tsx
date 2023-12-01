import React from "react";

export default function TextCard({ card }) {
  return <div className="w-[100px] h-[100px]">{card.text}</div>;
}
