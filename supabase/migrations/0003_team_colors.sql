-- Couleurs d'équipe par événement (palette éditable) + couleur assignée par participant.

alter table events add column if not exists colors_list jsonb not null default
  '[{"name":"Bleu","hex":"#2a78d6"},{"name":"Rouge","hex":"#e34948"},{"name":"Vert","hex":"#008300"},{"name":"Jaune","hex":"#eda100"},{"name":"Noir","hex":"#171412"},{"name":"Orange","hex":"#eb6834"}]'::jsonb;

alter table participants add column if not exists team_color text;
