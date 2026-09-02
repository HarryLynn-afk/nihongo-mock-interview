import Image from "next/image";

export function SenseiTile() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-paper/10 bg-ink">
      <div className="relative aspect-[16/9] min-h-64 w-full md:min-h-96">
        <Image
          src="/tanaka-sensei.png"
          alt="Tanaka-sensei"
          fill
          sizes="(min-width: 768px) 56rem, 100vw"
          className="object-cover"
          priority
        />
        <div className="absolute bottom-3 left-3 max-w-[70%] rounded-lg bg-ink/80 px-3 py-2">
          <p className="font-medium text-paper">Tanaka-sensei · AI · Admissions</p>
          <p className="text-sm text-paper/70">Tokyo Pathway Japanese School</p>
        </div>
      </div>
    </div>
  );
}
