import { motion } from "framer-motion";

import {
  Briefcase,
  MapPin,
  Building2,
  ExternalLink,
  ArrowRight,
} from "lucide-react";

import { ScrollAnimation } from "@/components/ScrollAnimation";

import foodhungImg from "@/assets/experience/foodhung.jpg";
import wsiImg from "@/assets/experience/wsi.jpg";

import foodhungPdf from "@/assets/files/experience_pdf/foodhung.pdf";
import wsiPdf from "@/assets/files/experience_pdf/wsi.pdf";

const experiences = [
  {
    title: "Software Developer",

    company: "World Social Integration",

    location: "Hybrid",

    period: "Jun 2024 - Jul 2025",

    type: "Full Time",

    image: wsiImg,

    certificateUrl: wsiPdf,

    description: [
      "Built backend services using Node.js, PHP (CodeIgniter), and MySQL supporting 15000+ concurrent users",

      "Implemented REST APIs and WebSocket-based communication for real-time interactions",

      "Scaled backend systems to support high-concurrency data flow and real-time application behavior",

      "Managed AWS-based deployments and backend infrastructure for production environments",

      "Improved backend maintainability and system reliability through structured backend architecture",
    ],
  },

  {
    title: "Backend Developer / Engineer",

    company: "FoodHung",

    location: "Remote",

    period: "Aug 2025 - Feb 2026",

    type: "Full Time",

    image: foodhungImg,

    certificateUrl: foodhungPdf,

    description: [
      "Architected and developed RESTful APIs using Node.js and Express.js supporting 10,000+ users and handling 200–400 requests/sec",

      "Optimized MySQL and MongoDB queries using indexing and query tuning, reducing average response time by 25–35%",

      "Improved API performance through pagination, caching strategies, and efficient data access patterns",

      "Deployed and managed backend services on AWS EC2 with monitoring and auto-restart mechanisms maintaining high availability",

      "Integrated CI/CD pipelines reducing deployment time and minimizing manual operational overhead",

      "Diagnosed and resolved production issues to improve backend reliability and system stability",
    ],
  },

  {
    title: "Backend Engineering Intern",

    company: "FoodHung",

    location: "Remote",

    period: "Jan 2025 - Jul 2025",

    type: "Internship",

    image: foodhungImg,

    certificateUrl: foodhungPdf,

    description: [
      "Worked on backend API development using Node.js, Express.js, and MongoDB",

      "Built and optimized internal APIs, improving application responsiveness and backend maintainability",

      "Implemented authentication flows, request validation, and secure backend logic",

      "Collaborated with senior developers on production backend infrastructure and deployment workflows",

      "Contributed to scalable backend architecture and real-time feature implementation",
    ],
  },
];

const Experience = () => {
  return (
    <div className="min-h-screen pt-16 sm:pt-20 px-4 max-w-5xl mx-auto pb-16 sm:pb-20">
      <ScrollAnimation>
        <h2 className="text-3xl sm:text-4xl font-bold mb-8 sm:mb-12 gradient-text flex items-center gap-3">
          <Briefcase className="w-7 h-7 sm:w-8 sm:h-8" />

          Professional Experience
        </h2>
      </ScrollAnimation>

      <div className="space-y-8 sm:space-y-12">
        {experiences.map((exp) => (
          <ScrollAnimation key={exp.title + exp.company}>
            <div className="group relative bg-gray-800/50 rounded-xl sm:rounded-2xl overflow-hidden backdrop-blur-sm hover:bg-gray-800/70 transition-all border border-white/5">
              <div className="grid grid-cols-1 md:grid-cols-[1fr,320px]">
                {/* Left Side */}
                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="p-2 sm:p-3 bg-white/10 rounded-lg sm:rounded-xl group-hover:bg-white/20 transition-colors">
                      <Building2 className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>

                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold mb-1">
                        {exp.title}
                      </h3>

                      <p className="text-gray-400 text-base sm:text-lg">
                        {exp.company}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">
                    <MapPin className="w-4 h-4" />

                    <span>{exp.location}</span>

                    <span>•</span>

                    <span>{exp.period}</span>

                    <span>•</span>

                    <span className="px-2 py-1 rounded-full bg-white/10 text-xs sm:text-sm">
                      {exp.type}
                    </span>
                  </div>

                  <ul className="space-y-3 sm:space-y-4">
                    {exp.description.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-gray-300 text-sm sm:text-base"
                      >
                        <ArrowRight className="w-5 h-5 mt-0.5 text-gray-400 flex-shrink-0" />

                        <span className="leading-relaxed">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Mobile Button */}
                  <motion.a
                    href={exp.certificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="md:hidden mt-6 inline-flex items-center gap-2 px-6 py-2.5 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-all duration-300 text-sm font-medium"
                    whileHover={{ scale: 1.02 }}
                  >
                    View Certificate

                    <ExternalLink className="w-4 h-4" />
                  </motion.a>
                </div>

                {/* Right Side Image */}
                <div className="relative hidden md:block">
                  <div className="absolute inset-0 group-hover:scale-105 transition-transform duration-500">
                    <img
                      src={exp.image}
                      alt={exp.company}
                      className="w-full h-full object-cover"
                    />

                    <div className="absolute inset-0 bg-gradient-to-r from-gray-800/90 to-transparent" />
                  </div>

                  <div className="relative h-full flex items-center justify-center">
                    <motion.a
                      href={exp.certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-8 py-3 text-white font-semibold bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl flex items-center gap-2 transition-all duration-300 border border-white/10 hover:border-white/20"
                      whileHover={{
                        y: -5,
                      }}
                    >
                      View Certificate

                      <ExternalLink className="w-4 h-4" />
                    </motion.a>
                  </div>
                </div>
              </div>
            </div>
          </ScrollAnimation>
        ))}
      </div>
    </div>
  );
};

export default Experience;