export default function PageContainer({
  children,
  style = {},
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        padding: "clamp(16px, 3vw, 32px) clamp(16px, 3vw, 36px)",
        width: "100%",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
