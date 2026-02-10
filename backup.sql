--
-- PostgreSQL database dump
--

\restrict AeXhqxdm627yUELOc8hqJoWHaIURn4AwguDJPwPTNs8mlEkUHIUso3LhjoiAYdb

-- Dumped from database version 16.10 (0374078)
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: applications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.applications (
    id integer NOT NULL,
    campaign_id integer NOT NULL,
    creator_id integer NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    message text,
    applied_at timestamp without time zone DEFAULT now(),
    workflow_status text
);


ALTER TABLE public.applications OWNER TO neondb_owner;

--
-- Name: applications_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.applications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.applications_id_seq OWNER TO neondb_owner;

--
-- Name: applications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.applications_id_seq OWNED BY public.applications.id;


--
-- Name: campaign_invites; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.campaign_invites (
    id integer NOT NULL,
    campaign_id integer NOT NULL,
    company_id integer NOT NULL,
    creator_id integer NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    responded_at timestamp without time zone
);


ALTER TABLE public.campaign_invites OWNER TO neondb_owner;

--
-- Name: campaign_invites_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.campaign_invites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.campaign_invites_id_seq OWNER TO neondb_owner;

--
-- Name: campaign_invites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.campaign_invites_id_seq OWNED BY public.campaign_invites.id;


--
-- Name: campaign_templates; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.campaign_templates (
    id integer NOT NULL,
    company_id integer NOT NULL,
    name text NOT NULL,
    description text,
    title text NOT NULL,
    campaign_description text NOT NULL,
    requirements text[] NOT NULL,
    budget text NOT NULL,
    deadline text NOT NULL,
    creators_needed integer NOT NULL,
    target_niche text[],
    target_age_ranges text[],
    target_gender text,
    briefing_text text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.campaign_templates OWNER TO neondb_owner;

--
-- Name: campaign_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.campaign_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.campaign_templates_id_seq OWNER TO neondb_owner;

--
-- Name: campaign_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.campaign_templates_id_seq OWNED BY public.campaign_templates.id;


--
-- Name: campaigns; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.campaigns (
    id integer NOT NULL,
    company_id integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    requirements text[] NOT NULL,
    budget text NOT NULL,
    deadline text NOT NULL,
    creators_needed integer NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    briefing_text text,
    briefing_materials text[],
    target_gender text,
    target_niche text[],
    target_age_ranges text[]
);


ALTER TABLE public.campaigns OWNER TO neondb_owner;

--
-- Name: campaigns_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.campaigns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.campaigns_id_seq OWNER TO neondb_owner;

--
-- Name: campaigns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.campaigns_id_seq OWNED BY public.campaigns.id;


--
-- Name: contracts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.contracts (
    id integer NOT NULL,
    application_id integer NOT NULL,
    campaign_id integer NOT NULL,
    company_id integer NOT NULL,
    creator_id integer NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    company_approved boolean DEFAULT false NOT NULL,
    creator_approved boolean DEFAULT false NOT NULL,
    contract_value text NOT NULL,
    service_description text NOT NULL,
    deliverables text[] NOT NULL,
    payment_terms text,
    additional_clauses text,
    assinafy_document_id text,
    assinafy_sign_url text,
    signed_document_url text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    approved_at timestamp without time zone,
    signed_at timestamp without time zone,
    company_signed boolean DEFAULT false NOT NULL,
    creator_signed boolean DEFAULT false NOT NULL,
    assinafy_company_sign_url text,
    assinafy_creator_sign_url text
);


ALTER TABLE public.contracts OWNER TO neondb_owner;

--
-- Name: contracts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.contracts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contracts_id_seq OWNER TO neondb_owner;

--
-- Name: contracts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.contracts_id_seq OWNED BY public.contracts.id;


--
-- Name: deliverable_comments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.deliverable_comments (
    id integer NOT NULL,
    deliverable_id integer NOT NULL,
    user_id integer NOT NULL,
    comment text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.deliverable_comments OWNER TO neondb_owner;

--
-- Name: deliverable_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.deliverable_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.deliverable_comments_id_seq OWNER TO neondb_owner;

--
-- Name: deliverable_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.deliverable_comments_id_seq OWNED BY public.deliverable_comments.id;


--
-- Name: deliverables; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.deliverables (
    id integer NOT NULL,
    application_id integer NOT NULL,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_type text,
    description text,
    uploaded_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.deliverables OWNER TO neondb_owner;

--
-- Name: deliverables_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.deliverables_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.deliverables_id_seq OWNER TO neondb_owner;

--
-- Name: deliverables_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.deliverables_id_seq OWNED BY public.deliverables.id;


--
-- Name: favorite_creators; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.favorite_creators (
    id integer NOT NULL,
    company_id integer NOT NULL,
    creator_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.favorite_creators OWNER TO neondb_owner;

--
-- Name: favorite_creators_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.favorite_creators_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.favorite_creators_id_seq OWNER TO neondb_owner;

--
-- Name: favorite_creators_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.favorite_creators_id_seq OWNED BY public.favorite_creators.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    application_id integer NOT NULL,
    sender_id integer NOT NULL,
    receiver_id integer NOT NULL,
    content text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.messages OWNER TO neondb_owner;

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO neondb_owner;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    action_url text,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: problem_reports; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.problem_reports (
    id integer NOT NULL,
    user_id integer NOT NULL,
    subject text NOT NULL,
    description text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    admin_notes text,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.problem_reports OWNER TO neondb_owner;

--
-- Name: problem_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.problem_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.problem_reports_id_seq OWNER TO neondb_owner;

--
-- Name: problem_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.problem_reports_id_seq OWNED BY public.problem_reports.id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.session (
    sid text NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    password text,
    role text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    avatar text,
    bio text,
    niche text[],
    instagram text,
    youtube text,
    tiktok text,
    cpf text,
    phone text,
    company_name text,
    followers text,
    is_verified boolean DEFAULT false NOT NULL,
    verification_token text,
    pix_key text,
    cep text,
    street text,
    number text,
    neighborhood text,
    city text,
    state text,
    complement text,
    google_id text,
    instagram_followers integer,
    instagram_following integer,
    instagram_posts integer,
    instagram_engagement_rate text,
    instagram_authenticity_score integer,
    instagram_top_hashtags text[],
    instagram_last_updated timestamp without time zone,
    instagram_verified boolean,
    is_banned boolean DEFAULT false NOT NULL,
    gender text,
    portfolio_url text,
    reset_token text,
    reset_token_expiry timestamp without time zone,
    date_of_birth date,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    instagram_top_posts jsonb
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: applications id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.applications ALTER COLUMN id SET DEFAULT nextval('public.applications_id_seq'::regclass);


--
-- Name: campaign_invites id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.campaign_invites ALTER COLUMN id SET DEFAULT nextval('public.campaign_invites_id_seq'::regclass);


--
-- Name: campaign_templates id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.campaign_templates ALTER COLUMN id SET DEFAULT nextval('public.campaign_templates_id_seq'::regclass);


--
-- Name: campaigns id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.campaigns ALTER COLUMN id SET DEFAULT nextval('public.campaigns_id_seq'::regclass);


--
-- Name: contracts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contracts ALTER COLUMN id SET DEFAULT nextval('public.contracts_id_seq'::regclass);


--
-- Name: deliverable_comments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.deliverable_comments ALTER COLUMN id SET DEFAULT nextval('public.deliverable_comments_id_seq'::regclass);


--
-- Name: deliverables id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.deliverables ALTER COLUMN id SET DEFAULT nextval('public.deliverables_id_seq'::regclass);


--
-- Name: favorite_creators id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.favorite_creators ALTER COLUMN id SET DEFAULT nextval('public.favorite_creators_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: problem_reports id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.problem_reports ALTER COLUMN id SET DEFAULT nextval('public.problem_reports_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: applications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.applications (id, campaign_id, creator_id, status, message, applied_at, workflow_status) FROM stdin;
4	3	3	pending		2025-12-01 02:20:38.581446	\N
\.


--
-- Data for Name: campaign_invites; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.campaign_invites (id, campaign_id, company_id, creator_id, status, created_at, responded_at) FROM stdin;
\.


--
-- Data for Name: campaign_templates; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.campaign_templates (id, company_id, name, description, title, campaign_description, requirements, budget, deadline, creators_needed, target_niche, target_age_ranges, target_gender, briefing_text, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: campaigns; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.campaigns (id, company_id, title, description, requirements, budget, deadline, creators_needed, status, created_at, briefing_text, briefing_materials, target_gender, target_niche, target_age_ranges) FROM stdin;
3	4	gfdgfdg	fdgfdgfd gfd fdg fdg fd gfdgfd gd gfd gdfg df	{}	hjjhg	2025-11-25	1	open	2025-12-01 02:20:21.637711	\N	\N	\N	{tech,lifestyle,beauty,education,finance,health,travel,food,entertainment}	{13-17,18-24,25-34,35-44,45-54,55+}
\.


--
-- Data for Name: contracts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.contracts (id, application_id, campaign_id, company_id, creator_id, status, company_approved, creator_approved, contract_value, service_description, deliverables, payment_terms, additional_clauses, assinafy_document_id, assinafy_sign_url, signed_document_url, created_at, approved_at, signed_at, company_signed, creator_signed, assinafy_company_sign_url, assinafy_creator_sign_url) FROM stdin;
\.


--
-- Data for Name: deliverable_comments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.deliverable_comments (id, deliverable_id, user_id, comment, created_at) FROM stdin;
\.


--
-- Data for Name: deliverables; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.deliverables (id, application_id, file_name, file_url, file_type, description, uploaded_at) FROM stdin;
\.


--
-- Data for Name: favorite_creators; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.favorite_creators (id, company_id, creator_id, created_at) FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.messages (id, application_id, sender_id, receiver_id, content, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notifications (id, user_id, type, title, message, action_url, is_read, created_at) FROM stdin;
10	3	new_campaign	Nova campanha disponível	Caio Massaroni publicou uma nova campanha: "gfdgfdg"	/campaign/3	f	2025-12-01 02:20:22.006605
11	4	new_applicant	Nova candidatura recebida	Caio Massaroni se candidatou para a campanha "gfdgfdg"	/campaign/3/manage	f	2025-12-01 02:20:38.720014
\.


--
-- Data for Name: problem_reports; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.problem_reports (id, user_id, subject, description, status, created_at, admin_notes, updated_at) FROM stdin;
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.session (sid, sess, expire) FROM stdin;
pwF3MUgnRzRViNzUXr5BDr0f_kHIT2b4	{"cookie": {"path": "/", "expires": null, "httpOnly": true, "originalMaxAge": null}, "passport": {"user": 3}}	2025-12-02 02:21:17
ij6gCUMMCXTHWc61f-nGOMynY13Uk7P2	{"cookie": {"path": "/", "expires": null, "httpOnly": true, "originalMaxAge": null}, "passport": {"user": 4}}	2025-12-02 02:20:41
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, password, role, name, email, avatar, bio, niche, instagram, youtube, tiktok, cpf, phone, company_name, followers, is_verified, verification_token, pix_key, cep, street, number, neighborhood, city, state, complement, google_id, instagram_followers, instagram_following, instagram_posts, instagram_engagement_rate, instagram_authenticity_score, instagram_top_hashtags, instagram_last_updated, instagram_verified, is_banned, gender, portfolio_url, reset_token, reset_token_expiry, date_of_birth, created_at, instagram_top_posts) FROM stdin;
4	\N	company	Caio Massaroni	caiomassaroni7@gmail.com	https://lh3.googleusercontent.com/a/ACg8ocJQcDDQVxrnKY3U9FF5T2eAk1-uqMKZVGf55owIECAxRsoepsb0=s96-c	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	107148448965105679667	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	2025-12-01 02:19:19.534086	\N
3	\N	creator	Caio Massaroni	caio.massaroni@turbopartners.com.br	https://lh3.googleusercontent.com/a-/ALV-UjVyq5zeVsbCbRIlz7Q9ArJoyvpQ1-ibAOL2bHw9EUiyhmaJlOCx39MrXZOygtGGZcPyT6o9Ehmrswh7AYsu9n-M-O4ZmhknJ0Tc6-TWOnj7S5LjuIogn2TqdO4uWF8bqZiWx4hcI3TENWq0cMgflATx0Fprq5BEXH2_2lJ9VjoqsxzwqS3YAv-g1KCSU7ehs07m06t11p3MeIM4BT0U-bBGSfnsgAjw__P9ENzmMb28fL001zkuV_qNj6iZ3y6RnVAPGhouvpUdqIiKli4McG_5q0QO6OYEgKJ49aSNnVvl7gM1MEhhM0XtY7hKmak_nIGVTRMGKBYhcQ0zUJYI27RmpttSh6N4E0Dh6kc7ogKQ2kuPNpUEfXrFTWcbAyFZCeftKo9JT6-bk_OMaWU4iydvlQmS5nasjEhSs2St32DvqT7ituyF6z6DrH2sDO1xB4Z0IFb3FFCcqiX4y3-ECOCkL8DbjN9dAF1KE03KKeSZH-Mx6B2rcZbNnj_SvltUQywtrD5w5J1vyuu6CYrhiRLi7Uzgd5GnX6SNNZlf1vUeFXhX00ft9SZr3CXumf5ZGeIojl0DcKyDn6ywrRbF8Q0UXv0CNfVFg8Jakf2qWFckclHZpNlBaepAWg5-DCpiFfrigKd5EQxFEdlYENP3HfYpYFFAYQDTzjclb63kF7kxCWrtx13J3T2PJ_bfBWAn0ej-H6vYA93oaKOWhLiMDgwqt5qqtjVtxBC6sOmzUpnUonp7Ycx6AWvPSpLW7qEKCMS53clf36qXj9LSl1fxYrNLPbAExS31lYmVkEhreu-Mc4i_c2AFWQYXgOJvm3oskmnxRyxWIq6mOunHP02v4DbIhBGj4Xv08t8hdhTnuNW2Cs47Ob_B07fSx1d7OEzqkipnucBaWcU_Nd1q-j1B3gHYAhk6N3uxctjlmGoixv5F6IyeNYZbcWGsrtsCu9WiwAwVyOSV1W0YKvqgoQPWAH3456CgMgkHDWWoufT44SKP_SKe6c40pHhDoGi5VcFKUrucH3S-kXNRBssrZ9xjvFAv1-me3MnmPc7UH_n-T97rCjRGBeORsu0=s96-c	Hshsbshsh	{tech}	caiomassaroni			73737373737373	47747474747	\N	\N	t	\N	Hshs	29050653	Avenida Carlos Moreira Lima	3773	Bento Ferreira	Vitória	ES	até 497 - lado ímpar	104577171413524596324	\N	\N	\N	0%	15	{}	2025-12-01 02:13:31.101	f	f	masculino		\N	\N	1990-11-19	2025-12-01 02:12:16.073965	[]
\.


--
-- Name: applications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.applications_id_seq', 4, true);


--
-- Name: campaign_invites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.campaign_invites_id_seq', 1, true);


--
-- Name: campaign_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.campaign_templates_id_seq', 1, false);


--
-- Name: campaigns_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.campaigns_id_seq', 3, true);


--
-- Name: contracts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.contracts_id_seq', 1, true);


--
-- Name: deliverable_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.deliverable_comments_id_seq', 1, false);


--
-- Name: deliverables_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.deliverables_id_seq', 1, false);


--
-- Name: favorite_creators_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.favorite_creators_id_seq', 1, false);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.messages_id_seq', 1, false);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.notifications_id_seq', 11, true);


--
-- Name: problem_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.problem_reports_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 4, true);


--
-- Name: applications applications_campaign_id_creator_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_campaign_id_creator_id_unique UNIQUE (campaign_id, creator_id);


--
-- Name: applications applications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (id);


--
-- Name: campaign_invites campaign_invites_campaign_id_creator_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.campaign_invites
    ADD CONSTRAINT campaign_invites_campaign_id_creator_id_unique UNIQUE (campaign_id, creator_id);


--
-- Name: campaign_invites campaign_invites_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.campaign_invites
    ADD CONSTRAINT campaign_invites_pkey PRIMARY KEY (id);


--
-- Name: campaign_templates campaign_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.campaign_templates
    ADD CONSTRAINT campaign_templates_pkey PRIMARY KEY (id);


--
-- Name: campaigns campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_pkey PRIMARY KEY (id);


--
-- Name: contracts contracts_application_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_application_id_unique UNIQUE (application_id);


--
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (id);


--
-- Name: deliverable_comments deliverable_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.deliverable_comments
    ADD CONSTRAINT deliverable_comments_pkey PRIMARY KEY (id);


--
-- Name: deliverables deliverables_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.deliverables
    ADD CONSTRAINT deliverables_pkey PRIMARY KEY (id);


--
-- Name: favorite_creators favorite_creators_company_id_creator_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.favorite_creators
    ADD CONSTRAINT favorite_creators_company_id_creator_id_unique UNIQUE (company_id, creator_id);


--
-- Name: favorite_creators favorite_creators_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.favorite_creators
    ADD CONSTRAINT favorite_creators_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: problem_reports problem_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.problem_reports
    ADD CONSTRAINT problem_reports_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: applications applications_campaign_id_campaigns_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_campaign_id_campaigns_id_fk FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id);


--
-- Name: applications applications_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id);


--
-- Name: campaign_invites campaign_invites_campaign_id_campaigns_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.campaign_invites
    ADD CONSTRAINT campaign_invites_campaign_id_campaigns_id_fk FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id);


--
-- Name: campaign_invites campaign_invites_company_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.campaign_invites
    ADD CONSTRAINT campaign_invites_company_id_users_id_fk FOREIGN KEY (company_id) REFERENCES public.users(id);


--
-- Name: campaign_invites campaign_invites_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.campaign_invites
    ADD CONSTRAINT campaign_invites_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id);


--
-- Name: campaign_templates campaign_templates_company_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.campaign_templates
    ADD CONSTRAINT campaign_templates_company_id_users_id_fk FOREIGN KEY (company_id) REFERENCES public.users(id);


--
-- Name: campaigns campaigns_company_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_company_id_users_id_fk FOREIGN KEY (company_id) REFERENCES public.users(id);


--
-- Name: contracts contracts_application_id_applications_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_application_id_applications_id_fk FOREIGN KEY (application_id) REFERENCES public.applications(id);


--
-- Name: contracts contracts_campaign_id_campaigns_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_campaign_id_campaigns_id_fk FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id);


--
-- Name: contracts contracts_company_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_company_id_users_id_fk FOREIGN KEY (company_id) REFERENCES public.users(id);


--
-- Name: contracts contracts_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id);


--
-- Name: deliverable_comments deliverable_comments_deliverable_id_deliverables_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.deliverable_comments
    ADD CONSTRAINT deliverable_comments_deliverable_id_deliverables_id_fk FOREIGN KEY (deliverable_id) REFERENCES public.deliverables(id);


--
-- Name: deliverable_comments deliverable_comments_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.deliverable_comments
    ADD CONSTRAINT deliverable_comments_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: deliverables deliverables_application_id_applications_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.deliverables
    ADD CONSTRAINT deliverables_application_id_applications_id_fk FOREIGN KEY (application_id) REFERENCES public.applications(id);


--
-- Name: favorite_creators favorite_creators_company_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.favorite_creators
    ADD CONSTRAINT favorite_creators_company_id_users_id_fk FOREIGN KEY (company_id) REFERENCES public.users(id);


--
-- Name: favorite_creators favorite_creators_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.favorite_creators
    ADD CONSTRAINT favorite_creators_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id);


--
-- Name: messages messages_application_id_applications_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_application_id_applications_id_fk FOREIGN KEY (application_id) REFERENCES public.applications(id);


--
-- Name: messages messages_receiver_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_receiver_id_users_id_fk FOREIGN KEY (receiver_id) REFERENCES public.users(id);


--
-- Name: messages messages_sender_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_users_id_fk FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: notifications notifications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: problem_reports problem_reports_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.problem_reports
    ADD CONSTRAINT problem_reports_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict AeXhqxdm627yUELOc8hqJoWHaIURn4AwguDJPwPTNs8mlEkUHIUso3LhjoiAYdb

