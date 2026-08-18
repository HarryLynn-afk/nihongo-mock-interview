import { DISPLAY_CARD_FIELDS, profile } from "@/lib/content/profile";

export function ProfileCard() {
  return (
    <dl>
      {DISPLAY_CARD_FIELDS.map((field) => (
        <div key={field}>
          <dd>{profile[field]}</dd>
        </div>
      ))}
    </dl>
  );
}
