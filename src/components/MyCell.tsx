export default function MyCell({ children, className, style }: { children: React.ReactNode; className?: string, style?: React.CSSProperties }) {
    return (
        <div style={style} className={`flex items-center border border-solid border-slate-400  w-min justify-center text-center p-2 text-xl bg-(--background) bottom-0 ${className || ""}`}>
            {children}
        </div>
    );
}
