// Single source of truth for facts about Leo. The UI and (later) the digital
// twin both read from here, so nothing on the site can drift from the CV.

export const profile = {
  name: "Leonardo Hemming",
  shortName: "Leo",
  role: "Senior Full-Stack Engineer",
  location: "Porto Alegre, Brazil",
  coordinates: { lat: -30.03, lng: -51.23 },
  email: "leonardohemming@gmail.com",
  links: {
    linkedin: "https://www.linkedin.com/in/leonardo-hemming",
    github: "https://github.com/LdSH-dev",
  },
  yearsOfExperience: "7+",
} as const;

// `from`/`to` drive the count-up animation; `to` is the real figure.
export const proofPoints = [
  { prefix: "22→", from: 22, to: 5, suffix: "", unit: "min", label: "E2E pipeline runtime, via test sharding" },
  { prefix: "", from: 0, to: 70, suffix: "%+", unit: "", label: "of bookings handled by an AI agent" },
  { prefix: "", from: 0, to: 500, suffix: "K+", unit: "/yr", label: "PCI payments at 99.9% uptime" },
  { prefix: "", from: 1, to: 1, suffix: "M+", unit: "/mo", label: "monthly sessions on an app I shipped" },
] as const;

// Career, newest first. `details` mirror the LinkedIn experience entries.
// `story` tells the role in four plain-English sentences: the context, the
// challenge, what I did and what changed (STAR, never labelled). Roles
// without a story only appear as a footnote.
export type Role = {
  start: string; // YYYY-MM
  end: string | null; // YYYY-MM, null while ongoing
  period: string;
  company: string;
  role: string;
  place: string;
  details: string[];
  stack: string[];
  story?: [string, string, string, string];
  metric?: { value: string; label: string };
  current?: boolean;
};

export const experience: Role[] = [
  {
    start: "2025-09",
    end: "2026-10",
    period: "Sep 2025 — Oct 2026",
    company: "NativePath",
    role: "Software Engineer",
    place: "Miami, FL · remote",
    story: [
      "NativePath sells to customers all over the US, and its online store gets more than a million visits a month.",
      "Every release sat waiting 22 minutes for automated tests, and the store had to stay fast while the team kept shipping.",
      "I made the pages lighter and quicker to load, added live monitoring to catch errors early, and split the tests to run in parallel.",
      "Releases are now tested in 5 minutes instead of 22, and the store scores above 90 out of 100 on speed.",
    ],
    metric: { value: "−77%", label: "time to test every release" },
    details: [
      "Built and optimized a high-traffic headless Shopify Plus storefront (Hydrogen, React Router 7, TypeScript, Vite) serving 1M+ monthly sessions on Oxygen edge infrastructure.",
      "Implemented Datadog observability across the theme site and Hydrogen storefront: centralized logging, error tracking and performance monitoring.",
      "Lifted Lighthouse performance scores above 90 through SSR tuning, route-level code splitting, lazy loading and WebP/AVIF image optimization.",
      "Refactored the Playwright E2E pipeline on GitHub Actions, cutting test runs from ~22 to ~5 minutes (~77% faster) through test sharding and Playwright's official Docker container.",
      "Integrated analytics and marketing pixels (purchase events, attribution, A/B tests) with async loading to protect Core Web Vitals, with Datadog log tracking on the most business-critical ones.",
      "Reworked UTM propagation across landing pages, storefront and checkout for consistent end-to-end attribution.",
      "Owned the customer rewards program, integrating Bubblehouse (points, tiers, redemption) directly into the storefront.",
      "Migrated customer accounts from the legacy platform with zero downtime, preserving order history and login continuity.",
    ],
    stack: ["React Router 7", "TypeScript", "Shopify Hydrogen", "Vite", "Datadog", "Playwright", "GitHub Actions"],
  },
  {
    start: "2025-03",
    end: "2025-09",
    period: "Mar 2025 — Sep 2025",
    company: "Newtoo · Doctolux",
    role: "Software Engineer",
    place: "Luxembourg · remote",
    story: [
      "Medical clinics in Luxembourg needed one place to manage patients and appointments, in Portuguese, French and English.",
      "I was brought in to build it end to end, working between Brazil and Luxembourg.",
      "I built the platform, a rules engine clinic staff could adjust on their own, and AI assistants that book appointments in all three languages.",
      "Today AI handles over 70% of booking requests without a human, and staff automation is 40% more efficient.",
    ],
    metric: { value: "70%+", label: "of bookings handled by AI" },
    details: [
      "Contracted through Newtoo for Doctolux, a SaaS platform for medical clinics in Luxembourg, owning the Node.js backend, React frontend, automation engine, analytics and OpenAI integrations end to end.",
      "Designed a rules engine with dynamic workflow triggers configurable by clinical staff, increasing operational automation efficiency by 40%.",
      "Shipped multilingual AI chatbots (PT/FR/EN) that autonomously handle 70%+ of appointment-booking traffic across Brazil and Luxembourg.",
      "Integrated Luxembourg's national health system (CNS) and Stripe payments, meeting healthcare-data and PCI requirements.",
      "Led cross-functional delivery across two countries: requirements, sprint planning and release communication with product and clinical stakeholders.",
    ],
    stack: ["Node.js", "React", "OpenAI", "Stripe", "TypeScript"],
  },
  {
    start: "2023-08",
    end: "2024-08",
    period: "Aug 2023 — Aug 2024",
    company: "SoftExpert",
    role: "Software Engineer",
    place: "Brazil · remote",
    story: [
      "SoftExpert's compliance software is used by companies in Germany, Portugal, France, the US and Brazil.",
      "My job was to build and evolve its Audit and Risk modules, inside a large team spread across the world.",
      "I built the workflows and the screens people use every day, and coordinated each release with colleagues in four time zones.",
      "Enterprise clients in five countries now rely on those modules to keep their operations compliant.",
    ],
    metric: { value: "5", label: "countries using what I built" },
    details: [
      "Worked on the Audit and Business Risk Management (BRM) modules of a multinational SaaS platform used by enterprise clients in Germany, Portugal, France, the U.S. and Brazil.",
      "Built audit workflows for risk levels, quality indicators, processes and projects, helping clients track compliance across their operations.",
      "Built React interfaces for the Audit module, reusing the shared component library and contributing new components when audit use cases required them.",
      "Developed backend features daily in PHP and Java on internal frameworks similar to Laravel and Spring Boot.",
      "Aligned releases with distributed engineering, QA and product teams across four time zones.",
    ],
    stack: ["React", "PHP", "Java", "SQL"],
  },
  {
    start: "2022-08",
    end: "2023-08",
    period: "Aug 2022 — Aug 2023",
    company: "Why Digital",
    role: "Software Engineer",
    place: "Brazil",
    story: [
      "Why Digital, a fintech startup, was launching its own payment product.",
      "It needed a gateway that met strict card-security rules and simply could not go down.",
      "I designed it so card numbers are swapped for secure tokens and encrypted end to end, and built a live dashboard for merchants.",
      "It now processes over 500,000 payments a year at 99.9% uptime, and support tickets dropped by 35%.",
    ],
    metric: { value: "99.9%", label: "uptime on 500K+ payments a year" },
    details: [
      "Built TimePay, the company's payment gateway product.",
      "Designed and deployed a PCI-DSS-compliant payment gateway processing 500K+ transactions per year with 99.9% uptime.",
      "Built secure AWS-based microservices with tokenization and end-to-end encryption for cardholder data.",
      "Created a real-time React monitoring dashboard for merchants, reducing customer-support tickets by 35%.",
      "Strengthened observability and incident response as part of the on-call rotation.",
      "Finalist at Bradesco's Inovabra Hackathon.",
    ],
    stack: ["Laravel", "PHP", "React", "AWS", "Docker"],
  },
  {
    start: "2021-09",
    end: "2022-05",
    period: "Sep 2021 — May 2022",
    company: "Univates",
    role: "Junior Software Engineer",
    place: "Brazil",
    details: [
      "Built new features and reworked existing processes in the university's internal systems, from client meetings to delivery.",
      "Worked in an agile team with Git, applying SOLID principles and object-oriented design.",
    ],
    stack: ["PHP", "Adianti", "PostgreSQL", "JavaScript", "Git"],
  },
  {
    start: "2020-01",
    end: null,
    period: "Jan 2020 — now",
    company: "Workana",
    role: "Freelance Software Engineer",
    place: "Global clients · remote",
    story: [
      "Since 2020, businesses around the world have hired me to build their software remotely.",
      "Each project is mine from the first call to launch: scope, estimates, building and keeping the client in the loop.",
      "I've built web apps and backends end to end, and made slow systems up to three times faster.",
      "More than 30 projects for 15+ clients, every one delivered on time, and a place in the top 1% of the platform.",
    ],
    metric: { value: "Top 1%", label: "of freelancers on the platform" },
    details: [
      "Full-stack and backend engineer for startups and established businesses worldwide, owning projects from architecture to deployment.",
      "Delivered 30+ projects to 15+ international clients with a 100% on-time delivery record.",
      "Ranked in the top 1% of Workana freelancers, with consistent 5-star reviews for code quality and communication.",
      "Improved API throughput up to 3× on logistics platforms through async processing, caching and query optimization.",
      "Owned scope, estimation and stakeholder communication across multiple time zones.",
    ],
    stack: ["Node.js", "React", "TypeScript", "PHP", "Python"],
    current: true,
  },
];

// Verbatim from LinkedIn recommendations (both public on the profile).
export type Testimonial = {
  quote: string;
  highlight: string;
  name: string;
  title: string;
  relation: string;
};

export const testimonials: Testimonial[] = [
  {
    highlight: "Leo is reliable, easy to communicate with, and brings a positive mindset to the work environment.",
    quote:
      "During our time together at NativePath, Leonardo served as a Software Developer on our team. He demonstrated a strong commitment to team goals, was always open to receiving feedback, and maintained a collaborative approach to everyday tasks.",
    name: "Lucas Tanaka",
    title: "Full Stack Engineer",
    relation: "Teammate at NativePath",
  },
  {
    highlight: "He demonstrated professionalism, technical expertise, and a strong commitment to deadlines and quality.",
    quote:
      "In addition to his skills in web development, he also stood out for his clear communication and willingness to make adjustments whenever necessary. I would definitely recommend him for any project requiring technical precision, creativity, and efficiency.",
    name: "Sangar Zucchi",
    title: "IT Consultant",
    relation: "Client via Workana",
  },
];

export const recommendationsUrl = `${profile.links.linkedin}/details/recommendations/`;
