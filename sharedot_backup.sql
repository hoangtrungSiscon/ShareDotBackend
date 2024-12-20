--
-- PostgreSQL database dump
--

-- Dumped from database version 16.4
-- Dumped by pg_dump version 16.4

-- Started on 2024-12-19 13:50:58

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

--
-- TOC entry 5 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: azure_pg_admin
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO azure_pg_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 235 (class 1259 OID 24760)
-- Name: categories; Type: TABLE; Schema: public; Owner: minhtrung
--

CREATE TABLE public.categories (
    categoryid integer NOT NULL,
    categoryname character varying(255) NOT NULL,
    mainsubjectid integer NOT NULL,
    parentcategoryid integer,
    slug character varying(255)
);


ALTER TABLE public.categories OWNER TO minhtrung;

--
-- TOC entry 236 (class 1259 OID 24765)
-- Name: categories_categoryid_seq; Type: SEQUENCE; Schema: public; Owner: minhtrung
--

CREATE SEQUENCE public.categories_categoryid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_categoryid_seq OWNER TO minhtrung;

--
-- TOC entry 4377 (class 0 OID 0)
-- Dependencies: 236
-- Name: categories_categoryid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: minhtrung
--

ALTER SEQUENCE public.categories_categoryid_seq OWNED BY public.categories.categoryid;


--
-- TOC entry 237 (class 1259 OID 24766)
-- Name: chapters; Type: TABLE; Schema: public; Owner: minhtrung
--

CREATE TABLE public.chapters (
    chapterid integer NOT NULL,
    chaptername character varying(255) NOT NULL,
    chapterorder integer NOT NULL,
    categoryid integer NOT NULL,
    slug character varying(255)
);


ALTER TABLE public.chapters OWNER TO minhtrung;

--
-- TOC entry 238 (class 1259 OID 24771)
-- Name: chapters_chapterid_seq; Type: SEQUENCE; Schema: public; Owner: minhtrung
--

CREATE SEQUENCE public.chapters_chapterid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chapters_chapterid_seq OWNER TO minhtrung;

--
-- TOC entry 4378 (class 0 OID 0)
-- Dependencies: 238
-- Name: chapters_chapterid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: minhtrung
--

ALTER SEQUENCE public.chapters_chapterid_seq OWNED BY public.chapters.chapterid;


--
-- TOC entry 239 (class 1259 OID 24772)
-- Name: companies; Type: TABLE; Schema: public; Owner: minhtrung
--

CREATE TABLE public.companies (
    companyid integer NOT NULL,
    companyname character varying(255) NOT NULL,
    description text,
    contactinfo character varying(255),
    imagepath character varying(500)
);


ALTER TABLE public.companies OWNER TO minhtrung;

--
-- TOC entry 240 (class 1259 OID 24777)
-- Name: companies_companyid_seq; Type: SEQUENCE; Schema: public; Owner: minhtrung
--

CREATE SEQUENCE public.companies_companyid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.companies_companyid_seq OWNER TO minhtrung;

--
-- TOC entry 4379 (class 0 OID 0)
-- Dependencies: 240
-- Name: companies_companyid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: minhtrung
--

ALTER SEQUENCE public.companies_companyid_seq OWNED BY public.companies.companyid;


--
-- TOC entry 241 (class 1259 OID 24778)
-- Name: documentinteractions; Type: TABLE; Schema: public; Owner: minhtrung
--

CREATE TABLE public.documentinteractions (
    interactionid integer NOT NULL,
    userid integer NOT NULL,
    documentid integer NOT NULL,
    isliked boolean DEFAULT false,
    isbookmarked boolean DEFAULT false,
    viewdate timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    likedate timestamp with time zone,
    bookmarkdate timestamp with time zone,
    isfinishedreading boolean DEFAULT false
);


ALTER TABLE public.documentinteractions OWNER TO minhtrung;

--
-- TOC entry 242 (class 1259 OID 24785)
-- Name: documentinteractions_interactionid_seq; Type: SEQUENCE; Schema: public; Owner: minhtrung
--

CREATE SEQUENCE public.documentinteractions_interactionid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documentinteractions_interactionid_seq OWNER TO minhtrung;

--
-- TOC entry 4380 (class 0 OID 0)
-- Dependencies: 242
-- Name: documentinteractions_interactionid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: minhtrung
--

ALTER SEQUENCE public.documentinteractions_interactionid_seq OWNED BY public.documentinteractions.interactionid;


--
-- TOC entry 243 (class 1259 OID 24786)
-- Name: documents; Type: TABLE; Schema: public; Owner: minhtrung
--

CREATE TABLE public.documents (
    documentid integer NOT NULL,
    title character varying(255) NOT NULL,
    filetype character varying(10) NOT NULL,
    filepath character varying(500) NOT NULL,
    filesize bigint NOT NULL,
    accesslevel character varying(20) DEFAULT 'Public'::character varying NOT NULL,
    status character varying(20) DEFAULT 'Pending'::character varying NOT NULL,
    description character varying(500),
    viewcount integer DEFAULT 0 NOT NULL,
    likecount integer DEFAULT 0 NOT NULL,
    pointcost integer DEFAULT 0 NOT NULL,
    chapterid integer NOT NULL,
    slug character varying(255) NOT NULL,
    isactive integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.documents OWNER TO minhtrung;

--
-- TOC entry 244 (class 1259 OID 24797)
-- Name: documents_documentid_seq; Type: SEQUENCE; Schema: public; Owner: minhtrung
--

CREATE SEQUENCE public.documents_documentid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documents_documentid_seq OWNER TO minhtrung;

--
-- TOC entry 4381 (class 0 OID 0)
-- Dependencies: 244
-- Name: documents_documentid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: minhtrung
--

ALTER SEQUENCE public.documents_documentid_seq OWNED BY public.documents.documentid;


--
-- TOC entry 245 (class 1259 OID 24798)
-- Name: mainsubjects; Type: TABLE; Schema: public; Owner: minhtrung
--

CREATE TABLE public.mainsubjects (
    mainsubjectid integer NOT NULL,
    mainsubjectname character varying(255) NOT NULL,
    slug character varying(255)
);


ALTER TABLE public.mainsubjects OWNER TO minhtrung;

--
-- TOC entry 246 (class 1259 OID 24803)
-- Name: mainsubjects_mainsubjectid_seq; Type: SEQUENCE; Schema: public; Owner: minhtrung
--

CREATE SEQUENCE public.mainsubjects_mainsubjectid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mainsubjects_mainsubjectid_seq OWNER TO minhtrung;

--
-- TOC entry 4382 (class 0 OID 0)
-- Dependencies: 246
-- Name: mainsubjects_mainsubjectid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: minhtrung
--

ALTER SEQUENCE public.mainsubjects_mainsubjectid_seq OWNED BY public.mainsubjects.mainsubjectid;


--
-- TOC entry 247 (class 1259 OID 24804)
-- Name: passwordresettokens; Type: TABLE; Schema: public; Owner: minhtrung
--

CREATE TABLE public.passwordresettokens (
    id integer NOT NULL,
    userid integer NOT NULL,
    token bytea NOT NULL,
    tokenexpiry timestamp with time zone NOT NULL
);


ALTER TABLE public.passwordresettokens OWNER TO minhtrung;

--
-- TOC entry 248 (class 1259 OID 24809)
-- Name: passwordresettokens_id_seq; Type: SEQUENCE; Schema: public; Owner: minhtrung
--

CREATE SEQUENCE public.passwordresettokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.passwordresettokens_id_seq OWNER TO minhtrung;

--
-- TOC entry 4383 (class 0 OID 0)
-- Dependencies: 248
-- Name: passwordresettokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: minhtrung
--

ALTER SEQUENCE public.passwordresettokens_id_seq OWNED BY public.passwordresettokens.id;


--
-- TOC entry 249 (class 1259 OID 24810)
-- Name: payments; Type: TABLE; Schema: public; Owner: minhtrung
--

CREATE TABLE public.payments (
    paymentid integer NOT NULL,
    userid integer NOT NULL,
    amount numeric(18,2) NOT NULL,
    currency character varying(10),
    transactionid character varying(50),
    bank character varying(100),
    status character varying(50),
    paymentdate timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    description character varying(255),
    paymentmethod character varying(50),
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.payments OWNER TO minhtrung;

--
-- TOC entry 250 (class 1259 OID 24817)
-- Name: payments_paymentid_seq; Type: SEQUENCE; Schema: public; Owner: minhtrung
--

CREATE SEQUENCE public.payments_paymentid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_paymentid_seq OWNER TO minhtrung;

--
-- TOC entry 4384 (class 0 OID 0)
-- Dependencies: 250
-- Name: payments_paymentid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: minhtrung
--

ALTER SEQUENCE public.payments_paymentid_seq OWNED BY public.payments.paymentid;


--
-- TOC entry 251 (class 1259 OID 24818)
-- Name: pointtransactions; Type: TABLE; Schema: public; Owner: minhtrung
--

CREATE TABLE public.pointtransactions (
    transactionid integer NOT NULL,
    userid integer NOT NULL,
    amount integer NOT NULL,
    transactiontype character varying(50) NOT NULL,
    source character varying(255),
    transactiondate timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    description character varying(255)
);


ALTER TABLE public.pointtransactions OWNER TO minhtrung;

--
-- TOC entry 252 (class 1259 OID 24824)
-- Name: pointtransactions_transactionid_seq; Type: SEQUENCE; Schema: public; Owner: minhtrung
--

CREATE SEQUENCE public.pointtransactions_transactionid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pointtransactions_transactionid_seq OWNER TO minhtrung;

--
-- TOC entry 4385 (class 0 OID 0)
-- Dependencies: 252
-- Name: pointtransactions_transactionid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: minhtrung
--

ALTER SEQUENCE public.pointtransactions_transactionid_seq OWNED BY public.pointtransactions.transactionid;


--
-- TOC entry 253 (class 1259 OID 24825)
-- Name: promotions; Type: TABLE; Schema: public; Owner: minhtrung
--

CREATE TABLE public.promotions (
    promotionid integer NOT NULL,
    companyid integer NOT NULL,
    budget numeric(18,2) NOT NULL,
    promotionname character varying(255) NOT NULL,
    startdate timestamp with time zone NOT NULL,
    enddate timestamp with time zone NOT NULL,
    description text,
    discounttype character varying(50) NOT NULL,
    discountvalue numeric(18,2) NOT NULL,
    minimumpurchaseamount numeric(18,2),
    maxdiscountamount numeric(18,2),
    status character varying(50) DEFAULT 'Active'::character varying NOT NULL
);


ALTER TABLE public.promotions OWNER TO minhtrung;

--
-- TOC entry 254 (class 1259 OID 24831)
-- Name: promotions_promotionid_seq; Type: SEQUENCE; Schema: public; Owner: minhtrung
--

CREATE SEQUENCE public.promotions_promotionid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.promotions_promotionid_seq OWNER TO minhtrung;

--
-- TOC entry 4386 (class 0 OID 0)
-- Dependencies: 254
-- Name: promotions_promotionid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: minhtrung
--

ALTER SEQUENCE public.promotions_promotionid_seq OWNED BY public.promotions.promotionid;


--
-- TOC entry 264 (class 1259 OID 25040)
-- Name: rechargepacks; Type: TABLE; Schema: public; Owner: minhtrung
--

CREATE TABLE public.rechargepacks (
    packid integer NOT NULL,
    packname character varying(50) NOT NULL,
    point integer DEFAULT 0,
    price numeric(18,2) DEFAULT 0 NOT NULL,
    discount numeric(18,2) DEFAULT 0 NOT NULL,
    isactive integer DEFAULT 1 NOT NULL,
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.rechargepacks OWNER TO minhtrung;

--
-- TOC entry 263 (class 1259 OID 25039)
-- Name: rechargepacks_packid_seq; Type: SEQUENCE; Schema: public; Owner: minhtrung
--

CREATE SEQUENCE public.rechargepacks_packid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rechargepacks_packid_seq OWNER TO minhtrung;

--
-- TOC entry 4387 (class 0 OID 0)
-- Dependencies: 263
-- Name: rechargepacks_packid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: minhtrung
--

ALTER SEQUENCE public.rechargepacks_packid_seq OWNED BY public.rechargepacks.packid;


--
-- TOC entry 255 (class 1259 OID 24832)
-- Name: uploads; Type: TABLE; Schema: public; Owner: minhtrung
--

CREATE TABLE public.uploads (
    uploadid integer NOT NULL,
    uploaderid integer NOT NULL,
    documentid integer NOT NULL,
    uploaddate timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.uploads OWNER TO minhtrung;

--
-- TOC entry 256 (class 1259 OID 24836)
-- Name: uploads_uploadid_seq; Type: SEQUENCE; Schema: public; Owner: minhtrung
--

CREATE SEQUENCE public.uploads_uploadid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.uploads_uploadid_seq OWNER TO minhtrung;

--
-- TOC entry 4388 (class 0 OID 0)
-- Dependencies: 256
-- Name: uploads_uploadid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: minhtrung
--

ALTER SEQUENCE public.uploads_uploadid_seq OWNED BY public.uploads.uploadid;


--
-- TOC entry 257 (class 1259 OID 24837)
-- Name: users; Type: TABLE; Schema: public; Owner: minhtrung
--

CREATE TABLE public.users (
    userid integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password bytea NOT NULL,
    role character varying(20) DEFAULT 'user'::character varying NOT NULL,
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    point integer DEFAULT 0 NOT NULL,
    isactive integer DEFAULT 1 NOT NULL,
    fullname character varying(255) NOT NULL,
    birthdate date,
    school character varying(255),
    description character varying(500),
    avatarpath character varying(500)
);


ALTER TABLE public.users OWNER TO minhtrung;

--
-- TOC entry 258 (class 1259 OID 24846)
-- Name: users_userid_seq; Type: SEQUENCE; Schema: public; Owner: minhtrung
--

CREATE SEQUENCE public.users_userid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_userid_seq OWNER TO minhtrung;

--
-- TOC entry 4389 (class 0 OID 0)
-- Dependencies: 258
-- Name: users_userid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: minhtrung
--

ALTER SEQUENCE public.users_userid_seq OWNED BY public.users.userid;


--
-- TOC entry 259 (class 1259 OID 24847)
-- Name: vouchers; Type: TABLE; Schema: public; Owner: minhtrung
--

CREATE TABLE public.vouchers (
    voucherid integer NOT NULL,
    vouchercode character varying(50) NOT NULL,
    promotionid integer NOT NULL,
    maxusagecount integer DEFAULT 1 NOT NULL,
    usedcount integer DEFAULT 0 NOT NULL,
    pointcost integer,
    applicableto character varying(50) NOT NULL,
    validfrom timestamp with time zone NOT NULL,
    validto timestamp with time zone NOT NULL,
    isactive boolean DEFAULT true NOT NULL
);


ALTER TABLE public.vouchers OWNER TO minhtrung;

--
-- TOC entry 260 (class 1259 OID 24853)
-- Name: vouchers_voucherid_seq; Type: SEQUENCE; Schema: public; Owner: minhtrung
--

CREATE SEQUENCE public.vouchers_voucherid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vouchers_voucherid_seq OWNER TO minhtrung;

--
-- TOC entry 4390 (class 0 OID 0)
-- Dependencies: 260
-- Name: vouchers_voucherid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: minhtrung
--

ALTER SEQUENCE public.vouchers_voucherid_seq OWNED BY public.vouchers.voucherid;


--
-- TOC entry 261 (class 1259 OID 24854)
-- Name: voucherusage; Type: TABLE; Schema: public; Owner: minhtrung
--

CREATE TABLE public.voucherusage (
    voucherusageid integer NOT NULL,
    userid integer NOT NULL,
    voucherid integer NOT NULL,
    discountamount numeric(18,2),
    useddate timestamp with time zone
);


ALTER TABLE public.voucherusage OWNER TO minhtrung;

--
-- TOC entry 262 (class 1259 OID 24857)
-- Name: voucherusage_voucherusageid_seq; Type: SEQUENCE; Schema: public; Owner: minhtrung
--

CREATE SEQUENCE public.voucherusage_voucherusageid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.voucherusage_voucherusageid_seq OWNER TO minhtrung;

--
-- TOC entry 4391 (class 0 OID 0)
-- Dependencies: 262
-- Name: voucherusage_voucherusageid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: minhtrung
--

ALTER SEQUENCE public.voucherusage_voucherusageid_seq OWNED BY public.voucherusage.voucherusageid;


--
-- TOC entry 4003 (class 2604 OID 24858)
-- Name: categories categoryid; Type: DEFAULT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.categories ALTER COLUMN categoryid SET DEFAULT nextval('public.categories_categoryid_seq'::regclass);


--
-- TOC entry 4004 (class 2604 OID 24859)
-- Name: chapters chapterid; Type: DEFAULT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.chapters ALTER COLUMN chapterid SET DEFAULT nextval('public.chapters_chapterid_seq'::regclass);


--
-- TOC entry 4005 (class 2604 OID 24860)
-- Name: companies companyid; Type: DEFAULT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.companies ALTER COLUMN companyid SET DEFAULT nextval('public.companies_companyid_seq'::regclass);


--
-- TOC entry 4006 (class 2604 OID 24861)
-- Name: documentinteractions interactionid; Type: DEFAULT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.documentinteractions ALTER COLUMN interactionid SET DEFAULT nextval('public.documentinteractions_interactionid_seq'::regclass);


--
-- TOC entry 4011 (class 2604 OID 24862)
-- Name: documents documentid; Type: DEFAULT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.documents ALTER COLUMN documentid SET DEFAULT nextval('public.documents_documentid_seq'::regclass);


--
-- TOC entry 4018 (class 2604 OID 24863)
-- Name: mainsubjects mainsubjectid; Type: DEFAULT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.mainsubjects ALTER COLUMN mainsubjectid SET DEFAULT nextval('public.mainsubjects_mainsubjectid_seq'::regclass);


--
-- TOC entry 4019 (class 2604 OID 24864)
-- Name: passwordresettokens id; Type: DEFAULT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.passwordresettokens ALTER COLUMN id SET DEFAULT nextval('public.passwordresettokens_id_seq'::regclass);


--
-- TOC entry 4020 (class 2604 OID 24865)
-- Name: payments paymentid; Type: DEFAULT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.payments ALTER COLUMN paymentid SET DEFAULT nextval('public.payments_paymentid_seq'::regclass);


--
-- TOC entry 4023 (class 2604 OID 24866)
-- Name: pointtransactions transactionid; Type: DEFAULT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.pointtransactions ALTER COLUMN transactionid SET DEFAULT nextval('public.pointtransactions_transactionid_seq'::regclass);


--
-- TOC entry 4025 (class 2604 OID 24867)
-- Name: promotions promotionid; Type: DEFAULT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.promotions ALTER COLUMN promotionid SET DEFAULT nextval('public.promotions_promotionid_seq'::regclass);


--
-- TOC entry 4039 (class 2604 OID 25043)
-- Name: rechargepacks packid; Type: DEFAULT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.rechargepacks ALTER COLUMN packid SET DEFAULT nextval('public.rechargepacks_packid_seq'::regclass);


--
-- TOC entry 4027 (class 2604 OID 24868)
-- Name: uploads uploadid; Type: DEFAULT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.uploads ALTER COLUMN uploadid SET DEFAULT nextval('public.uploads_uploadid_seq'::regclass);


--
-- TOC entry 4029 (class 2604 OID 24869)
-- Name: users userid; Type: DEFAULT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.users ALTER COLUMN userid SET DEFAULT nextval('public.users_userid_seq'::regclass);


--
-- TOC entry 4034 (class 2604 OID 24870)
-- Name: vouchers voucherid; Type: DEFAULT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.vouchers ALTER COLUMN voucherid SET DEFAULT nextval('public.vouchers_voucherid_seq'::regclass);


--
-- TOC entry 4038 (class 2604 OID 24871)
-- Name: voucherusage voucherusageid; Type: DEFAULT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.voucherusage ALTER COLUMN voucherusageid SET DEFAULT nextval('public.voucherusage_voucherusageid_seq'::regclass);


--
-- TOC entry 4267 (class 0 OID 24760)
-- Dependencies: 235
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: minhtrung
--

COPY public.categories (categoryid, categoryname, mainsubjectid, parentcategoryid, slug) FROM stdin;
1	Đại số	1	\N	dai-so
2	Đại số tuyến tính	1	1	dai-so-tuyen-tinh
3	Đại số trừu tượng	1	1	dai-so-truu-tuong
4	Hình học	1	\N	hinh-hoc
5	Hình học phẳng	1	4	hinh-hoc-phang
6	Hình học không gian	1	4	hinh-hoc-khong-gian
7	Giải tích	1	\N	giai-tich
8	Giải tích vi phân	1	7	giai-tich-vi-phan
9	Giải tích tích phân	1	7	giai-tich-tich-phan
10	Thống kê	1	\N	thong-ke
11	Xác suất	1	10	xac-suat
12	Thống kê ứng dụng	1	10	thong-ke-ung-dung
13	Văn học cổ điển	2	\N	van-hoc-co-dien
14	Văn học hiện đại	2	\N	van-hoc-hien-dai
15	Phê bình văn học	2	\N	phe-binh-van-hoc
16	Thơ ca	2	\N	tho-ca
17	Tiếng Anh	3	\N	tieng-anh
18	Ngữ pháp	3	17	ngu-phap
19	Từ vựng	3	17	tu-vung
20	Tiếng Pháp	3	\N	tieng-phap
21	Tiếng Trung	3	\N	tieng-trung
22	Tiếng Nhật	3	\N	tieng-nhat
23	Sinh học	4	\N	sinh-hoc
24	Di truyền học	4	23	di-truyen-hoc
25	Sinh thái học	4	23	sinh-thai-hoc
26	Hóa học	4	\N	hoa-hoc
27	Hóa hữu cơ	4	26	hoa-huu-co
28	Hóa vô cơ	4	26	hoa-vo-co
29	Vật lý	4	\N	vat-ly
30	Cơ học	4	29	co-hoc
31	Điện từ học	4	29	dien-tu-hoc
32	Triết học phương Tây	5	\N	triet-hoc-phuong-tay
33	Triết học phương Đông	5	\N	triet-hoc-phuong-dong
34	Logic học	5	\N	logic-hoc
35	Đạo đức học	5	\N	dao-duc-hoc
36	Lập trình	6	\N	lap-trinh
85	Thanh toán Quốc tế	23	79	thanh-toan-quoc-te
86	Logistics và Vận tải Quốc tế	23	79	logistics-va-van-tai-quoc-te
87	Luật Thương mại Quốc tế	23	79	luat-thuong-mai-quoc-te
88	Thị trường và Xu hướng Quốc tế	23	79	thi-truong-va-xu-huong-quoc-te
89	Quản lý Rủi ro trong Thương mại Quốc tế	23	79	quan-ly-rui-ro-trong-thuong-mai-quoc-te
37	Python	6	36	python
38	Java	6	36	java
39	Mạng máy tính	6	\N	mang-may-tinh
40	An ninh mạng	6	\N	an-ninh-mang
41	Phương pháp giảng dạy	7	\N	phuong-phap-giang-day
42	Sư phạm	7	\N	su-pham
43	Giáo dục đặc biệt	7	\N	giao-duc-dac-biet
44	Y học	8	\N	y-hoc
45	Nội khoa	8	44	noi-khoa
46	Ngoại khoa	8	44	ngoai-khoa
47	Dược học	8	\N	duoc-hoc
48	Điều dưỡng	8	\N	dieu-duong
49	Quản trị kinh doanh	9	\N	quan-tri-kinh-doanh
50	Kế toán	9	\N	ke-toan
51	Marketing	9	\N	marketing
52	Kĩ thuật cơ khí	10	\N	ki-thuat-co-khi
53	Kĩ thuật điện	10	\N	ki-thuat-dien
54	Kĩ thuật xây dựng	10	\N	ki-thuat-xay-dung
55	Báo chí	11	\N	bao-chi
56	Quan hệ công chúng	11	\N	quan-he-cong-chung
57	Phim ảnh	11	\N	phim-anh
58	Quản lý du lịch	12	\N	quan-ly-du-lich
59	Hướng dẫn viên du lịch	12	\N	huong-dan-vien-du-lich
60	Thiết kế thời trang	13	\N	thiet-ke-thoi-trang
61	Nghệ thuật đương đại	13	\N	nghe-thuat-duong-dai
62	Khoa học cây trồng	14	\N	khoa-hoc-cay-trong
63	Công nghệ thực phẩm	14	\N	cong-nghe-thuc-pham
64	Công nghiệp nặng	15	\N	cong-nghiep-nang
65	Công nghiệp nhẹ	15	\N	cong-nghiep-nhe
66	Luật dân sự	16	\N	luat-dan-su
67	Luật hình sự	16	\N	luat-hinh-su
68	Địa lý tự nhiên	17	\N	dia-ly-tu-nhien
69	Địa lý kinh tế	17	\N	dia-ly-kinh-te
70	Lịch sử thế giới	18	\N	lich-su-the-gioi
71	Lịch sử Việt Nam	18	\N	lich-su-viet-nam
72	Bóng đá	19	\N	bong-da
73	Bơi lội	19	\N	boi-loi
74	Khai phá dữ liệu	20	\N	khai-pha-du-lieu
75	Học máy	20	\N	hoc-may
76	Bảo vệ môi trường	21	\N	bao-ve-moi-truong
77	Quản lý tài nguyên	21	\N	quan-ly-tai-nguyen
79	Thương mại quốc tế	23	\N	thuong-mai-quoc-te
80	Thương mại điện tử	23	\N	thuong-mai-dien-tu
81	Vật lý lý thuyết	24	\N	vat-ly-ly-thuyet
82	Vật lý ứng dụng	24	\N	vat-ly-ung-dung
83	Hóa học phân tích	25	\N	hoa-hoc-phan-tich
84	Hóa lý	25	\N	hoa-ly
78	Kinh tế vi mô, vĩ mô	22	\N	kinh-te-vi-mo-vi-mo
90	Giải tích số	1	7	giai-tich-so
91	đé	17	62	de
92	bgfhbfg	17	68	bgfhbfg
93	h	3	20	h
94	Toán học 1	31	\N	toan-hoc-1
95	Toán học 2	31	94	toan-hoc-2
\.


--
-- TOC entry 4269 (class 0 OID 24766)
-- Dependencies: 237
-- Data for Name: chapters; Type: TABLE DATA; Schema: public; Owner: minhtrung
--

COPY public.chapters (chapterid, chaptername, chapterorder, categoryid, slug) FROM stdin;
24	Hóa lý	1	84	chuong-1-hoa-ly
1	Đại số cơ bản	1	2	chuong-1-dai-so-co-ban
2	Ma trận và Định thức	2	2	chuong-2-ma-tran-va-dinh-thuc
3	Nhóm và Vành	1	3	chuong-1-nhom-va-vanh
4	Hình học Euclid	1	5	chuong-1-hinh-hoc-euclid
5	Đạo hàm và Ứng dụng	1	8	chuong-1-dao-ham-va-ung-dung
6	Xác suất cơ bản	1	11	chuong-1-xac-suat-co-ban
7	Văn học trung đại	1	13	chuong-1-van-hoc-trung-dai
8	Ngữ pháp tiếng Anh cơ bản	1	18	chuong-1-ngu-phap-tieng-anh-co-ban
9	Di truyền học Mendel	1	24	chuong-1-di-truyen-hoc-mendel
10	Cơ học cổ điển	1	30	chuong-1-co-hoc-co-dien
11	Phương pháp giải tích	2	7	chuong-2-phuong-phap-giai-tich
12	Hóa hữu cơ căn bản	1	27	chuong-1-hoa-huu-co-can-ban
13	Điện từ học cơ bản	2	31	chuong-2-dien-tu-hoc-co-ban
14	Lịch sử thế giới	1	70	chuong-1-lich-su-the-gioi
15	Marketing căn bản	1	51	chuong-1-marketing-can-ban
16	Hướng dẫn viên chuyên nghiệp	1	59	chuong-1-huong-dan-vien-chuyen-nghiep
18	Thiết kế thời trang	1	60	chuong-1-thiet-ke-thoi-trang
20	Kĩ thuật điện	1	53	chuong-1-ki-thuat-dien
21	Công nghiệp nhẹ	1	65	chuong-1-cong-nghiep-nhe
22	Luật dân sự cơ bản	1	66	chuong-1-luat-dan-su-co-ban
23	Bảo vệ môi trường	1	76	chuong-1-bao-ve-moi-truong
25	Phim ảnh căn bản	1	57	chuong-1-phim-anh-can-ban
17	Thương mại quốc tế	1	79	chuong-1-thuong-mai-quoc-te
19	Kinh tế vi mô	1	78	chuong-1-kinh-te-vi-mo
26	Tổng quan về thanh toán quốc tế	1	85	chuong-1-tong-quan-ve-thanh-toan-quoc-te
27	Các phương thức thanh toán quốc tế	2	85	chuong-2-cac-phuong-phap-thanh-toan-quoc-te
28	Thư tín dụng L/C	3	85	chuong-3-thu-tin-dung-lc
29	Bảo lãnh ngân hàng	4	85	chuong-4-bao-lanh-ngan-hang
30	Quản lý rủi ro ngoại hối	5	85	chuong-5-quan-ly-rui-ro-ngoai-hoi
31	Giới thiệu về giải tích số	1	90	chuong-1-gioi-thieu-ve-giai-tich-so
32	Làm quen với giải tích số	2	90	chuong-2-lam-quen-voi-giai-tich-so
33	jh	1	93	chuong-1-jh
34	Nhập môn	1	95	chuong-1-nhap-mon
\.


--
-- TOC entry 4271 (class 0 OID 24772)
-- Dependencies: 239
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: minhtrung
--

COPY public.companies (companyid, companyname, description, contactinfo, imagepath) FROM stdin;
\.


--
-- TOC entry 4273 (class 0 OID 24778)
-- Dependencies: 241
-- Data for Name: documentinteractions; Type: TABLE DATA; Schema: public; Owner: minhtrung
--

COPY public.documentinteractions (interactionid, userid, documentid, isliked, isbookmarked, viewdate, likedate, bookmarkdate, isfinishedreading) FROM stdin;
4	1	51	t	t	2024-11-03 15:58:51.467982+00	2024-11-13 15:57:30.536+00	2024-11-13 15:58:35.428+00	f
8	1	39	t	t	2024-11-13 16:10:53.849779+00	2024-11-13 16:15:54.821+00	2024-11-13 16:15:57.334+00	f
10	1	33	f	f	2024-11-21 14:53:26.157181+00	\N	\N	f
11	1	9	t	f	2024-11-24 15:54:40.498756+00	2024-11-24 15:54:40.533+00	\N	f
12	1	36	f	f	2024-11-24 16:07:17.791857+00	\N	\N	f
15	1	53	f	f	2024-11-29 16:22:43.79018+00	\N	\N	f
19	1	13	f	f	2024-12-02 08:43:43.199297+00	\N	\N	f
21	3	39	f	f	2024-12-08 10:20:21.387001+00	\N	\N	f
3	1	20	f	f	2024-11-02 15:59:19.411572+00	\N	\N	f
2	1	2	f	f	2024-10-31 07:18:42.459917+00	\N	\N	f
23	1	3	f	f	2024-12-11 04:07:34.131532+00	\N	\N	f
22	1	38	t	t	2024-12-10 17:28:01.778332+00	2024-12-11 03:57:45.492+00	2024-12-11 04:16:12.806+00	f
30	1	54	t	f	2024-12-15 01:32:17.268649+00	2024-12-16 01:17:19.821+00	\N	f
26	1	29	f	f	2024-12-11 16:15:14.996171+00	\N	\N	f
28	1	21	f	f	2024-12-11 16:17:49.546285+00	\N	\N	f
24	1	55	t	t	2024-12-11 08:17:29.594712+00	2024-12-16 16:42:49.136+00	2024-12-17 02:19:10.491+00	f
58	1	58	f	f	2024-12-17 02:23:58.65444+00	\N	\N	f
59	1	35	f	f	2024-12-17 02:25:23.642904+00	\N	\N	f
60	1	6	t	f	2024-12-18 15:43:32.211793+00	2024-12-18 15:43:32.263+00	\N	f
14	1	5	f	t	2024-11-24 16:20:42.187882+00	\N	2024-12-18 15:43:35.647+00	f
7	1	52	t	t	2024-11-08 02:18:01.272267+00	2024-12-12 04:37:11.449+00	2024-11-13 15:57:38.834+00	f
18	1	1	t	f	2024-12-02 08:43:29.805899+00	2024-12-13 08:28:02.999+00	\N	f
34	1	57	f	f	2024-12-15 16:08:25.027255+00	\N	\N	f
\.


--
-- TOC entry 4275 (class 0 OID 24786)
-- Dependencies: 243
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: minhtrung
--

COPY public.documents (documentid, title, filetype, filepath, filesize, accesslevel, status, description, viewcount, likecount, pointcost, chapterid, slug, isactive) FROM stdin;
4	Hình học Euclid - Tóm tắt	pptx	toan-hoc/hinh-hoc/hinh-hoc-phang/hinh-hoc-euclid/Tien-de-Eculid-Tinh-chat-cua-hai-duong-thang-song-song.pptx	51200	Public	Approved	Tóm tắt kiến thức hình học Euclid	200	100	0	4	hinh-hoc-euclid-tom-tat	1
17	Nguyên tắc cơ bản của thương mại quốc tế	pdf	/uploads/documents/17.pdf	143360	Public	Approved	Tài liệu về các nguyên tắc cơ bản của thương mại quốc tế	210	105	0	17	nguyen-tac-co-ban-cua-thuong-mai-quoc-te	1
7	Văn học Trung đại - Khái quát	docx	/uploads/documents/7.docx	153600	Private	Rejected	Tài liệu nghiên cứu về văn học Trung đại	30	15	5	7	van-hoc-trung-dai-khai-quat	1
8	Ngữ pháp tiếng Anh - Bài tập	pdf	/uploads/documents/8.pdf	102400	Public	Approved	Bài tập ngữ pháp tiếng Anh	180	90	0	8	ngu-phap-tieng-anh-bai-tap	1
10	Cơ học Cổ điển - Bài giảng	pptx	/uploads/documents/10.pptx	204800	Public	Approved	Bài giảng về cơ học cổ điển	160	80	0	10	co-hoc-co-dien-bai-giang	1
11	Phương pháp giải tích nâng cao	pdf	/uploads/documents/11.pdf	122880	Public	Approved	Tài liệu về các phương pháp giải tích nâng cao	80	40	0	11	phuong-phap-giai-tich-nang-cao	1
14	Lịch sử thế giới - Lược sử	pdf	/uploads/documents/14.pdf	133120	Public	Approved	Lược sử về lịch sử thế giới	230	115	0	14	lich-su-the-gioi-luoc-su	1
15	Marketing căn bản - Giáo trình	pptx	/uploads/documents/15.pptx	225280	Public	Approved	Bài giảng về những nguyên lý cơ bản của marketing	170	85	0	15	marketing-can-ban-giao-trinh	1
16	Hướng dẫn viên du lịch chuyên nghiệp	docx	/uploads/documents/16.docx	174080	Private	Rejected	Tài liệu về kỹ năng và kiến thức cho hướng dẫn viên du lịch chuyên nghiệp	70	35	5	16	huong-dan-vien-du-lich-chuyen-nghiep	1
18	Thiết kế thời trang - Cơ bản	mp4	/uploads/documents/18.mp4	1146880	Public	Approved	Video giới thiệu về thiết kế thời trang	260	130	0	18	thiet-ke-thoi-trang-co-ban	1
19	Khái niệm cơ bản trong kinh tế vi mô	pdf	/uploads/documents/19.pdf	153600	Public	Approved	Tài liệu về các khái niệm cơ bản trong kinh tế vi mô	140	70	0	19	khai-niem-co-ban-trong-kinh-te-vi-mo	1
20	Kỹ thuật điện - Giới thiệu	docx	/uploads/documents/20.docx	184320	Private	Pending	Tài liệu giới thiệu về những khái niệm cơ bản trong kĩ thuật điện	90	45	10	20	ky-thuat-dien-gioi-thieu	1
12	Hóa hữu cơ - Bài tập cơ bản	docx	/uploads/documents/12.docx	163840	Private	Rejected	Bài tập cơ bản về hóa hữu cơ	60	30	10	12	hoa-huu-co-bai-tap-co-ban	1
22	Bài tập Đại số cơ bản	docx	/uploads/documents/22.docx	81920	Private	Pending	Bài tập về đại số cơ bản	20	10	5	2	bai-tap-dai-so-co-ban	1
23	Ứng dụng của Đại số trong thực tế	pptx	/uploads/documents/23.pptx	163840	Public	Approved	Bài giảng về ứng dụng của đại số trong thực tế	70	35	0	2	ung-dung-cua-dai-so-trong-thuc-te\n\n	1
24	Phương trình và Bất phương trình	pdf	/uploads/documents/24.pdf	92160	Public	Approved	Tài liệu về phương trình và bất phương trình	60	30	0	2	phuong-trinh-va-bat-phuong-trinh	1
25	Hàm số và Đồ thị	docx	/uploads/documents/25.docx	102400	Private	Rejected	Tài liệu về hàm số và đồ thị	30	15	10	2	ham-so-va-do-thi	1
26	Lý thuyết tập hợp	pptx	/uploads/documents/26.pptx	143360	Public	Approved	Bài giảng về lý thuyết tập hợp	80	40	0	2	ly-thuyet-tap-hop	1
27	Đại số - Ôn tập chương 1	pdf	/uploads/documents/27.pdf	112640	Public	Approved	Bài tập ôn tập chương 1 - Đại số	90	45	0	2	dai-so-on-tap-chuong-1	1
28	Số phức	docx	/uploads/documents/28.docx	71680	Private	Pending	Tài liệu về số phức	40	20	5	2	so-phuc	1
29	Ma trận và Định thức (phần cơ bản)	pptx	/uploads/documents/29.pptx	133120	Public	Approved	Bài giảng về ma trận và định thức (phần cơ bản)	101	50	0	2	ma-tran-va-dinh-thuc-phan-co-ban	1
5	Ứng dụng của Đạo hàm	mp4	toan-hoc/giai-tich/giai-tich-tich-phan/phuong-phap-giai-tich/ung_dung_cua_dao_ham.mp4	1048576	Public	Approved	Video bài giảng về ứng dụng của đạo hàm	258	125	0	5	ung-dung-cua-dao-ham	1
13	Điện từ học - Nguyên lý cơ bản	txt	/uploads/documents/13.txt	61440	Public	Approved	Tóm tắt các nguyên lý cơ bản của điện từ học	192	95	0	13	dien-tu-hoc-nguyen-ly-co-ban	1
39	Ứng dụng của tích phân	pdf	/uploads/documents/39.pdf	92160	Public	Approved	Tài liệu về ứng dụng của tích phân	63	40	0	2	ung-dung-cua-tich-phan	1
9	Di truyền học Mendel - Sơ lược	txt	/uploads/documents/9.txt	51200	Public	Approved	Sơ lược về di truyền học Mendel	221	111	0	9	di-truyen-hoc-mendel-so-luoc	1
54	Tiêu đề Eculid	pptx	toan-hoc/dai-so/dai-so-tuyen-tinh/ma-tran-va-dinh-thuc/document-d7db6c98-5d63-475a-a3bf-6f9dc515fa48.pptx	3244680	Public	Approved	Tiêu đề Eculid	16	2	0	2	tieu-de-eculid	1
2	Bài giảng Ma trận	pdf	toan-hoc/dai-so/dai-so-tuyen-tinh/ma-tran-va-dinh-thuc/01-Ma-Tran.pdf	204800	Public	Approved	Bài giảng về ma trận	298	75	10	2	bai-giang-ma-tran	1
1	Tài liệu Đại số 1	pdf	/uploads/documents/1.pdf	102400	Public	Approved	Tài liệu về đại số cơ bản	104	51	0	1	tai-lieu-dai-so-1	1
21	Cơ sở Đại số - Phần 1	pdf	/uploads/documents/21.pdf	122880	Private	Approved	Tài liệu cơ sở đại số phần 1	52	25	0	2	co-so-dai-so-phan-1	1
52	Assiment	pdf	toan-hoc/dai-so/dai-so-tuyen-tinh/ma-tran-va-dinh-thuc/NguyenHoangTrung_47.01.104.224_Assignment4-7d8564f6-06e7-4d1e-a8df-131bc350073d.pdf	650089	Public	Approved	adsa	32	1	0	2	assiment	1
6	Lý thuyết Xác suất	pdf	/uploads/documents/6.pdf	102400	Public	Approved	Tài liệu về lý thuyết xác suất	120	61	0	6	ly-thuyet-xac-suat	1
30	Hệ phương trình tuyến tính	pdf	/uploads/documents/30.pdf	102400	Public	Approved	Tài liệu về hệ phương trình tuyến tính	110	55	0	2	he-phuong-trinh-tuyen-tinh	1
31	Vector và Không gian vector	docx	/uploads/documents/31.docx	92160	Public	Rejected	Tài liệu về vector và không gian vector	20	10	10	2	vector-va-khong-gian-vector	0
32	Biến đổi tuyến tính	pptx	/uploads/documents/32.pptx	153600	Public	Approved	Bài giảng về biến đổi tuyến tính	60	30	0	2	bien-doi-tuyen-tinh	1
34	Giới hạn	docx	/uploads/documents/34.docx	81920	Private	Pending	Tài liệu về giới hạn	30	15	5	2	gioi-han	1
37	Nguyên hàm	docx	/uploads/documents/37.docx	102400	Private	Rejected	Tài liệu về nguyên hàm	40	20	10	2	nguyen-ham	1
36	Tài liệu ứng dụng của đạo hàm	pdf	/uploads/documents/36.pdf	112640	Public	Approved	Tài liệu về ứng dụng của đạo hàm	93	45	0	2	tai-lieu-ung-dung-cua-dao-ham	1
53	Giáo trình luật thương mại quốc tế phần 1 - Trần Việt Dũng	mp3	thuong-mai/thuong-mai-quoc-te/thanh-toan-quoc-te/tong-quan-ve-thanh-toan-quoc-te/document-35541d21-1d1e-4701-852b-3b593c6de9ff.mp3	26355614	Public	Rejected	Giáo trình luật thương mại quốc tế, chủ biên Trần Việt Dũng	2	0	0	26	giao-trinh-luat-thuong-mai-quoc-te-phan-1-tran-viet-dung	1
33	Đại số - Ôn tập chương 2	pdf	/uploads/documents/33.pdf	122880	Public	Approved	Bài tập ôn tập chương 2 - Đại số	72	35	0	2	dai-so-on-tap-chuong-2	1
3	Nhóm và Vành - Giáo trình	docx	/uploads/documents/3.docx	153600	Public	Approved	Giáo trình về nhóm và vành	50	25	10	3	nhom-va-vanh-giao-trinh	1
56	Sáng tạo cùng AI	docx	toan-hoc/dai-so/dai-so-tuyen-tinh/ma-tran-va-dinh-thuc/document-e9052f84-b0d1-4f3b-ac8f-7849b6ea372d.docx	445707	Private	Approved	Sáng tạo cùng AI với AI Army	5	0	0	2	sang-tao-cung-ai	0
57	Segmentation	pdf	toan-hoc/dai-so/dai-so-tuyen-tinh/dai-so-co-ban/document-8c115b98-e670-4593-90bf-e434aed5a064.pdf	246589	Public	Approved	Segmentation	7	0	300	1	segmentation	1
58	Segmentation 1	pdf	toan-hoc/dai-so/dai-so-tuyen-tinh/dai-so-co-ban/document-512a4bd8-d4cf-4439-b1c1-aef6f973c415.pdf	246589	Public	Approved	Tai lieu	1	0	0	1	segmentation-1	0
35	Đạo hàm	pptx	/uploads/documents/35.pptx	143360	Public	Approved	Bài giảng về đạo hàm	81	40	0	2	dao-ham	1
51	Xử lý ảnh số siêu cấp	pdf	toan-hoc/dai-so/dai-so-tuyen-tinh/ma-tran-va-dinh-thuc/IJIGSP-V9-N2-2-f8f29931-85aa-41a4-8583-d004757e4c68.pdf	1168562	Public	Approved	Xử lý ảnh số siêu cấp	36	1	0	2	xu-ly-anh-so-sieu-cap	1
38	Tích phân	pptx	/uploads/documents/38.pptx	133120	Public	Approved	Bài giảng về tích phân	51	26	0	2	tich-phan	1
55	Nghiên cứu AI	mp4	toan-hoc/dai-so/dai-so-truu-tuong/nhom-va-vanh/document-71b6765b-daa5-4043-807c-c779fc5fcaa4.mp4	12744869	Public	Approved	Chào mừng bạn đến với phòng lab AI của chúng tôi!\n\nChúng tôi là AI-Army. Tại đây, chúng tôi nghiên cứu và phát triển các giải pháp AI tiên tiến, từ học máy đến xử lý ngôn ngữ tự nhiên.\n\nKhám phá cùng chúng tôi nào!	25	2	0	3	nghien-cuu-ai	1
\.


--
-- TOC entry 4277 (class 0 OID 24798)
-- Dependencies: 245
-- Data for Name: mainsubjects; Type: TABLE DATA; Schema: public; Owner: minhtrung
--

COPY public.mainsubjects (mainsubjectid, mainsubjectname, slug) FROM stdin;
1	Toán Học	toan-hoc
2	Văn Học	van-hoc
3	Ngoại ngữ	ngoai-ngu
4	Khoa Học	khoa-hoc
5	Triết Học	triet-hoc
6	Công nghệ thông tin	cong-nghe-thong-tin
7	Giáo dục	giao-duc
8	Y tế và chăm sóc sức khỏe	y-te-va-cham-soc-suc-khoe
9	Doanh nghiệp	doang-nghiep
10	Kĩ thuật	ky-thuat
11	Truyền thông và giải trí	truyen-thong-va-giai-tri
12	Du lịch	du-lich
13	Thời trang và mĩ thuật	thoi-trang-va-mi-thuat
14	Nông nghiệp và thực phẩm	nong-nghiep-va-thuc-pham
15	Công nghiệp	cong-nghiep
16	Luật	luat
17	Địa lý	dia-ly
18	Lịch sử	lich-su
19	Thể thao	the-thao
20	Phân tích dữ liệu	phan-tich-du-lieu
21	Môi trường	moi-truong
22	Kinh tế	kinh-te
23	Thương mại	thuong-mai
24	Vật lý	vat-ly
25	Hóa học	hoa-hoc
26	Khảo cổ học	khao-co-hoc
28	Địa chất học	dia-chat-hoc
29	Hio	hio
31	Toán học cao cấp	toan-hoc-cao-cap
\.


--
-- TOC entry 4279 (class 0 OID 24804)
-- Dependencies: 247
-- Data for Name: passwordresettokens; Type: TABLE DATA; Schema: public; Owner: minhtrung
--

COPY public.passwordresettokens (id, userid, token, tokenexpiry) FROM stdin;
12	1	\\x61393764376432613531666363383031666165316464396634313235336265646232323161356131613533393437613534306366373339633132386136366136	2024-12-18 18:00:53.479+00
15	1	\\x64386162666663323130383232313162656337373737636134353232643739636562616237623564323964363066626636343439626234316638633734336135	2024-12-18 18:08:10.214+00
17	1	\\x34366562316666373861313934376263316132653139346530303632383234663263663534323563373235396265646132303834303838346234663934333838	2024-12-18 18:09:15.688+00
\.


--
-- TOC entry 4281 (class 0 OID 24810)
-- Dependencies: 249
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: minhtrung
--

COPY public.payments (paymentid, userid, amount, currency, transactionid, bank, status, paymentdate, description, paymentmethod, createdat) FROM stdin;
1	1	150.50	USD	TXN12345	Vietcombank	Paid	2024-12-03 08:55:00+00	Mua tài liệu học tập	Credit Card	2024-12-03 08:55:00+00
3	3	25.75	EUR	TXN13579	ACB	Overdue	2024-12-07 08:45:00+00	Mua voucher giảm giá	PayPal	2024-12-07 08:45:00+00
4	1	1000.00	VND	TXN24680	\N	Overdue	2024-12-01 08:45:00+00	Mua gói học tập Premium	Momo	2024-12-01 08:45:00+00
2	1	500.00	VND	TXN67890	Techcombank	Pending	\N	Nạp tiền vào tài khoản	Bank Transfer	2024-12-06 08:45:00+00
5	4	75.20	USD	TXN11223	BIDV	Overdue	2024-12-03 08:45:00+00	Hoàn tiền mua tài liệu	Credit Card	2024-12-03 08:45:00+00
8	1	700.00	\N	\N	\N	Canceled	2024-12-05 08:41:03.340764+00	\N	\N	2024-12-05 08:45:00+00
9	1	10.44	USD	3XP65646YG158230W	\N	Paid	2024-12-14 06:15:32.339437+00	Thanh toán Gói chuyên nghiệp	Paypal	2024-12-14 06:15:32.339437+00
10	1	10.44	USD	9VW55361JT341115G	\N	Paid	2024-12-14 06:56:20.919061+00	Thanh toán Gói chuyên nghiệp	Paypal	2024-12-14 06:56:20.919061+00
11	1	23.39	USD	8MW96810GJ358974N	\N	Paid	2024-12-14 06:58:38.946901+00	Thanh toán Gói nghiên cứu sinh	Paypal	2024-12-14 06:58:38.946901+00
13	1	3.99	USD	1LX29873SA849215K	\N	Paid	2024-12-14 07:18:02.684764+00	Thanh toán Gói nâng cao	Paypal	2024-12-14 07:18:02.684764+00
14	1	3.99	USD	0T5172968J613754X	\N	Paid	2024-12-14 07:22:31.367806+00	Thanh toán Gói nâng cao	Paypal	2024-12-14 07:22:31.367806+00
15	1	3.99	USD	95L493869B496052G	\N	Paid	2024-12-14 07:23:29.130573+00	Thanh toán Gói nâng cao	Paypal	2024-12-14 07:23:29.130573+00
17	1	10.44	USD	0FE43656UF244354N	\N	Canceled	2024-12-14 15:55:56.017385+00	Thanh toán Gói chuyên nghiệp	Paypal	2024-12-14 15:55:56.017385+00
16	1	3.99	USD	0BW19437GR510200P	\N	Canceled	2024-12-14 13:31:17.558665+00	Thanh toán Gói nâng cao	Paypal	2024-12-14 13:31:17.558665+00
19	1	1.99	USD	9AR49749B8297061N	\N	Paid	2024-12-14 16:05:36.08451+00	Thanh toán Gói cơ bản	Paypal	2024-12-14 16:05:36.08451+00
18	1	10.44	USD	31405540XB521045V	\N	Canceled	2024-12-14 16:03:51.760274+00	Thanh toán Gói chuyên nghiệp	Paypal	2024-12-14 16:03:51.760274+00
22	1	3.99	USD	7KG569981Y529984F	\N	Pending	2024-12-17 02:19:59.933899+00	Thanh toán Gói nâng cao	Paypal	2024-12-17 02:19:59.933899+00
\.


--
-- TOC entry 4283 (class 0 OID 24818)
-- Dependencies: 251
-- Data for Name: pointtransactions; Type: TABLE DATA; Schema: public; Owner: minhtrung
--

COPY public.pointtransactions (transactionid, userid, amount, transactiontype, source, transactiondate, description) FROM stdin;
1	1	6000	payment	\N	2024-12-14 06:15:32.303196+00	Thanh toán Gói chuyên nghiệp
2	1	6000	payment	\N	2024-12-14 06:56:20.88803+00	Thanh toán Gói chuyên nghiệp
3	1	20000	payment	\N	2024-12-14 06:58:38.912931+00	Thanh toán Gói nghiên cứu sinh
4	1	20000	payment	\N	2024-12-14 06:59:43.855392+00	Thanh toán Gói nghiên cứu sinh
5	1	2000	payment	\N	2024-12-14 07:18:02.864946+00	Thanh toán Gói nâng cao
6	1	2000	payment	\N	2024-12-14 07:22:31.512883+00	Thanh toán Gói nâng cao
7	1	2000	payment	\N	2024-12-14 07:23:29.263535+00	Thanh toán Gói nâng cao
\.


--
-- TOC entry 4285 (class 0 OID 24825)
-- Dependencies: 253
-- Data for Name: promotions; Type: TABLE DATA; Schema: public; Owner: minhtrung
--

COPY public.promotions (promotionid, companyid, budget, promotionname, startdate, enddate, description, discounttype, discountvalue, minimumpurchaseamount, maxdiscountamount, status) FROM stdin;
\.


--
-- TOC entry 4296 (class 0 OID 25040)
-- Dependencies: 264
-- Data for Name: rechargepacks; Type: TABLE DATA; Schema: public; Owner: minhtrung
--

COPY public.rechargepacks (packid, packname, point, price, discount, isactive, createdat) FROM stdin;
1	Gói cơ bản	1000	1.99	0.00	1	2024-12-11 16:14:25.099422+00
2	Gói nâng cao	2000	3.99	0.00	1	2024-12-11 16:14:47.153659+00
3	Gói chuyên nghiệp	6000	10.99	5.00	1	2024-12-11 16:18:11.598898+00
4	Gói nghiên cứu sinh	20000	25.99	10.00	1	2024-12-11 16:20:42.142353+00
5	Gói giáo sư	50000	50.99	15.00	1	2024-12-11 16:33:54.310565+00
\.


--
-- TOC entry 4287 (class 0 OID 24832)
-- Dependencies: 255
-- Data for Name: uploads; Type: TABLE DATA; Schema: public; Owner: minhtrung
--

COPY public.uploads (uploadid, uploaderid, documentid, uploaddate) FROM stdin;
4	4	4	2023-03-11 03:00:00+00
5	1	5	2023-03-11 04:00:00+00
6	2	6	2023-03-11 05:00:00+00
8	4	8	2023-03-12 04:00:00+00
10	2	10	2023-03-13 03:00:00+00
11	3	11	2023-03-13 04:00:00+00
12	4	12	2023-03-13 05:00:00+00
13	1	13	2023-03-14 03:00:00+00
14	2	14	2023-03-14 04:00:00+00
15	3	15	2023-03-14 05:00:00+00
16	4	16	2023-03-15 03:00:00+00
17	1	17	2023-03-15 04:00:00+00
18	2	18	2023-03-15 05:00:00+00
19	3	19	2023-03-16 03:00:00+00
20	4	20	2023-03-16 04:00:00+00
21	1	21	2023-03-17 03:00:00+00
22	2	22	2023-03-17 04:00:00+00
23	3	23	2023-03-17 05:00:00+00
24	4	24	2023-03-18 03:00:00+00
25	1	25	2023-03-18 04:00:00+00
26	2	26	2023-03-18 05:00:00+00
27	3	27	2023-03-19 03:00:00+00
28	4	28	2023-03-19 04:00:00+00
29	1	29	2023-03-19 05:00:00+00
30	2	30	2023-03-20 03:00:00+00
31	3	31	2023-03-20 04:00:00+00
32	4	32	2023-03-20 05:00:00+00
33	1	33	2023-03-21 03:00:00+00
34	2	34	2023-03-21 04:00:00+00
35	3	35	2023-03-21 05:00:00+00
36	4	36	2023-03-22 03:00:00+00
37	1	37	2023-03-22 04:00:00+00
38	2	38	2023-03-22 05:00:00+00
39	3	39	2023-03-23 03:00:00+00
1	1	1	2023-03-10 03:00:00+00
2	2	2	2023-03-10 04:00:00+00
46	1	51	2024-11-03 15:57:52.477781+00
47	1	52	2024-11-08 02:16:20.103151+00
48	1	53	2024-11-29 16:22:05.194087+00
49	1	54	2024-12-02 07:42:28.768553+00
3	3	3	2023-03-11 05:00:00+00
7	3	7	2023-03-11 03:00:00+00
9	1	9	2023-03-13 05:00:00+00
50	1	55	2024-12-11 08:16:53.425113+00
52	1	57	2024-12-15 16:05:28.718993+00
53	1	58	2024-12-17 02:18:08.937848+00
\.


--
-- TOC entry 4289 (class 0 OID 24837)
-- Dependencies: 257
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: minhtrung
--

COPY public.users (userid, username, email, password, role, createdat, point, isactive, fullname, birthdate, school, description, avatarpath) FROM stdin;
7	vantoan	vantoan@gmail.com	\\x38643936396565663665636164336332396133613632393238306536383663663063336635643561383661666633636131323032306339323361646336633932	user	2024-12-02 11:47:17.586464+00	1000	0	Trằn Văn Toàn	2000-01-01	\N	\N	\N
1	trung	trunghoangnguyen.it@gmail.com	\\x65663739376338313138663032646662363439363037646435643366386337363233303438633963303633643533326363393563356564376138393861363466	admin	2024-10-17 16:20:53.647657+00	12870	1	Nguyen Hoang Trung	2003-01-01	Đại học sư phạm TPHCM	tôi là trung 2	account-profile-image/profile-50854ac9-c08d-4552-9510-579d4ac1a2a0.png
4	thuytien	nguyenngocthuytien@gmail.com	\\x38643936396565663665636164336332396133613632393238306536383663663063336635643561383661666633636131323032306339323361646336633932	student	2024-10-23 00:20:14.344615+00	2000	1	Nguyễn Ngọc Thủy Tiên	2000-01-01	\N	\N	\N
15	kminh	plkminh.c918@gmail.com	\\x33323765636636373636323831346561386566333361323166376234613066663334393936633339636165653165646564346630383335343032326536393835	user	2024-12-18 19:32:02.362063+00	1000	1	Pham Le Khanh Minh	2003-11-11	\N	\N	\N
14	a	sad@gmail.com	\\x38346530393135393939383166323932316135623461633031636338316437616239306438656364326638326332346465363066353964333562343034383638	user	2024-12-18 18:45:02.307723+00	1000	2	s	2003-11-11	\N	\N	\N
2	nam	nhatnam@gmail.com	\\x61363635613435393230343232663964343137653438363765666463346662386130346131663366666631666130376539393865383666376637613237616533	admin	2024-10-17 16:23:47.81212+00	0	0	nhatnam	2024-10-15	\N	\N	\N
11	thuyan	thuyan@gmail.com	\\x39316466383062323964346563633163656362363134376536353430363264373834383762353230616639623534386362633838376461623461653238616634	user	2024-12-17 16:58:03.307111+00	1000	1	Thùy An	2003-01-17	\N	\N	\N
3	ngoctuyet	nguyenngoctuyet@gmail.com	\\x38643936396565663665636164336332396133613632393238306536383663663063336635643561383661666633636131323032306339323361646336633932	student	2024-10-23 00:19:42.883211+00	0	0	Nguyễn Ngọc Tuyết	2000-01-01	\N	null	account-profile-image/profile-8352bf8c-0cbd-4c7b-9b66-d356d028343f.jpg
13	MinhTrung	minhtrung.work2003@gmail.com	\\x31316161396536663738356539303230346565666239366134396231333638323762323733393332386466383636653939613034663935353336313035353664	user	2024-12-18 17:58:05.208286+00	1000	1	Minh Trung	2003-01-11	\N	\N	\N
\.


--
-- TOC entry 4291 (class 0 OID 24847)
-- Dependencies: 259
-- Data for Name: vouchers; Type: TABLE DATA; Schema: public; Owner: minhtrung
--

COPY public.vouchers (voucherid, vouchercode, promotionid, maxusagecount, usedcount, pointcost, applicableto, validfrom, validto, isactive) FROM stdin;
\.


--
-- TOC entry 4293 (class 0 OID 24854)
-- Dependencies: 261
-- Data for Name: voucherusage; Type: TABLE DATA; Schema: public; Owner: minhtrung
--

COPY public.voucherusage (voucherusageid, userid, voucherid, discountamount, useddate) FROM stdin;
\.


--
-- TOC entry 4392 (class 0 OID 0)
-- Dependencies: 236
-- Name: categories_categoryid_seq; Type: SEQUENCE SET; Schema: public; Owner: minhtrung
--

SELECT pg_catalog.setval('public.categories_categoryid_seq', 95, true);


--
-- TOC entry 4393 (class 0 OID 0)
-- Dependencies: 238
-- Name: chapters_chapterid_seq; Type: SEQUENCE SET; Schema: public; Owner: minhtrung
--

SELECT pg_catalog.setval('public.chapters_chapterid_seq', 34, true);


--
-- TOC entry 4394 (class 0 OID 0)
-- Dependencies: 240
-- Name: companies_companyid_seq; Type: SEQUENCE SET; Schema: public; Owner: minhtrung
--

SELECT pg_catalog.setval('public.companies_companyid_seq', 1, false);


--
-- TOC entry 4395 (class 0 OID 0)
-- Dependencies: 242
-- Name: documentinteractions_interactionid_seq; Type: SEQUENCE SET; Schema: public; Owner: minhtrung
--

SELECT pg_catalog.setval('public.documentinteractions_interactionid_seq', 60, true);


--
-- TOC entry 4396 (class 0 OID 0)
-- Dependencies: 244
-- Name: documents_documentid_seq; Type: SEQUENCE SET; Schema: public; Owner: minhtrung
--

SELECT pg_catalog.setval('public.documents_documentid_seq', 58, true);


--
-- TOC entry 4397 (class 0 OID 0)
-- Dependencies: 246
-- Name: mainsubjects_mainsubjectid_seq; Type: SEQUENCE SET; Schema: public; Owner: minhtrung
--

SELECT pg_catalog.setval('public.mainsubjects_mainsubjectid_seq', 31, true);


--
-- TOC entry 4398 (class 0 OID 0)
-- Dependencies: 248
-- Name: passwordresettokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: minhtrung
--

SELECT pg_catalog.setval('public.passwordresettokens_id_seq', 22, true);


--
-- TOC entry 4399 (class 0 OID 0)
-- Dependencies: 250
-- Name: payments_paymentid_seq; Type: SEQUENCE SET; Schema: public; Owner: minhtrung
--

SELECT pg_catalog.setval('public.payments_paymentid_seq', 22, true);


--
-- TOC entry 4400 (class 0 OID 0)
-- Dependencies: 252
-- Name: pointtransactions_transactionid_seq; Type: SEQUENCE SET; Schema: public; Owner: minhtrung
--

SELECT pg_catalog.setval('public.pointtransactions_transactionid_seq', 7, true);


--
-- TOC entry 4401 (class 0 OID 0)
-- Dependencies: 254
-- Name: promotions_promotionid_seq; Type: SEQUENCE SET; Schema: public; Owner: minhtrung
--

SELECT pg_catalog.setval('public.promotions_promotionid_seq', 1, false);


--
-- TOC entry 4402 (class 0 OID 0)
-- Dependencies: 263
-- Name: rechargepacks_packid_seq; Type: SEQUENCE SET; Schema: public; Owner: minhtrung
--

SELECT pg_catalog.setval('public.rechargepacks_packid_seq', 5, true);


--
-- TOC entry 4403 (class 0 OID 0)
-- Dependencies: 256
-- Name: uploads_uploadid_seq; Type: SEQUENCE SET; Schema: public; Owner: minhtrung
--

SELECT pg_catalog.setval('public.uploads_uploadid_seq', 53, true);


--
-- TOC entry 4404 (class 0 OID 0)
-- Dependencies: 258
-- Name: users_userid_seq; Type: SEQUENCE SET; Schema: public; Owner: minhtrung
--

SELECT pg_catalog.setval('public.users_userid_seq', 15, true);


--
-- TOC entry 4405 (class 0 OID 0)
-- Dependencies: 260
-- Name: vouchers_voucherid_seq; Type: SEQUENCE SET; Schema: public; Owner: minhtrung
--

SELECT pg_catalog.setval('public.vouchers_voucherid_seq', 1, false);


--
-- TOC entry 4406 (class 0 OID 0)
-- Dependencies: 262
-- Name: voucherusage_voucherusageid_seq; Type: SEQUENCE SET; Schema: public; Owner: minhtrung
--

SELECT pg_catalog.setval('public.voucherusage_voucherusageid_seq', 1, false);


--
-- TOC entry 4046 (class 2606 OID 24873)
-- Name: categories categories_categoryname_key; Type: CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_categoryname_key UNIQUE (categoryname);


--
-- TOC entry 4048 (class 2606 OID 24875)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (categoryid);


--
-- TOC entry 4050 (class 2606 OID 24877)
-- Name: categories categories_slug_unique; Type: CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_unique UNIQUE (slug);


--
-- TOC entry 4052 (class 2606 OID 24879)
-- Name: chapters chapters_pkey; Type: CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.chapters
    ADD CONSTRAINT chapters_pkey PRIMARY KEY (chapterid);


--
-- TOC entry 4054 (class 2606 OID 24881)
-- Name: chapters chapters_slug_unique; Type: CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.chapters
    ADD CONSTRAINT chapters_slug_unique UNIQUE (slug);


--
-- TOC entry 4056 (class 2606 OID 24883)
-- Name: companies companies_companyname_key; Type: CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_companyname_key UNIQUE (companyname);


--
-- TOC entry 4058 (class 2606 OID 24885)
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (companyid);


--
-- TOC entry 4060 (class 2606 OID 24887)
-- Name: documentinteractions documentinteractions_pkey; Type: CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.documentinteractions
    ADD CONSTRAINT documentinteractions_pkey PRIMARY KEY (interactionid);


--
-- TOC entry 4062 (class 2606 OID 24889)
-- Name: documentinteractions documentinteractions_userid_documentid_key; Type: CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.documentinteractions
    ADD CONSTRAINT documentinteractions_userid_documentid_key UNIQUE (userid, documentid);


--
-- TOC entry 4064 (class 2606 OID 24891)
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (documentid);


--
-- TOC entry 4066 (class 2606 OID 24893)
-- Name: documents documents_title_key; Type: CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_title_key UNIQUE (title);


--
-- TOC entry 4070 (class 2606 OID 24895)
-- Name: mainsubjects mainsubjects_mainsubjectname_key; Type: CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.mainsubjects
    ADD CONSTRAINT mainsubjects_mainsubjectname_key UNIQUE (mainsubjectname);


--
-- TOC entry 4072 (class 2606 OID 24897)
-- Name: mainsubjects mainsubjects_pkey; Type: CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.mainsubjects
    ADD CONSTRAINT mainsubjects_pkey PRIMARY KEY (mainsubjectid);


--
-- TOC entry 4074 (class 2606 OID 24899)
-- Name: mainsubjects mainsubjects_slug_unique; Type: CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.mainsubjects
    ADD CONSTRAINT mainsubjects_slug_unique UNIQUE (slug);


--
-- TOC entry 4076 (class 2606 OID 24901)
-- Name: passwordresettokens passwordresettokens_pkey; Type: CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.passwordresettokens
    ADD CONSTRAINT passwordresettokens_pkey PRIMARY KEY (id);


--
-- TOC entry 4078 (class 2606 OID 24903)
-- Name: passwordresettokens passwordresettokens_userid_token_key; Type: CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.passwordresettokens
    ADD CONSTRAINT passwordresettokens_userid_token_key UNIQUE (userid, token);


--
-- TOC entry 4080 (class 2606 OID 24905)
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (paymentid);


--
-- TOC entry 4082 (class 2606 OID 24907)
-- Name: payments payments_transactionid_key; Type: CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_transactionid_key UNIQUE (transactionid);


--
-- TOC entry 4084 (class 2606 OID 24909)
-- Name: pointtransactions pointtransactions_pkey; Type: CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.pointtransactions
    ADD CONSTRAINT pointtransactions_pkey PRIMARY KEY (transactionid);


--
-- TOC entry 4086 (class 2606 OID 24911)
-- Name: promotions promotions_pkey; Type: CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_pkey PRIMARY KEY (promotionid);


--
-- TOC entry 4106 (class 2606 OID 25052)
-- Name: rechargepacks rechargepacks_packname_key; Type: CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.rechargepacks
    ADD CONSTRAINT rechargepacks_packname_key UNIQUE (packname);


--
-- TOC entry 4108 (class 2606 OID 25050)
-- Name: rechargepacks rechargepacks_pkey; Type: CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.rechargepacks
    ADD CONSTRAINT rechargepacks_pkey PRIMARY KEY (packid);


--
-- TOC entry 4068 (class 2606 OID 24913)
-- Name: documents unique_slug; Type: CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT unique_slug UNIQUE (slug);


--
-- TOC entry 4088 (class 2606 OID 24915)
-- Name: uploads uploads_pkey; Type: CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.uploads
    ADD CONSTRAINT uploads_pkey PRIMARY KEY (uploadid);


--
-- TOC entry 4090 (class 2606 OID 24917)
-- Name: uploads uploads_uploaderid_documentid_key; Type: CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.uploads
    ADD CONSTRAINT uploads_uploaderid_documentid_key UNIQUE (uploaderid, documentid);


--
-- TOC entry 4092 (class 2606 OID 24919)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4094 (class 2606 OID 24921)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (userid);


--
-- TOC entry 4096 (class 2606 OID 24923)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 4098 (class 2606 OID 24925)
-- Name: vouchers vouchers_pkey; Type: CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_pkey PRIMARY KEY (voucherid);


--
-- TOC entry 4100 (class 2606 OID 24927)
-- Name: vouchers vouchers_vouchercode_key; Type: CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_vouchercode_key UNIQUE (vouchercode);


--
-- TOC entry 4102 (class 2606 OID 24929)
-- Name: voucherusage voucherusage_pkey; Type: CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.voucherusage
    ADD CONSTRAINT voucherusage_pkey PRIMARY KEY (voucherusageid);


--
-- TOC entry 4104 (class 2606 OID 24931)
-- Name: voucherusage voucherusage_userid_voucherid_key; Type: CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.voucherusage
    ADD CONSTRAINT voucherusage_userid_voucherid_key UNIQUE (userid, voucherid);


--
-- TOC entry 4109 (class 2606 OID 24932)
-- Name: categories categories_mainsubjectid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_mainsubjectid_fkey FOREIGN KEY (mainsubjectid) REFERENCES public.mainsubjects(mainsubjectid);


--
-- TOC entry 4110 (class 2606 OID 24937)
-- Name: categories categories_parentcategoryid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parentcategoryid_fkey FOREIGN KEY (parentcategoryid) REFERENCES public.categories(categoryid);


--
-- TOC entry 4111 (class 2606 OID 24942)
-- Name: chapters chapters_categoryid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.chapters
    ADD CONSTRAINT chapters_categoryid_fkey FOREIGN KEY (categoryid) REFERENCES public.categories(categoryid);


--
-- TOC entry 4112 (class 2606 OID 24947)
-- Name: documentinteractions documentinteractions_documentid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.documentinteractions
    ADD CONSTRAINT documentinteractions_documentid_fkey FOREIGN KEY (documentid) REFERENCES public.documents(documentid);


--
-- TOC entry 4113 (class 2606 OID 24952)
-- Name: documentinteractions documentinteractions_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.documentinteractions
    ADD CONSTRAINT documentinteractions_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(userid);


--
-- TOC entry 4114 (class 2606 OID 24957)
-- Name: documents documents_chapterid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_chapterid_fkey FOREIGN KEY (chapterid) REFERENCES public.chapters(chapterid);


--
-- TOC entry 4115 (class 2606 OID 24962)
-- Name: passwordresettokens passwordresettokens_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.passwordresettokens
    ADD CONSTRAINT passwordresettokens_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(userid);


--
-- TOC entry 4116 (class 2606 OID 24967)
-- Name: payments payments_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(userid);


--
-- TOC entry 4117 (class 2606 OID 24972)
-- Name: pointtransactions pointtransactions_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.pointtransactions
    ADD CONSTRAINT pointtransactions_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(userid);


--
-- TOC entry 4118 (class 2606 OID 24977)
-- Name: promotions promotions_companyid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_companyid_fkey FOREIGN KEY (companyid) REFERENCES public.companies(companyid);


--
-- TOC entry 4119 (class 2606 OID 24982)
-- Name: uploads uploads_documentid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.uploads
    ADD CONSTRAINT uploads_documentid_fkey FOREIGN KEY (documentid) REFERENCES public.documents(documentid);


--
-- TOC entry 4120 (class 2606 OID 24987)
-- Name: uploads uploads_uploaderid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.uploads
    ADD CONSTRAINT uploads_uploaderid_fkey FOREIGN KEY (uploaderid) REFERENCES public.users(userid);


--
-- TOC entry 4121 (class 2606 OID 24992)
-- Name: vouchers vouchers_promotionid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_promotionid_fkey FOREIGN KEY (promotionid) REFERENCES public.promotions(promotionid);


--
-- TOC entry 4122 (class 2606 OID 24997)
-- Name: voucherusage voucherusage_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.voucherusage
    ADD CONSTRAINT voucherusage_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(userid);


--
-- TOC entry 4123 (class 2606 OID 25002)
-- Name: voucherusage voucherusage_voucherid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: minhtrung
--

ALTER TABLE ONLY public.voucherusage
    ADD CONSTRAINT voucherusage_voucherid_fkey FOREIGN KEY (voucherid) REFERENCES public.vouchers(voucherid);


--
-- TOC entry 4302 (class 0 OID 0)
-- Dependencies: 265
-- Name: FUNCTION pg_replication_origin_advance(text, pg_lsn); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_advance(text, pg_lsn) TO azure_pg_admin;


--
-- TOC entry 4303 (class 0 OID 0)
-- Dependencies: 278
-- Name: FUNCTION pg_replication_origin_create(text); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_create(text) TO azure_pg_admin;


--
-- TOC entry 4304 (class 0 OID 0)
-- Dependencies: 270
-- Name: FUNCTION pg_replication_origin_drop(text); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_drop(text) TO azure_pg_admin;


--
-- TOC entry 4305 (class 0 OID 0)
-- Dependencies: 271
-- Name: FUNCTION pg_replication_origin_oid(text); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_oid(text) TO azure_pg_admin;


--
-- TOC entry 4306 (class 0 OID 0)
-- Dependencies: 272
-- Name: FUNCTION pg_replication_origin_progress(text, boolean); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_progress(text, boolean) TO azure_pg_admin;


--
-- TOC entry 4307 (class 0 OID 0)
-- Dependencies: 273
-- Name: FUNCTION pg_replication_origin_session_is_setup(); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_session_is_setup() TO azure_pg_admin;


--
-- TOC entry 4308 (class 0 OID 0)
-- Dependencies: 274
-- Name: FUNCTION pg_replication_origin_session_progress(boolean); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_session_progress(boolean) TO azure_pg_admin;


--
-- TOC entry 4309 (class 0 OID 0)
-- Dependencies: 279
-- Name: FUNCTION pg_replication_origin_session_reset(); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_session_reset() TO azure_pg_admin;


--
-- TOC entry 4310 (class 0 OID 0)
-- Dependencies: 275
-- Name: FUNCTION pg_replication_origin_session_setup(text); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_session_setup(text) TO azure_pg_admin;


--
-- TOC entry 4311 (class 0 OID 0)
-- Dependencies: 276
-- Name: FUNCTION pg_replication_origin_xact_reset(); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_xact_reset() TO azure_pg_admin;


--
-- TOC entry 4312 (class 0 OID 0)
-- Dependencies: 277
-- Name: FUNCTION pg_replication_origin_xact_setup(pg_lsn, timestamp with time zone); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_xact_setup(pg_lsn, timestamp with time zone) TO azure_pg_admin;


--
-- TOC entry 4313 (class 0 OID 0)
-- Dependencies: 280
-- Name: FUNCTION pg_show_replication_origin_status(OUT local_id oid, OUT external_id text, OUT remote_lsn pg_lsn, OUT local_lsn pg_lsn); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_show_replication_origin_status(OUT local_id oid, OUT external_id text, OUT remote_lsn pg_lsn, OUT local_lsn pg_lsn) TO azure_pg_admin;


--
-- TOC entry 4314 (class 0 OID 0)
-- Dependencies: 266
-- Name: FUNCTION pg_stat_reset(); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_stat_reset() TO azure_pg_admin;


--
-- TOC entry 4315 (class 0 OID 0)
-- Dependencies: 267
-- Name: FUNCTION pg_stat_reset_shared(text); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_stat_reset_shared(text) TO azure_pg_admin;


--
-- TOC entry 4316 (class 0 OID 0)
-- Dependencies: 269
-- Name: FUNCTION pg_stat_reset_single_function_counters(oid); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_stat_reset_single_function_counters(oid) TO azure_pg_admin;


--
-- TOC entry 4317 (class 0 OID 0)
-- Dependencies: 268
-- Name: FUNCTION pg_stat_reset_single_table_counters(oid); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_stat_reset_single_table_counters(oid) TO azure_pg_admin;


--
-- TOC entry 4318 (class 0 OID 0)
-- Dependencies: 118
-- Name: COLUMN pg_config.name; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(name) ON TABLE pg_catalog.pg_config TO azure_pg_admin;


--
-- TOC entry 4319 (class 0 OID 0)
-- Dependencies: 118
-- Name: COLUMN pg_config.setting; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(setting) ON TABLE pg_catalog.pg_config TO azure_pg_admin;


--
-- TOC entry 4320 (class 0 OID 0)
-- Dependencies: 114
-- Name: COLUMN pg_hba_file_rules.line_number; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(line_number) ON TABLE pg_catalog.pg_hba_file_rules TO azure_pg_admin;


--
-- TOC entry 4321 (class 0 OID 0)
-- Dependencies: 114
-- Name: COLUMN pg_hba_file_rules.type; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(type) ON TABLE pg_catalog.pg_hba_file_rules TO azure_pg_admin;


--
-- TOC entry 4322 (class 0 OID 0)
-- Dependencies: 114
-- Name: COLUMN pg_hba_file_rules.database; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(database) ON TABLE pg_catalog.pg_hba_file_rules TO azure_pg_admin;


--
-- TOC entry 4323 (class 0 OID 0)
-- Dependencies: 114
-- Name: COLUMN pg_hba_file_rules.user_name; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(user_name) ON TABLE pg_catalog.pg_hba_file_rules TO azure_pg_admin;


--
-- TOC entry 4324 (class 0 OID 0)
-- Dependencies: 114
-- Name: COLUMN pg_hba_file_rules.address; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(address) ON TABLE pg_catalog.pg_hba_file_rules TO azure_pg_admin;


--
-- TOC entry 4325 (class 0 OID 0)
-- Dependencies: 114
-- Name: COLUMN pg_hba_file_rules.netmask; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(netmask) ON TABLE pg_catalog.pg_hba_file_rules TO azure_pg_admin;


--
-- TOC entry 4326 (class 0 OID 0)
-- Dependencies: 114
-- Name: COLUMN pg_hba_file_rules.auth_method; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(auth_method) ON TABLE pg_catalog.pg_hba_file_rules TO azure_pg_admin;


--
-- TOC entry 4327 (class 0 OID 0)
-- Dependencies: 114
-- Name: COLUMN pg_hba_file_rules.options; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(options) ON TABLE pg_catalog.pg_hba_file_rules TO azure_pg_admin;


--
-- TOC entry 4328 (class 0 OID 0)
-- Dependencies: 114
-- Name: COLUMN pg_hba_file_rules.error; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(error) ON TABLE pg_catalog.pg_hba_file_rules TO azure_pg_admin;


--
-- TOC entry 4329 (class 0 OID 0)
-- Dependencies: 164
-- Name: COLUMN pg_replication_origin_status.local_id; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(local_id) ON TABLE pg_catalog.pg_replication_origin_status TO azure_pg_admin;


--
-- TOC entry 4330 (class 0 OID 0)
-- Dependencies: 164
-- Name: COLUMN pg_replication_origin_status.external_id; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(external_id) ON TABLE pg_catalog.pg_replication_origin_status TO azure_pg_admin;


--
-- TOC entry 4331 (class 0 OID 0)
-- Dependencies: 164
-- Name: COLUMN pg_replication_origin_status.remote_lsn; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(remote_lsn) ON TABLE pg_catalog.pg_replication_origin_status TO azure_pg_admin;


--
-- TOC entry 4332 (class 0 OID 0)
-- Dependencies: 164
-- Name: COLUMN pg_replication_origin_status.local_lsn; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(local_lsn) ON TABLE pg_catalog.pg_replication_origin_status TO azure_pg_admin;


--
-- TOC entry 4333 (class 0 OID 0)
-- Dependencies: 119
-- Name: COLUMN pg_shmem_allocations.name; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(name) ON TABLE pg_catalog.pg_shmem_allocations TO azure_pg_admin;


--
-- TOC entry 4334 (class 0 OID 0)
-- Dependencies: 119
-- Name: COLUMN pg_shmem_allocations.off; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(off) ON TABLE pg_catalog.pg_shmem_allocations TO azure_pg_admin;


--
-- TOC entry 4335 (class 0 OID 0)
-- Dependencies: 119
-- Name: COLUMN pg_shmem_allocations.size; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(size) ON TABLE pg_catalog.pg_shmem_allocations TO azure_pg_admin;


--
-- TOC entry 4336 (class 0 OID 0)
-- Dependencies: 119
-- Name: COLUMN pg_shmem_allocations.allocated_size; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(allocated_size) ON TABLE pg_catalog.pg_shmem_allocations TO azure_pg_admin;


--
-- TOC entry 4337 (class 0 OID 0)
-- Dependencies: 59
-- Name: COLUMN pg_statistic.starelid; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(starelid) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4338 (class 0 OID 0)
-- Dependencies: 59
-- Name: COLUMN pg_statistic.staattnum; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(staattnum) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4339 (class 0 OID 0)
-- Dependencies: 59
-- Name: COLUMN pg_statistic.stainherit; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stainherit) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4340 (class 0 OID 0)
-- Dependencies: 59
-- Name: COLUMN pg_statistic.stanullfrac; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stanullfrac) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4341 (class 0 OID 0)
-- Dependencies: 59
-- Name: COLUMN pg_statistic.stawidth; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stawidth) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4342 (class 0 OID 0)
-- Dependencies: 59
-- Name: COLUMN pg_statistic.stadistinct; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stadistinct) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4343 (class 0 OID 0)
-- Dependencies: 59
-- Name: COLUMN pg_statistic.stakind1; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stakind1) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4344 (class 0 OID 0)
-- Dependencies: 59
-- Name: COLUMN pg_statistic.stakind2; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stakind2) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4345 (class 0 OID 0)
-- Dependencies: 59
-- Name: COLUMN pg_statistic.stakind3; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stakind3) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4346 (class 0 OID 0)
-- Dependencies: 59
-- Name: COLUMN pg_statistic.stakind4; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stakind4) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4347 (class 0 OID 0)
-- Dependencies: 59
-- Name: COLUMN pg_statistic.stakind5; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stakind5) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4348 (class 0 OID 0)
-- Dependencies: 59
-- Name: COLUMN pg_statistic.staop1; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(staop1) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4349 (class 0 OID 0)
-- Dependencies: 59
-- Name: COLUMN pg_statistic.staop2; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(staop2) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4350 (class 0 OID 0)
-- Dependencies: 59
-- Name: COLUMN pg_statistic.staop3; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(staop3) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4351 (class 0 OID 0)
-- Dependencies: 59
-- Name: COLUMN pg_statistic.staop4; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(staop4) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4352 (class 0 OID 0)
-- Dependencies: 59
-- Name: COLUMN pg_statistic.staop5; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(staop5) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4353 (class 0 OID 0)
-- Dependencies: 59
-- Name: COLUMN pg_statistic.stacoll1; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stacoll1) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4354 (class 0 OID 0)
-- Dependencies: 59
-- Name: COLUMN pg_statistic.stacoll2; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stacoll2) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4355 (class 0 OID 0)
-- Dependencies: 59
-- Name: COLUMN pg_statistic.stacoll3; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stacoll3) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4356 (class 0 OID 0)
-- Dependencies: 59
-- Name: COLUMN pg_statistic.stacoll4; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stacoll4) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4357 (class 0 OID 0)
-- Dependencies: 59
-- Name: COLUMN pg_statistic.stacoll5; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stacoll5) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4358 (class 0 OID 0)
-- Dependencies: 59
-- Name: COLUMN pg_statistic.stanumbers1; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stanumbers1) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4359 (class 0 OID 0)
-- Dependencies: 59
-- Name: COLUMN pg_statistic.stanumbers2; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stanumbers2) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4360 (class 0 OID 0)
-- Dependencies: 59
-- Name: COLUMN pg_statistic.stanumbers3; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stanumbers3) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4361 (class 0 OID 0)
-- Dependencies: 59
-- Name: COLUMN pg_statistic.stanumbers4; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stanumbers4) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4362 (class 0 OID 0)
-- Dependencies: 59
-- Name: COLUMN pg_statistic.stanumbers5; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stanumbers5) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4363 (class 0 OID 0)
-- Dependencies: 59
-- Name: COLUMN pg_statistic.stavalues1; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stavalues1) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4364 (class 0 OID 0)
-- Dependencies: 59
-- Name: COLUMN pg_statistic.stavalues2; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stavalues2) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4365 (class 0 OID 0)
-- Dependencies: 59
-- Name: COLUMN pg_statistic.stavalues3; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stavalues3) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4366 (class 0 OID 0)
-- Dependencies: 59
-- Name: COLUMN pg_statistic.stavalues4; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stavalues4) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4367 (class 0 OID 0)
-- Dependencies: 59
-- Name: COLUMN pg_statistic.stavalues5; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stavalues5) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4368 (class 0 OID 0)
-- Dependencies: 84
-- Name: COLUMN pg_subscription.oid; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(oid) ON TABLE pg_catalog.pg_subscription TO azure_pg_admin;


--
-- TOC entry 4369 (class 0 OID 0)
-- Dependencies: 84
-- Name: COLUMN pg_subscription.subdbid; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(subdbid) ON TABLE pg_catalog.pg_subscription TO azure_pg_admin;


--
-- TOC entry 4370 (class 0 OID 0)
-- Dependencies: 84
-- Name: COLUMN pg_subscription.subname; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(subname) ON TABLE pg_catalog.pg_subscription TO azure_pg_admin;


--
-- TOC entry 4371 (class 0 OID 0)
-- Dependencies: 84
-- Name: COLUMN pg_subscription.subowner; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(subowner) ON TABLE pg_catalog.pg_subscription TO azure_pg_admin;


--
-- TOC entry 4372 (class 0 OID 0)
-- Dependencies: 84
-- Name: COLUMN pg_subscription.subenabled; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(subenabled) ON TABLE pg_catalog.pg_subscription TO azure_pg_admin;


--
-- TOC entry 4373 (class 0 OID 0)
-- Dependencies: 84
-- Name: COLUMN pg_subscription.subconninfo; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(subconninfo) ON TABLE pg_catalog.pg_subscription TO azure_pg_admin;


--
-- TOC entry 4374 (class 0 OID 0)
-- Dependencies: 84
-- Name: COLUMN pg_subscription.subslotname; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(subslotname) ON TABLE pg_catalog.pg_subscription TO azure_pg_admin;


--
-- TOC entry 4375 (class 0 OID 0)
-- Dependencies: 84
-- Name: COLUMN pg_subscription.subsynccommit; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(subsynccommit) ON TABLE pg_catalog.pg_subscription TO azure_pg_admin;


--
-- TOC entry 4376 (class 0 OID 0)
-- Dependencies: 84
-- Name: COLUMN pg_subscription.subpublications; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(subpublications) ON TABLE pg_catalog.pg_subscription TO azure_pg_admin;


-- Completed on 2024-12-19 13:51:03

--
-- PostgreSQL database dump complete
--

