-- Catégories libres par événement (remplace le statut fixe Participant/VIP/Encadrant/Big
-- Boss/Staff) + archivage d'événement.

alter table events add column if not exists categories_list jsonb;

-- Les événements déjà créés gardent leur liste historique telle quelle — rien ne change
-- visuellement pour eux. Seules les lignes sans valeur (nouvelles installations) prendront
-- le défaut ci-dessous.
update events
set categories_list = '["Participant","VIP","Encadrant","Big Boss","Staff"]'::jsonb
where categories_list is null;

alter table events alter column categories_list set default '["Participant","Client","Staff client"]'::jsonb;
alter table events alter column categories_list set not null;

alter table events add column if not exists archived boolean not null default false;

-- participants.status : ENUM figé à 5 valeurs -> texte libre, puisque les catégories sont
-- désormais définies par événement (categories_list) plutôt qu'imposées globalement.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'participants' and column_name = 'status' and udt_name = 'participant_status'
  ) then
    alter table participants alter column status drop default;
    alter table participants alter column status type text using status::text;
    alter table participants alter column status set default 'Participant';
  end if;
end $$;

drop type if exists participant_status;
