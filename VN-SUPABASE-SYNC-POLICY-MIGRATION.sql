-- VN RC11 / Engine 25.3.8
-- Provision trip-scoped RLS for Vietnam reference trip without broadening access to other trips.
insert into public.trip_generation (trip_id, generation) values ('ccmv-vietnam-2026', 1) on conflict (trip_id) do nothing;

-- Expenses
drop policy if exists "VN trip members read expenses" on public.trip_expenses;
create policy "VN trip members read expenses" on public.trip_expenses for select to authenticated using (trip_id='ccmv-vietnam-2026');
drop policy if exists "VN trip members add expenses" on public.trip_expenses;
create policy "VN trip members add expenses" on public.trip_expenses for insert to authenticated with check (trip_id='ccmv-vietnam-2026' and auth.uid() is not null);
drop policy if exists "VN trip members update expenses" on public.trip_expenses;
create policy "VN trip members update expenses" on public.trip_expenses for update to authenticated using (trip_id='ccmv-vietnam-2026') with check (trip_id='ccmv-vietnam-2026' and auth.uid() is not null);
drop policy if exists "VN trip admin delete expenses" on public.trip_expenses;
create policy "VN trip admin delete expenses" on public.trip_expenses for delete to authenticated using (trip_id='ccmv-vietnam-2026' and auth.uid() is not null);

-- Moments
drop policy if exists "VN trip members read moments" on public.trip_moments;
create policy "VN trip members read moments" on public.trip_moments for select to authenticated using (trip_id='ccmv-vietnam-2026');
drop policy if exists "VN trip members add moments" on public.trip_moments;
create policy "VN trip members add moments" on public.trip_moments for insert to authenticated with check (trip_id='ccmv-vietnam-2026' and auth.uid() is not null);
drop policy if exists "VN trip members update moments" on public.trip_moments;
create policy "VN trip members update moments" on public.trip_moments for update to authenticated using (trip_id='ccmv-vietnam-2026') with check (trip_id='ccmv-vietnam-2026' and auth.uid() is not null);
drop policy if exists "VN trip admin delete moments" on public.trip_moments;
create policy "VN trip admin delete moments" on public.trip_moments for delete to authenticated using (trip_id='ccmv-vietnam-2026' and auth.uid() is not null);

-- Reset-generation visibility
drop policy if exists "VN trip members read generation" on public.trip_generation;
create policy "VN trip members read generation" on public.trip_generation for select to authenticated using (trip_id='ccmv-vietnam-2026');
