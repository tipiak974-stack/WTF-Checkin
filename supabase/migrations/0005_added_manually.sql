-- Distingue les participants ajoutés manuellement (pointage +1, onglet Participants) des imports CSV/XLS.

alter table participants add column if not exists added_manually boolean not null default false;
