CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'municipality',
    'citizen',
    'tourist',
    'ngo'
);


--
-- Name: report_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.report_category AS ENUM (
    'waste',
    'pollution',
    'danger',
    'noise',
    'water',
    'air',
    'illegal_dumping',
    'deforestation'
);


--
-- Name: report_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.report_status AS ENUM (
    'pending',
    'in_progress',
    'resolved'
);


--
-- Name: get_user_roles(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_roles(_user_id uuid) RETURNS SETOF public.app_role
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    new.email
  );
  
  -- Assign default role (citizen)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'citizen');
  
  RETURN new;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: cities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    country text DEFAULT 'Morocco'::text NOT NULL,
    latitude numeric(10,8) NOT NULL,
    longitude numeric(11,8) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: ngo_regions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ngo_regions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ngo_user_id uuid NOT NULL,
    city_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    city_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category public.report_category NOT NULL,
    description text NOT NULL,
    latitude numeric(10,8) NOT NULL,
    longitude numeric(11,8) NOT NULL,
    city_id uuid,
    status public.report_status DEFAULT 'pending'::public.report_status,
    photos text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    user_id uuid
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: cities cities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_pkey PRIMARY KEY (id);


--
-- Name: ngo_regions ngo_regions_ngo_user_id_city_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ngo_regions
    ADD CONSTRAINT ngo_regions_ngo_user_id_city_id_key UNIQUE (ngo_user_id, city_id);


--
-- Name: ngo_regions ngo_regions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ngo_regions
    ADD CONSTRAINT ngo_regions_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: reports update_reports_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ngo_regions ngo_regions_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ngo_regions
    ADD CONSTRAINT ngo_regions_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reports reports_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id);


--
-- Name: reports reports_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reports Admins can delete any report; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete any report" ON public.reports FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: cities Admins can delete cities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete cities" ON public.cities FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can delete profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: cities Admins can insert cities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert cities" ON public.cities FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: ngo_regions Admins can manage ngo regions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage ngo regions" ON public.ngo_regions USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can update all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: reports Admins can update all reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all reports" ON public.reports FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: cities Admins can update cities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update cities" ON public.cities FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: cities Anyone can view cities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view cities" ON public.cities FOR SELECT USING (true);


--
-- Name: reports Anyone can view reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view reports" ON public.reports FOR SELECT USING (true);


--
-- Name: reports Authenticated users can create reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can create reports" ON public.reports FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: reports Municipality can update reports in their city; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Municipality can update reports in their city" ON public.reports FOR UPDATE USING ((public.has_role(auth.uid(), 'municipality'::public.app_role) AND (city_id IN ( SELECT profiles.city_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid())))));


--
-- Name: reports NGOs can update reports in assigned regions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "NGOs can update reports in assigned regions" ON public.reports FOR UPDATE USING ((public.has_role(auth.uid(), 'ngo'::public.app_role) AND (city_id IN ( SELECT ngo_regions.city_id
   FROM public.ngo_regions
  WHERE (ngo_regions.ngo_user_id = auth.uid())))));


--
-- Name: reports NGOs can view reports in assigned regions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "NGOs can view reports in assigned regions" ON public.reports FOR SELECT USING ((public.has_role(auth.uid(), 'ngo'::public.app_role) AND (city_id IN ( SELECT ngo_regions.city_id
   FROM public.ngo_regions
  WHERE (ngo_regions.ngo_user_id = auth.uid())))));


--
-- Name: ngo_regions NGOs can view their own regions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "NGOs can view their own regions" ON public.ngo_regions FOR SELECT USING ((auth.uid() = ngo_user_id));


--
-- Name: profiles Users can delete their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own profile" ON public.profiles FOR DELETE USING ((auth.uid() = id));


--
-- Name: reports Users can delete their own reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own reports" ON public.reports FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: reports Users can update their own reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own reports" ON public.reports FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: cities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

--
-- Name: ngo_regions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ngo_regions ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;