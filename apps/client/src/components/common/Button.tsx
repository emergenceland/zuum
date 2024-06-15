import { ReactNode } from "react";

type ButtonProps = {
  text: string;
  icon?: ReactNode;
  loading?: boolean;
  onClick: () => void;
};

export default function Button(props: ButtonProps) {
  const { text, icon, onClick, loading } = props;
  return (
    <button
      className="relative px-4 py-3 bg-dark rounded-2xl active:bg-opacity-75 "
      onClick={onClick}
    >
      {loading && (
        <div className="absolute flex flex-col items-center justify-center top-0 left-0 right-0 bottom-0">
          <div className="spinner" />
        </div>
      )}
      <div
        className="flex flex-row items-center justify-center gap-2"
        style={{ opacity: loading ? 0 : 1 }}
      >
        {icon && icon}
        <p className="font-bold text-white">{text}</p>
      </div>
    </button>
  );
}
