import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import Background3D from "./components/Background3D";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Loading from "./components/Loading";

const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Education = lazy(() => import("./pages/Education"));
const Experience = lazy(() => import("./pages/Experience"));
const Skills = lazy(() => import("./pages/Skills"));
const Projects = lazy(() => import("./pages/Projects"));
const Certificates = lazy(() => import("./pages/Certificates"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));

/* Per-page SEO metadata */
const pageMeta = {
  "/": {
    title:
      "Ruhban Abdullah | Backend Engineer | Node.js & Scalable Systems",

    description:
      "Ruhban Abdullah is a Backend Engineer specializing in scalable backend systems, REST APIs, real-time architectures, AWS infrastructure, Node.js, Express.js, MySQL, and MongoDB.",
  },

  "/about": {
    title: "About | Ruhban Abdullah | Backend Engineer",

    description:
      "Learn about Ruhban Abdullah, a Backend Engineer focused on scalable backend systems, cloud infrastructure, REST APIs, and real-time architectures using Node.js and AWS.",
  },

  "/projects": {
    title:
      "Projects | Ruhban Abdullah | Backend Engineering Portfolio",

    description:
      "Explore backend projects built by Ruhban Abdullah including scalable APIs, cloud storage systems, real-time applications, and distributed backend architectures.",
  },

  "/skills": {
    title:
      "Skills | Ruhban Abdullah | Node.js, AWS & Backend Systems",

    description:
      "Technical skills of Ruhban Abdullah including Node.js, Express.js, MongoDB, MySQL, AWS, WebSockets, REST APIs, CI/CD, and scalable backend engineering.",
  },

  "/experience": {
    title:
      "Experience | Ruhban Abdullah | Backend Engineer",

    description:
      "Professional backend engineering experience of Ruhban Abdullah building scalable APIs, cloud infrastructure, and high-performance backend systems.",
  },

  "/education": {
    title:
      "Education | Ruhban Abdullah | Bachelor of Computer Applications",

    description:
      "Educational background of Ruhban Abdullah including Bachelor of Computer Applications and expertise in backend engineering technologies.",
  },

  "/certificates": {
    title:
      "Certificates | Ruhban Abdullah | Backend & Cloud Technologies",

    description:
      "Professional certifications and technical achievements of Ruhban Abdullah in backend engineering, cloud infrastructure, and software development.",
  },

  "/contact": {
    title:
      "Contact | Ruhban Abdullah | Backend Engineer",

    description:
      "Get in touch with Ruhban Abdullah for backend engineering roles, freelance backend projects, scalable API development, or cloud infrastructure work.",
  },
};

/* Hook to update SEO metadata on route change */
function SEOUpdater() {
  const location = useLocation();

  useEffect(() => {
    const meta = pageMeta[location.pathname] || {
      title:
        "Ruhban Abdullah | Backend Engineer",

      description:
        "Portfolio of Ruhban Abdullah, a Backend Engineer specializing in scalable backend systems, APIs, cloud infrastructure, and real-time architectures.",
    };

    document.title = meta.title;

    const descTag = document.querySelector(
      'meta[name="description"]',
    );

    if (descTag) {
      descTag.setAttribute("content", meta.description);
    }

    const ogTitle = document.querySelector(
      'meta[property="og:title"]',
    );

    if (ogTitle) {
      ogTitle.setAttribute("content", meta.title);
    }

    const ogDesc = document.querySelector(
      'meta[property="og:description"]',
    );

    if (ogDesc) {
      ogDesc.setAttribute("content", meta.description);
    }

    const twitterTitle = document.querySelector(
      'meta[name="twitter:title"]',
    );

    if (twitterTitle) {
      twitterTitle.setAttribute("content", meta.title);
    }

    const twitterDesc = document.querySelector(
      'meta[name="twitter:description"]',
    );

    if (twitterDesc) {
      twitterDesc.setAttribute("content", meta.description);
    }

    const ogUrl = document.querySelector(
      'meta[property="og:url"]',
    );

    if (ogUrl) {
      ogUrl.setAttribute(
        "content",
        `https://developerruhban.online${location.pathname}`,
      );
    }

    const twitterUrl = document.querySelector(
      'meta[name="twitter:url"]',
    );

    if (twitterUrl) {
      twitterUrl.setAttribute(
        "content",
        `https://developerruhban.online${location.pathname}`,
      );
    }

    const canonical = document.querySelector(
      'link[rel="canonical"]',
    );

    if (canonical) {
      canonical.setAttribute(
        "href",
        `https://developerruhban.online${location.pathname}`,
      );
    }
  }, [location]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <SEOUpdater />

      <div className="min-h-screen flex flex-col">
        <Background3D />

        <Navbar />

        <main className="flex-grow">
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/education" element={<Education />} />
              <Route path="/experience" element={<Experience />} />
              <Route path="/skills" element={<Skills />} />
              <Route path="/projects" element={<Projects />} />
              <Route
                path="/certificates"
                element={<Certificates />}
              />
              <Route path="/contact" element={<Contact />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;