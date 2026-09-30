import Image from "next/image";

export function SenseiTile() {
  return (
    <div
      data-testid="sensei-tile"
      className="absolute inset-0 overflow-hidden rounded-2xl border border-eel/10 bg-eel/5"
    >
      <Image
        src="/tanaka-sensei.png"
        alt="Tanaka-sensei"
        fill
        sizes="(min-width: 768px) 56rem, 100vw"
        className="object-cover object-[center_20%]"
        priority
      />
      <div className="absolute left-3 top-3 max-w-[70%] rounded-lg bg-white/85 px-2.5 py-1.5">
        <p className="text-sm font-medium text-eel">
          Tanaka-sensei · AI · Admissions
        </p>
      </div>
    </div>
  );
}
