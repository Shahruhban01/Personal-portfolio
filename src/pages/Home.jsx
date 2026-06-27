import { VercelLogo } from "@/components/TechLogos";
import { motion } from "framer-motion";
import {
  Github,
  Linkedin,
  MessageCircle,
  Copy,
  Check,
  FileDown,
  User,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import useSWR from "swr";

import cvPdf from "@/assets/files/cv_pdf/RuhbanResumeF.pdf";

const fetcher = (url) => fetch(url).then((res) => res.json());
const localcv = false;

const Home = () => {
  const cvlink = "https://drive.google.com/file/d/1G7nWg2vVoF8bwFJ-woYvTk1OGQL6r1G4/view?usp=sharing";

  const [copied, setCopied] = useState(false);

  const email = "shahruhban01@gmail.com";
  const whatsappNumber = "+916006292134";

  const { data: githubData } = useSWR(
    "https://api.github.com/users/shahruhban01",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      shouldRetryOnError: true,
      errorRetryCount: 3,
    },
  );

  function formatRepoCount(count) {
    if (count < 5) return count.toString();
    return `${Math.floor(count / 5) * 5}+`;
  }

  const githubRepos = githubData?.public_repos || 0;
  const displayRepos = formatRepoCount(githubRepos);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);

      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleEmailClick = (e) => {
    if (window.innerWidth <= 640) {
      window.location.href = `mailto:${email}`;
      e.preventDefault();
    } else {
      copyToClipboard();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 mt-7 sm:mt-0 md:mt-3 lg:mt-5">
      <div className="text-center relative z-10 max-w-4xl mx-auto">
        <motion.h1
          className="text-4xl sm:text-6xl md:text-8xl font-bold mb-4 sm:mb-6 tracking-tighter"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Ruhban Abdullah
        </motion.h1>

        <motion.h2
          className="text-2xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 tracking-tighter text-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Architecting Backend Systems
        </motion.h2>

        <motion.p
          className="text-lg sm:text-xl md:text-2xl text-gray-400 mb-4 sm:mb-5 max-w-3xl mx-auto px-2 sm:px-4 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Backend Engineer specializing in scalable backend systems,
          REST APIs, real-time architectures, and cloud infrastructure
          using Node.js, Express.js, MySQL, MongoDB, AWS, and modern
          backend technologies.
        </motion.p>

        <motion.div
          className="flex flex-col items-center gap-4 sm:gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="flex justify-center space-x-3 sm:space-x-4">
            <a
              href={localcv ? cvPdf : cvlink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-black rounded-full text-sm sm:text-base font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <FileDown
                className="w-4 h-4 sm:w-5 sm:h-5"
                aria-hidden="true"
              />
              Download CV
            </a>

            <Link
              to="/about"
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-white/10 text-white rounded-full text-sm sm:text-base font-medium hover:bg-white/20 transition-colors flex items-center gap-2"
            >
              <User
                className="w-4 h-4 sm:w-5 sm:h-5"
                aria-hidden="true"
              />
              About Me
            </Link>
          </div>

          <button
            onClick={handleEmailClick}
            className="group relative flex items-center gap-2 py-2 pl-8 pr-4 transition-all cursor-copy sm:cursor-pointer"
            aria-label={`Email: ${email}`}
          >
            <div className="absolute left-0 flex items-center">
              <div className="w-3 text-gray-500 group-hover:text-white transition-colors">
                <VercelLogo />
              </div>

              <span className="text-lg font-mono text-gray-400 ml-3 group-hover:text-white transition-colors">
                ~
              </span>
            </div>

            <span className="text-gray-400 group-hover:text-white transition-colors ml-4 sm:text-base">
              {email}
            </span>

            <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 hidden sm:block">
              {copied ? (
                <Check
                  className="w-4 h-4 text-green-500"
                  aria-hidden="true"
                />
              ) : (
                <Copy
                  className="w-4 h-4 text-gray-400 hover:text-white transition-colors"
                  aria-hidden="true"
                />
              )}
            </div>
          </button>
        </motion.div>

        <motion.div
          className="grid grid-cols-3 justify-items-center gap-6 mt-8 sm:mt-12 max-w-xs sm:max-w-none mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <motion.a
            href="https://github.com/shahruhban01"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center group w-full"
            whileHover={{ y: -2 }}
            aria-label="Visit GitHub profile"
          >
            <div className="p-3 rounded-xl transition-colors mb-2 w-full max-w-[200px]">
              <Github className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-white transition-colors mx-auto" />
            </div>

            <motion.div
              className="flex flex-col items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <span className="text-base sm:text-lg font-semibold">
                {displayRepos}
              </span>

              <span className="text-xs sm:text-sm text-gray-400">
                GitHub Projects
              </span>
            </motion.div>
          </motion.a>

          <motion.a
            href="https://linkedin.com/in/shahruhban"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center group w-full"
            whileHover={{ y: -2 }}
            aria-label="Visit LinkedIn profile"
          >
            <div className="p-3 rounded-xl transition-colors mb-2 w-full max-w-[200px]">
              <Linkedin className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-white transition-colors mx-auto" />
            </div>

            <motion.div
              className="flex flex-col items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <span className="text-base sm:text-lg font-semibold">
                1000+
              </span>

              <span className="text-xs sm:text-sm text-gray-400">
                LinkedIn Followers
              </span>
            </motion.div>
          </motion.a>

          <motion.a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center group w-full"
            whileHover={{ y: -2 }}
            aria-label="Contact via WhatsApp"
          >
            <div className="p-3 rounded-xl transition-colors mb-2 w-full max-w-[200px]">
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-white transition-colors mx-auto" />
            </div>

            <motion.div
              className="flex flex-col items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <span className="text-base sm:text-lg font-semibold">
                24x7
              </span>

              <span className="text-xs sm:text-sm text-gray-400">
                WhatsApp Me
              </span>
            </motion.div>
          </motion.a>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;