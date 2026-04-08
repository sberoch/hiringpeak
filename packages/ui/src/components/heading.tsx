export function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="scroll-m-20 text-2xl font-bold tracking-tight text-ink lg:text-3xl">
      {children}
    </h1>
  );
}

export function Subheading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="scroll-m-20 text-lg font-semibold tracking-tight text-ink lg:text-xl 2xl:text-2xl">
      {children}
    </h2>
  );
}
