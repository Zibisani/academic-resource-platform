import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, ArrowRight, Star, Download, Users, FileText,
  Search, TrendingUp, Shield, ChevronRight, Award, Upload,
  GraduationCap, Layers, Menu, X, CheckCircle, BookMarked,
  FlameKindling, Sparkles, BarChart3, Globe
} from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle';

// ─── Static mock data for resource preview ────────────────────────────────────
const FEATURED_RESOURCES = [
  {
    id: 1,
    title: 'Database Systems Final Exam 2024',
    module: 'CS301 – Database Systems',
    type: 'past_exam',
    type_label: 'Past Exam',
    average_rating: 4.8,
    rating_count: 34,
    download_count: 210,
    uploader: 'K. Moalosi',
    verified: true,
    days_ago: 5,
  },
  {
    id: 2,
    title: 'Comprehensive Data Structures Notes',
    module: 'CS201 – Data Structures',
    type: 'notes',
    type_label: 'Notes',
    average_rating: 4.6,
    rating_count: 58,
    download_count: 389,
    uploader: 'T. Sebetoane',
    verified: true,
    days_ago: 12,
  },
  {
    id: 3,
    title: 'Organic Chemistry Reaction Mechanisms',
    module: 'CHEM210 – Organic Chemistry',
    type: 'notes',
    type_label: 'Notes',
    average_rating: 4.9,
    rating_count: 21,
    download_count: 143,
    uploader: 'B. Gabanakgosi',
    verified: false,
    days_ago: 3,
  },
];

const FACULTIES = [
  { name: 'Engineering & Technology', icon: Layers, count: 840, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40' },
  { name: 'Science', icon: Globe, count: 620, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
  { name: 'Business', icon: BarChart3, count: 510, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40' },
  { name: 'Education', icon: GraduationCap, count: 390, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/40' },
  { name: 'Humanities', icon: BookMarked, count: 275, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40' },
  { name: 'Health Sciences', icon: Shield, count: 460, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/40' },
];

const TESTIMONIALS = [
  {
    quote: "Found a complete set of past papers for every module in my programme. Went from struggling to finishing in the top 10 of my class.",
    name: "Mpho Ditsele",
    role: "3rd Year, Computer Science",
    initial: "M",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  {
    quote: "The verified contributor system means I know I can trust what I'm downloading. It's not just random uploads — it's curated quality.",
    name: "Lerato Kgosimore",
    role: "2nd Year, Accounting",
    initial: "L",
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  {
    quote: "I uploaded my biochemistry notes and they've been downloaded over 400 times. Knowing I'm actually helping people is incredible.",
    name: "Onalenna Tau",
    role: "Final Year, Biomedical Sciences",
    initial: "O",
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  },
];

// ─── Type badge colours ────────────────────────────────────────────────────────
const TYPE_STYLES = {
  past_exam: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  notes:     'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  video:     'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  image:     'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  textbook:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

// ─── Mini resource card for the preview section ───────────────────────────────
const PreviewCard = ({ resource }) => (
  <div className="bg-card border border-border rounded-xl shadow-sm p-5 flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
    <div className="flex items-start justify-between gap-2">
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_STYLES[resource.type]}`}>
        {resource.type_label}
      </span>
      {resource.verified && (
        <span className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          <Award className="w-3 h-3" />
          Verified
        </span>
      )}
    </div>
    <div>
      <h4 className="font-semibold text-sm text-foreground leading-snug line-clamp-2">{resource.title}</h4>
      <p className="text-xs text-muted-foreground mt-1">{resource.module}</p>
    </div>
    <div className="flex items-center justify-between pt-1 mt-auto border-t border-border/60">
      <div className="flex items-center gap-1">
        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
        <span className="text-xs font-semibold text-foreground">{resource.average_rating}</span>
        <span className="text-xs text-muted-foreground">({resource.rating_count})</span>
      </div>
      <div className="flex items-center gap-1 text-muted-foreground">
        <Download className="w-3.5 h-3.5" />
        <span className="text-xs">{resource.download_count}</span>
      </div>
    </div>
  </div>
);

// ─── Animated counter ─────────────────────────────────────────────────────────
const AnimatedCounter = ({ target, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1800;
          const steps = 50;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) { setCount(target); clearInterval(timer); }
            else setCount(Math.floor(current));
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

// ─── Main HomePage component ──────────────────────────────────────────────────
const HomePage = () => {
  useDocumentTitle('Home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm'
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 p-2 rounded-lg">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold tracking-tight">AcademicHub</span>
          </div>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#browse" className="text-muted-foreground hover:text-foreground transition-colors">Browse</a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How it works</a>
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center justify-center text-sm font-medium rounded-md border border-border bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 transition-colors shadow-sm"
            >
              Get started
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-muted transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/98 backdrop-blur px-4 py-4 space-y-3">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium py-2 text-muted-foreground hover:text-foreground">Features</a>
            <a href="#browse" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium py-2 text-muted-foreground hover:text-foreground">Browse</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium py-2 text-muted-foreground hover:text-foreground">How it works</a>
            <div className="pt-2 border-t border-border flex flex-col gap-2">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full inline-flex items-center justify-center text-sm font-medium rounded-md border border-border h-10 transition-colors hover:bg-accent">Log in</Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="w-full inline-flex items-center justify-center text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-10 transition-colors">Get started <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">

        {/* ── Hero ───────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden pt-16 pb-24 sm:pt-24 sm:pb-32">
          {/* Subtle grid background */}
          <div
            className="absolute inset-0 -z-10 opacity-40 dark:opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--border)) 1px, transparent 0)`,
              backgroundSize: '32px 32px',
            }}
          />
          {/* Soft glow */}
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-primary/5 blur-3xl -z-10" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3.5 py-1.5 rounded-full mb-6 border border-primary/20">
                <Sparkles className="w-3.5 h-3.5" />
                Built for University of Botswana students
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
                Your entire academic{' '}
                <span className="text-primary relative">
                  library
                  <svg className="absolute -bottom-1.5 left-0 w-full" viewBox="0 0 200 8" preserveAspectRatio="none">
                    <path d="M0 6 Q50 2 100 5 Q150 8 200 4" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.5"/>
                  </svg>
                </span>
                {', '}in one place
              </h1>

              <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Upload, discover, and download past exams, lecture notes, textbooks, and more —
                all ranked and reviewed by your fellow UB students.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-6 shadow-sm transition-all hover:shadow-md"
                >
                  Join for free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <a
                  href="#preview"
                  className="inline-flex items-center justify-center text-sm font-medium rounded-lg border border-border bg-background hover:bg-accent h-11 px-6 transition-colors"
                >
                  <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                  Browse resources
                </a>
              </div>

              {/* Trust indicators */}
              <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" />Free to join</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" />University email required</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" />Peer-reviewed content</span>
              </div>
            </div>

            {/* Resource card preview floating below hero */}
            <div id="preview" className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {FEATURED_RESOURCES.map((r, i) => (
                <div key={r.id} style={{ animationDelay: `${i * 100}ms` }} className="animate-fade-in-up">
                  <PreviewCard resource={r} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats bar ──────────────────────────────────────────────────────── */}
        <section className="border-y border-border bg-card/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              {[
                { label: 'Resources shared', value: 3200, suffix: '+', icon: FileText },
                { label: 'Active students', value: 1800, suffix: '+', icon: Users },
                { label: 'Total downloads', value: 42000, suffix: '+', icon: Download },
                { label: 'Modules covered', value: 240, suffix: '+', icon: BookOpen },
              ].map(({ label, value, suffix, icon: Icon }) => (
                <div key={label} className="flex flex-col items-center gap-2">
                  <div className="bg-primary/10 p-2.5 rounded-lg mb-1">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-3xl font-bold tracking-tight text-foreground">
                    <AnimatedCounter target={value} suffix={suffix} />
                  </p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ───────────────────────────────────────────────────────── */}
        <section id="features" className="py-20 sm:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Why AcademicHub</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Everything your studies need
              </h2>
              <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
                Designed around how UB students actually study — by module, by exam season, and by what their peers say works.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: TrendingUp,
                  title: 'Smart personalised feed',
                  desc: 'Your feed surfaces the highest-rated resources for your exact programme and modules — updated daily based on what your cohort is engaging with.',
                  color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
                },
                {
                  icon: Shield,
                  title: 'Verified contributors',
                  desc: 'Admins can mark trusted uploaders as Verified Contributors, giving their resources a quality signal you can rely on when exam week hits.',
                  color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
                },
                {
                  icon: Star,
                  title: 'Community ratings',
                  desc: 'Every resource is rated 1–5 stars by peers who have used it. Confidence-weighted scoring ensures popular resources actually deserve their rank.',
                  color: 'bg-amber-50 dark:bg-amberced-950/40 text-amber-600 dark:text-amber-400',
                },
                {
                  icon: Search,
                  title: 'Hierarchical browse',
                  desc: 'Drill down from Faculty → Programme → Course → Module, or tag search across the entire library for resources that cut across subjects.',
                  color: 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400',
                },
                {
                  icon: FlameKindling,
                  title: 'Trending this week',
                  desc: 'See what\'s being downloaded most within your modules right now. Perfect for spotting what your peers are using to prepare for upcoming exams.',
                  color: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
                },
                {
                  icon: Upload,
                  title: 'Easy contribution',
                  desc: 'Upload PDFs, images, or video links in under a minute. Tag your resource by module and type so it reaches exactly the students who need it.',
                  color: 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400',
                },
              ].map(({ icon: Icon, title, desc, color }) => (
                <div key={title} className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className={`inline-flex p-2.5 rounded-lg ${color} mb-4`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Browse by faculty ──────────────────────────────────────────────── */}
        <section id="browse" className="py-20 sm:py-28 bg-muted/30 border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Academic library</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Browse by faculty</h2>
              <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
                Resources are organised across every faculty at UB. Find your home.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {FACULTIES.map(({ name, icon: Icon, count, color, bg }) => (
                <Link
                  key={name}
                  to="/register"
                  className="group bg-card border border-border rounded-xl p-5 flex flex-col items-center text-center gap-3 shadow-sm hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className={`p-3 rounded-xl ${bg}`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground leading-snug">{name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{count} resources</p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link
                to="/register"
                className="inline-flex items-center text-sm font-medium text-primary hover:underline underline-offset-4"
              >
                Sign up to browse all resources
                <ChevronRight className="w-4 h-4 ml-0.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── How it works ───────────────────────────────────────────────────── */}
        <section id="how-it-works" className="py-20 sm:py-28">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Getting started</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Up and running in minutes</h2>
              <p className="mt-3 text-muted-foreground">Three steps between you and every resource in your programme.</p>
            </div>

            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Connector line on desktop */}
              <div className="hidden md:block absolute top-10 left-[calc(16.7%+1rem)] right-[calc(16.7%+1rem)] h-px bg-border z-0" />

              {[
                {
                  step: '01',
                  title: 'Create your account',
                  desc: 'Register with your @ub.ac.bw email, select your faculty, programme, and enrolled courses. Takes under 60 seconds.',
                  icon: GraduationCap,
                },
                {
                  step: '02',
                  title: 'Explore your feed',
                  desc: 'Your personalised feed immediately shows the highest-rated resources for your exact modules, plus what\'s trending this week.',
                  icon: TrendingUp,
                },
                {
                  step: '03',
                  title: 'Contribute and earn',
                  desc: 'Upload your own notes, past exams, or summaries. Get rated and reviewed by peers, and earn Verified Contributor status.',
                  icon: Award,
                },
              ].map(({ step, title, desc, icon: Icon }, i) => (
                <div key={step} className="relative z-10 flex flex-col items-center text-center">
                  <div className="relative bg-background border-2 border-border rounded-full w-20 h-20 flex items-center justify-center mb-5 shadow-sm">
                    <Icon className="w-8 h-8 text-primary" />
                    <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Testimonials ───────────────────────────────────────────────────── */}
        <section className="py-20 sm:py-28 bg-muted/30 border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Student voices</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">What your peers are saying</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map(({ quote, name, role, initial, color }) => (
                <div key={name} className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col gap-4">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">"{quote}"</p>
                  <div className="flex items-center gap-3 pt-2 border-t border-border/60">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${color}`}>
                      {initial}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{name}</p>
                      <p className="text-xs text-muted-foreground">{role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA banner ───────────────────────────────────────────────── */}
        <section className="py-20 sm:py-28">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative bg-card border border-border rounded-2xl shadow-sm overflow-hidden p-10 sm:p-14 text-center">
              {/* Subtle decorative dots */}
              <div
                className="absolute inset-0 opacity-30 dark:opacity-10 -z-0"
                style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--border)) 1px, transparent 0)`,
                  backgroundSize: '24px 24px',
                }}
              />
              <div className="relative z-10">
                <div className="inline-flex bg-primary/10 p-3 rounded-xl mb-5">
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
                  Start studying smarter today
                </h2>
                <p className="text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
                  Join over 1,800 UB students who are already sharing and discovering
                  the best academic resources on campus. It's completely free.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 shadow-sm transition-all hover:shadow-md"
                  >
                    Create your free account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center text-sm font-medium rounded-lg border border-border bg-background hover:bg-accent h-11 px-6 transition-colors"
                  >
                    Already have an account? Log in
                  </Link>
                </div>
                <p className="mt-5 text-xs text-muted-foreground">
                  Requires a valid @ub.ac.bw university email address
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-card/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-primary/10 p-1.5 rounded-md">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <span className="font-bold tracking-tight">AcademicHub</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                The academic resource platform built for and by University of Botswana students.
                Share knowledge. Elevate your cohort.
              </p>
            </div>

            {/* Platform */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Platform</h4>
              <ul className="space-y-2">
                {[
                  ['Browse resources', '/register'],
                  ['Upload a resource', '/register'],
                  ['My uploads', '/register'],
                  ['Leaderboard', '/register'],
                ].map(([label, to]) => (
                  <li key={label}>
                    <Link to={to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Account</h4>
              <ul className="space-y-2">
                {[
                  ['Sign up', '/register'],
                  ['Log in', '/login'],
                  ['Reset password', '/login'],
                ].map(([label, to]) => (
                  <li key={label}>
                    <Link to={to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} AcademicHub. Built for University of Botswana.</p>
            <p>All resources are contributed by UB students and reviewed by the community.</p>
          </div>
        </div>
      </footer>

      {/* ── CSS for fade-in-up animation ─────────────────────────────────────── */}
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease both;
        }
      `}</style>
    </div>
  );
};

export default HomePage;
