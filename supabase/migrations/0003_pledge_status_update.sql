-- Pitchorium — migration 0003 : autorise le porteur de projet à confirmer la réception d'une contribution
-- (la policy de mise à jour manquait dans la migration 0002, ce qui empêchait "Marquer comme reçu" de fonctionner).

drop policy if exists "Owners update pledges on their projects" on pledges;
create policy "Owners update pledges on their projects"
  on pledges for update using (
    exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid())
  );
