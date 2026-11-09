-- ============================================================
-- CampusFind — Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── ENUMS ───────────────────────────────────────────────────────────────────

CREATE TYPE user_role     AS ENUM ('student', 'faculty', 'staff', 'admin');
CREATE TYPE item_type     AS ENUM ('lost', 'found');
CREATE TYPE item_status   AS ENUM ('active', 'claimed', 'resolved', 'expired', 'removed');
CREATE TYPE claim_status  AS ENUM ('pending', 'approved', 'rejected', 'withdrawn');
CREATE TYPE notif_type    AS ENUM ('claim_submitted', 'claim_approved', 'claim_rejected', 'item_matched', 'item_resolved', 'general');

-- ─── PROFILES ────────────────────────────────────────────────────────────────

CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  phone         TEXT,
  role          user_role NOT NULL DEFAULT 'student',
  department    TEXT,
  student_id    TEXT,
  avatar_url    TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── CATEGORIES ──────────────────────────────────────────────────────────────

CREATE TABLE public.categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  icon        TEXT NOT NULL DEFAULT 'package',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.categories (name, slug, icon) VALUES
  ('Electronics',   'electronics',  'smartphone'),
  ('Clothing',      'clothing',     'shirt'),
  ('Bags & Wallets','bags',         'briefcase'),
  ('Books & Notes', 'books',        'book-open'),
  ('Accessories',   'accessories',  'watch'),
  ('Keys & Cards',  'keys',         'key'),
  ('Documents & ID','documents',    'file-text'),
  ('Sports & Gym',  'sports',       'activity'),
  ('Other',         'other',        'package');

-- ─── LOCATIONS ────────────────────────────────────────────────────────────────

CREATE TABLE public.locations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  building    TEXT,
  floor       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.locations (name) VALUES
  ('Main Block'), ('Library'), ('Canteen'), ('Seminar Hall'),
  ('Computer Lab'), ('Electronics Lab'), ('Mechanical Lab'), ('Civil Lab'),
  ('Basketball Court'), ('Football Ground'), ('Hostel Block A'),
  ('Hostel Block B'), ('Chapel'), ('Admin Block'), ('Parking Area'),
  ('Bus Stop'), ('Other');

-- ─── ITEMS ───────────────────────────────────────────────────────────────────

CREATE TABLE public.items (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type               item_type NOT NULL,
  title              TEXT NOT NULL,
  description        TEXT NOT NULL,
  category_id        UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  location_id        UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  location_detail    TEXT,                           -- free-text supplement
  date_occurred      DATE NOT NULL,
  status             item_status NOT NULL DEFAULT 'active',
  images             TEXT[] NOT NULL DEFAULT '{}',   -- storage paths
  private_details    TEXT,                           -- never shown publicly
  contact_preference TEXT NOT NULL DEFAULT 'platform',
  reported_by        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resolved_at        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_items_type        ON public.items(type);
CREATE INDEX idx_items_status      ON public.items(status);
CREATE INDEX idx_items_category    ON public.items(category_id);
CREATE INDEX idx_items_location    ON public.items(location_id);
CREATE INDEX idx_items_reported_by ON public.items(reported_by);
CREATE INDEX idx_items_created_at  ON public.items(created_at DESC);

-- ─── CLAIMS ──────────────────────────────────────────────────────────────────

CREATE TABLE public.claims (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id            UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  claimant_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  proof_description  TEXT NOT NULL,
  proof_images       TEXT[] NOT NULL DEFAULT '{}',
  status             claim_status NOT NULL DEFAULT 'pending',
  admin_notes        TEXT,
  reviewed_by        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(item_id, claimant_id)   -- one claim per user per item
);

CREATE INDEX idx_claims_item_id     ON public.claims(item_id);
CREATE INDEX idx_claims_claimant_id ON public.claims(claimant_id);
CREATE INDEX idx_claims_status      ON public.claims(status);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        notif_type NOT NULL DEFAULT 'general',
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  link        TEXT,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

-- ─── UPDATED_AT TRIGGERS ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_items_updated_at    BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_claims_updated_at   BEFORE UPDATE ON public.claims
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── AUTO-CREATE PROFILE ON SIGNUP ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────

ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Public profiles are viewable by everyone"    ON public.profiles FOR SELECT USING (TRUE);
CREATE POLICY "Users can update their own profile"          ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- categories & locations (read-only for all, write for admins)
CREATE POLICY "Categories viewable by everyone"             ON public.categories FOR SELECT USING (TRUE);
CREATE POLICY "Locations viewable by everyone"              ON public.locations   FOR SELECT USING (TRUE);

-- items — public SELECT (excluding private_details), restricted INSERT/UPDATE/DELETE
CREATE POLICY "Items viewable by everyone"
  ON public.items FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can create items"
  ON public.items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = reported_by);

CREATE POLICY "Owners and admins can update items"
  ON public.items FOR UPDATE
  USING (
    auth.uid() = reported_by
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Owners and admins can delete items"
  ON public.items FOR DELETE
  USING (
    auth.uid() = reported_by
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- claims — claimants see their own; admins see all
CREATE POLICY "Users can view their own claims"
  ON public.claims FOR SELECT
  USING (
    auth.uid() = claimant_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.items WHERE id = item_id AND reported_by = auth.uid())
  );

CREATE POLICY "Authenticated users can submit claims"
  ON public.claims FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = claimant_id);

CREATE POLICY "Admins can update claims"
  ON public.claims FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can withdraw their own pending claims"
  ON public.claims FOR UPDATE
  USING (auth.uid() = claimant_id AND status = 'pending');

-- notifications — users see only their own
CREATE POLICY "Users see their own notifications"
  ON public.notifications FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "Users can mark their own as read"
  ON public.notifications FOR UPDATE  USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT  WITH CHECK (TRUE);

-- ─── REALTIME ─────────────────────────────────────────────────────────────────
-- Enable realtime for the tables that need live updates:
-- In Supabase Dashboard → Database → Replication → enable for: items, claims, notifications

-- ─── STORAGE BUCKETS ─────────────────────────────────────────────────────────
-- Run this separately after enabling storage:

-- INSERT INTO storage.buckets (id, name, public) VALUES ('item-images', 'item-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('claim-proofs', 'claim-proofs', false);
--
-- CREATE POLICY "Anyone can read item images"
--   ON storage.objects FOR SELECT USING (bucket_id = 'item-images');
-- CREATE POLICY "Authenticated users can upload item images"
--   ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'item-images' AND auth.uid() IS NOT NULL);
-- CREATE POLICY "Users can delete own item images"
--   ON storage.objects FOR DELETE USING (bucket_id = 'item-images' AND auth.uid()::text = (storage.foldername(name))[1]);

