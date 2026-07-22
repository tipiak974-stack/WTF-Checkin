-- Aligne le défaut de colors_list sur le nouveau preset (Bleu/Vert/Rouge/Jaune/Noir/Orange).
-- Ne modifie pas les lignes existantes, seulement les futures insertions (même logique que 0002).

alter table events alter column colors_list set default
  '[{"name":"Bleu","hex":"#0066FF"},{"name":"Vert","hex":"#00AA00"},{"name":"Rouge","hex":"#FF0000"},{"name":"Jaune","hex":"#FFD700"},{"name":"Noir","hex":"#000000"},{"name":"Orange","hex":"#FF8C00"}]'::jsonb;
