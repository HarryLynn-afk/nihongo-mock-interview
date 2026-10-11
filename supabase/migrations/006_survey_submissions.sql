-- Operational delivery status only. Keep questionnaire answers in the anonymous form.
create table if not exists survey_submissions (
  attempt_id text primary key,
  status text not null check (status in ('sending', 'submitted', 'uncertain'))
);

alter table survey_submissions enable row level security;
