import { ImageResponse } from "next/og";

export type Props = {
  title?: string;
};

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage(props?: Props) {
  const title = props?.title ?? "MetalWolft";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#111",
          color: "#fff",
          fontSize: 64,
          fontWeight: 700,
          letterSpacing: "1.5px",
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>
    ),
    size
  );
}
