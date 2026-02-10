--
-- PostgreSQL database dump
--

\restrict oHNeOMPP3W8LxRdomzvQGAOmcnWD7OVl4M7CjLW490kiu8ZPjw6HQKm78f6X6zb

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
\.


--
-- Data for Name: campaign_invites; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.campaign_invites (id, campaign_id, company_id, creator_id, status, created_at, responded_at) FROM stdin;
19	8	36	35	pending	2025-11-28 13:26:07.297995	\N
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
8	36	ghfhfdhfdhgfhfgh	fgdhfgdhfgdhfdghfdghfdhfdghfdghfdghfgh	{ghfhgfd}	hjvhjhj	2025-12-01	1	open	2025-11-28 12:38:29.929827	\N	\N	\N	{tech,lifestyle,beauty,education,finance,health,travel,food,entertainment}	{13-17,18-24,25-34,35-44,45-54,55+}
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
28	35	campaign_invite	Novo convite de campanha!	caio te convidou para a campanha "ghfhfdhfdhgfhfgh"	/creator/invites	f	2025-11-28 13:26:07.432005
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
JXt8HQnUD-buUfk51NMhD08e2pb37d_i	{"cookie": {"path": "/", "expires": null, "httpOnly": true, "originalMaxAge": null}, "passport": {"user": 36}}	2025-11-29 13:44:02
eHKAydIO1GAPDqi3Yq0btHl494aiyPOP	{"cookie": {"path": "/", "expires": null, "httpOnly": true, "originalMaxAge": null}, "passport": {"user": 33}}	2025-11-29 04:17:39
UXz5aYUudSixjb6sNBDRxr2rtz_Nw3w9	{"cookie": {"path": "/", "expires": null, "httpOnly": true, "originalMaxAge": null}, "googleAuthRole": "creator"}	2025-11-29 12:32:30
B1cLGkg0WgfDuBc3TDMJqKjiKy3GuIjZ	{"cookie": {"path": "/", "expires": null, "httpOnly": true, "originalMaxAge": null}, "passport": {"user": 35}}	2025-11-29 13:46:20
QKhQEHH2-Z02qzONeWnWkBvOhnFdUfiw	{"cookie": {"path": "/", "expires": null, "httpOnly": true, "originalMaxAge": null}, "passport": {"user": 34}}	2025-11-29 03:38:58
Y8lzJlKLBkwW6ni1D3VyRTGA3ZMvMtyY	{"cookie": {"path": "/", "expires": null, "httpOnly": true, "originalMaxAge": null}, "passport": {"user": 34}}	2025-11-29 01:20:58
KFHZ0JMcF1plowBaxOQPMdMcKeLw8gXI	{"cookie": {"path": "/", "expires": null, "httpOnly": true, "originalMaxAge": null}}	2025-11-29 01:21:19
bbW_IRsv-9ZSdhZZDT5_HjtR9_3Wy8DC	{"cookie": {"path": "/", "expires": null, "httpOnly": true, "originalMaxAge": null}}	2025-11-29 01:22:02
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, password, role, name, email, avatar, bio, niche, instagram, youtube, tiktok, cpf, phone, company_name, followers, is_verified, verification_token, pix_key, cep, street, number, neighborhood, city, state, complement, google_id, instagram_followers, instagram_following, instagram_posts, instagram_engagement_rate, instagram_authenticity_score, instagram_top_hashtags, instagram_last_updated, instagram_verified, is_banned, gender, portfolio_url, reset_token, reset_token_expiry, date_of_birth, created_at, instagram_top_posts) FROM stdin;
36	3459f8ae4897b713d2ec58530b6122f9c10da8a85542fa69910c5effbd08ca365b695d07adf82d49025aa64963f117d4dafae6e6b9fbcaadd5ccb5fba42e8193.a607e8580508483573139bb404763129	company	caio	caio.massaroni@turbopartners.com.br	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	2025-11-28 12:36:11.23295	\N
37	test_password_hash_not_real	creator	Maria Silva	maria.teste@email.com	https://api.dicebear.com/7.x/avataaars/svg?seed=Maria	Criadora de conteúdo de lifestyle e moda. Apaixonada por compartilhar dicas e inspirações para o dia a dia.	{moda,lifestyle}	@mariasilva_creator	\N	\N	\N	11999998888	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	25000	\N	\N	\N	\N	\N	\N	f	f	female	\N	\N	\N	1995-03-15	2025-11-28 13:41:51.107829	\N
35	53e31870c31b9f0d8bdfd2dba3484fc955b07b83265dda395ac763d2936b737dd58bee0de77b6679d413391a3636aa2afa4e0a3602382c0f907219679263508a.072dbbc17d9d5803b6fa07a6ce8a831e	creator	caio	caiomassaroni@hotmail.com	https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/67237699_745665669224331_1072524363980341248_n.jpg?stp=dst-jpg_e0_s150x150_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby42NDAuYzIifQ&_nc_ht=scontent-iad3-2.cdninstagram.com&_nc_cat=103&_nc_oc=Q6cZ2QERk9Tiba7dDQjIKWrVCiOa3ATXaaFlq6MK8PsgL0Pt-Sfp9iZMwQxpJ5DalG0UToc&_nc_ohc=D3Zk5YMfjiIQ7kNvwFxUxZ4&_nc_gid=FgWr75VmmQlkhOCjea-rbg&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AfjjDBRXHnyU5CRJFsE6VtKvVcOVkRodNqHfz8cVQAvABA&oe=692F57C4&_nc_sid=8b3546	nbnvbncbnvbc	{tech}	caiomassaroni			34243243243243	32432432423	\N	\N	t	\N	fsdfdfsd	29050653	Avenida Carlos Moreira Lima	137	Bento Ferreira	Vitória	ES	até 497 - lado ímpar	\N	666	1406	20	15.09%	70	{broquinho,vapudemonho}	2025-11-28 12:35:32.967	f	f	masculino		\N	\N	2003-06-28	2025-11-28 12:32:43.392868	[{"id": "CRSGEAQjlsf", "url": "https://www.instagram.com/p/CRSGEAQjlsf/", "likes": 122, "caption": "Completando 2 anos incríveis! Você é especial, te amo ❤️", "comments": 14, "imageUrl": "https://scontent-ord5-2.cdninstagram.com/v/t51.29350-15/214362120_336348171319262_7663523254823945646_n.jpg?stp=dst-jpg_e35_s1080x1080_tt6&_nc_ht=scontent-ord5-2.cdninstagram.com&_nc_cat=102&_nc_oc=Q6cZ2QE_RLdDjMwi4CmnjwTAxdFeZp0uEFgGSzBujlu6cMI8bICBYnTn4h7Y16MJME1npkM&_nc_ohc=ZBnmBiDR624Q7kNvwEYvCAg&_nc_gid=V-3_54_LkngbQCII_Uv_Zg&edm=APs17CUBAAAA&ccb=7-5&oh=00_Afgj3d29KbKxMumEcD5wKxf_2zYtWVZFBPY1d-BvndpKDA&oe=692F7D62&_nc_sid=10d13b", "timestamp": "2021-07-13T21:38:28.000Z"}, {"id": "B9SE0P4j-4s", "url": "https://www.instagram.com/p/B9SE0P4j-4s/", "likes": 117, "caption": "Em qualquer lugar do mundo ☺️", "comments": 14, "imageUrl": "https://scontent-atl3-3.cdninstagram.com/v/t51.2885-15/89415931_147608513081122_3675766395309442413_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_ht=scontent-atl3-3.cdninstagram.com&_nc_cat=110&_nc_oc=Q6cZ2QEnaaqH5ugOSJVYAPiIJg3hNknc6Cvz29KeJdh49ocLHBIp-fmQEykhvNyrFfUncE0&_nc_ohc=brcyTG9iv3wQ7kNvwGFHHiw&_nc_gid=whS62H9Kbr2L2hZp0joXJQ&edm=APs17CUBAAAA&ccb=7-5&oh=00_AfjnUanSh3ISLP1i3iiFH-wHgsNofC3mZznRM16-JdYUvQ&oe=692F6FCD&_nc_sid=10d13b", "timestamp": "2020-03-03T18:59:42.000Z"}, {"id": "CaxajTVl01I", "url": "https://www.instagram.com/p/CaxajTVl01I/", "likes": 113, "caption": "🌇", "comments": 17, "imageUrl": "https://instagram.fsac1-2.fna.fbcdn.net/v/t51.29350-15/275393103_105737265325198_1626865816098777295_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_ht=instagram.fsac1-2.fna.fbcdn.net&_nc_cat=110&_nc_oc=Q6cZ2QFU28TG3itCKLnV2-8-T3uRfMK4nOSr181xHKSTQSPP4A5Gjclq1Qo6rq1aTI1FsY17cVKMhUNYhxzbAI2P8ihe&_nc_ohc=HQwqyZeFpmoQ7kNvwF8zRUa&_nc_gid=tTyzLppmgKhXXQdOFG0VkA&edm=APs17CUBAAAA&ccb=7-5&oh=00_Afi64k42Tu9U5TpUv3a2heYDKRI_70A2-Ky8qdZvnm3-Pg&oe=692F5036&_nc_sid=10d13b", "timestamp": "2022-03-06T18:16:31.000Z"}]
\.


--
-- Name: applications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.applications_id_seq', 5, true);


--
-- Name: campaign_invites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.campaign_invites_id_seq', 19, true);


--
-- Name: campaign_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.campaign_templates_id_seq', 1, false);


--
-- Name: campaigns_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.campaigns_id_seq', 8, true);


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

SELECT pg_catalog.setval('public.notifications_id_seq', 28, true);


--
-- Name: problem_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.problem_reports_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 37, true);


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

\unrestrict oHNeOMPP3W8LxRdomzvQGAOmcnWD7OVl4M7CjLW490kiu8ZPjw6HQKm78f6X6zb

