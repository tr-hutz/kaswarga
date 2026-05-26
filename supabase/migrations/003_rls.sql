-- Warga
create policy "Allow read warga"
on "public"."warga"
to public
using (true);

create policy "Full access warga"
on "public"."warga"
to public
using (true) 
with check (true);

-- User
create policy "Allow read user"
on "public"."users"
to public
using (true);

create policy "membership_select_own"
on user_membership
for select
using (
  user_id = auth.uid()
);

-- rt
create policy "Allow read rt"
on "public"."rt"
to public
using (true);

-- Pembayaran
create policy "Allow insert pembayaran"
on "public"."pembayaran"
to public
with check (true);

create policy "Allow read pembayaran"
on "public"."pembayaran"
to public
using (true);

create policy "Allow delete pembayaran"
on "public"."pembayaran"
to public
using (true);

-- Konfirmasi pembayaran
create policy "Admin full access"
on "public"."konfirmasi_pembayaran"
to public
using (true);

create policy "Allow warga insert pembayaran"
on "public"."konfirmasi_pembayaran"
to authenticated
with check (true);

create policy "Allow warga read own payment"
on
"public"."konfirmasi_pembayaran"
to public
	using (true);

-- Pengeluaran
create policy "Allow insert pengeluaran"
on "public"."pengeluaran"
to public
with check (true);

create policy "Allow read pengeluaran"
on "public"."pengeluaran"
to public
using (true);

-- Kas Ledger
create policy "Allow read ledger"
on "public"."ledger"
to public
using (true);

create policy "Enable insert for authenticated users only"
on "public"."ledger"
to authenticated
with check (
  true
);