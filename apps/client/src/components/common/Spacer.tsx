type SpacerProps = {
  height?: number;
  width?: number;
};

export default function Spacer(props: SpacerProps) {
  const { height, width } = props;
  if (width) return <div style={{ width }} className="h-full" />;
  if (height) return <div style={{ height }} className="w-full" />;
}
