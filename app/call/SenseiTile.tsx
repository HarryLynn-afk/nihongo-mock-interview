import Image from "next/image";

export function SenseiTile() {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-indigo/30 bg-ink">
      <div className="relative aspect-[4/3] w-full">
        <Image
          src="/tanaka-sensei.png"
          alt="Tanaka-sensei"
          fill
          sizes="(min-width: 768px) 28rem, 100vw"
          className="object-cover"
          priority
        />
      </div>
      <div className="px-4 py-3">
        <p className="font-medium text-paper">Tanaka-sensei · AI · Admissions</p>
        <p className="text-sm text-paper/70">Tokyo Pathway Japanese School</p>
      </div>
    </div>
  );
}
