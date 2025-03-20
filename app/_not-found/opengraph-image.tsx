import { ImageResponse } from "next/og"

export const runtime = "edge"

export const alt = "Página no encontrada - La Pecosa"
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        fontSize: 128,
        background: "white",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ color: "#E53E3E", fontWeight: "bold" }}>404</div>
        <div style={{ color: "#4A5568", fontSize: 48, marginTop: 24 }}>Página no encontrada</div>
      </div>
    </div>,
    {
      ...size,
    },
  )
}

