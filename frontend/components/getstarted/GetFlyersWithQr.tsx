"use client";

import React from "react";

const FLYERS_URL = "https://www.foodhelpline.org/share";

export default function GetFlyersWithQr() {
  const handleClick = () => {
    window.open(FLYERS_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        fontSize: 13,
        fontWeight: 600,
        color: "#7c3aed",
        textDecoration: "none",
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
      }}
    >
      Get Flyers &rarr;
    </button>
  );
}
