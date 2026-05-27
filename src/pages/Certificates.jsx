import { motion } from "framer-motion";

import {
  Award,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Cloud,
  Server,
  Code2,
  Container,
} from "lucide-react";

import { ScrollAnimation } from "@/components/ScrollAnimation";

// import typescriptPdf from "@/assets/files/certificates_pdf/TypeScript.pdf";
// import awsEcsPdf from "@/assets/files/certificates_pdf/aws_ecs.pdf";
// import javascriptPdf from "@/assets/files/certificates_pdf/javascript.pdf";
// import dockerPdf from "@/assets/files/certificates_pdf/docker_fundamentals.pdf";
// import pythonPdf from "@/assets/files/certificates_pdf/python.pdf";
// import cybersecurityPdf from "@/assets/files/certificates_pdf/cybersecurity_virtual_program.pdf";

const certificates = [
  {
    title: "AWS ECS Deployment and Management",

    issuer: "KodeKloud",

    date: "20 March 2025",

    icon: <Cloud className="w-6 h-6" />,

    // link: awsEcsPdf,

    description:
      "Focused on deploying and managing scalable containerized applications using AWS ECS, load balancing, auto-scaling, cluster orchestration, and CI/CD deployment workflows.",

    skills: [
      "AWS ECS",
      "Cloud Computing",
      "DevOps",
      "CI/CD",
      "Containers",
    ],
  },

  {
    title: "Docker Fundamentals",

    issuer: "KodeKloud",

    date: "18 February 2025",

    icon: <Container className="w-6 h-6" />,

    // link: dockerPdf,

    description:
      "Learned containerization concepts, Docker networking, image management, security practices, and deployment workflows for scalable backend applications.",

    skills: [
      "Docker",
      "Containerization",
      "CI/CD",
      "DevOps",
    ],
  },

  {
    title: "TypeScript Programming",

    issuer: "Geekster",

    date: "22 April 2025",

    icon: <Code2 className="w-6 h-6" />,

    // link: typescriptPdf,

    description:
      "Covered TypeScript fundamentals including static typing, interfaces, asynchronous programming, scalable application structure, and backend/frontend integration concepts.",

    skills: [
      "TypeScript",
      "JavaScript",
      "Backend Development",
      "Scalable Applications",
    ],
  },

  {
    title: "JavaScript Programming",

    issuer: "HackerRank",

    date: "18 February 2025",

    icon: <Server className="w-6 h-6" />,

    // link: javascriptPdf,

    description:
      "Validated core JavaScript concepts including ES6 features, asynchronous programming, functional concepts, and problem-solving techniques.",

    skills: [
      "JavaScript",
      "ES6",
      "Async Programming",
      "Problem Solving",
    ],
  },

  {
    title: "Python Programming",

    issuer: "HackerRank",

    date: "10 October 2023",

    icon: <Code2 className="w-6 h-6" />,

    // link: pythonPdf,

    description:
      "Validated Python fundamentals including functions, loops, data structures, scripting logic, and problem-solving basics.",

    skills: [
      "Python",
      "Functions",
      "Data Structures",
      "Programming Logic",
    ],
  },

  {
    title: "Cybersecurity Virtual Program",

    issuer: "Forage",

    date: "10 July 2023",

    icon: <ShieldCheck className="w-6 h-6" />,

    // link: cybersecurityPdf,

    description:
      "Focused on cybersecurity concepts including threat analysis, ransomware handling, vulnerability identification, and risk mitigation workflows.",

    skills: [
      "Cybersecurity",
      "Threat Mitigation",
      "Ransomware",
      "Security Awareness",
    ],
  },
];

const Certificates = () => {
  return (
    <div className="min-h-screen pt-20 px-4 max-w-6xl mx-auto pb-20">
      <ScrollAnimation>
        <motion.div
          className="flex items-center gap-3 mb-12"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Award className="w-8 h-8" />

          <h2 className="text-4xl font-bold gradient-text">
            Certifications
          </h2>
        </motion.div>
      </ScrollAnimation>

      <div className="grid md:grid-cols-2 gap-6">
        {certificates.map((cert, index) => (
          <ScrollAnimation key={cert.title}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: index * 0.1,
              }}
              className="bg-gray-800/50 p-6 rounded-xl backdrop-blur-sm hover:bg-gray-800/70 transition-all group border border-white/5"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/10 rounded-xl">
                    {cert.icon}
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold">
                      {cert.title}
                    </h3>

                    <p className="text-gray-400">
                      {cert.issuer}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-gray-400 text-sm whitespace-nowrap">
                  <Calendar className="w-4 h-4" />

                  <span>{cert.date}</span>
                </div>
              </div>

              <p className="text-gray-300 leading-relaxed mb-5">
                {cert.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-5">
                {cert.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 text-sm bg-white/10 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* <motion.a
                href={cert.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-all"
                whileHover={{ x: 4 }}
              >
                View Certificate

                <ExternalLink className="w-4 h-4" />
              </motion.a> */}
            </motion.div>
          </ScrollAnimation>
        ))}
      </div>
    </div>
  );
};

export default Certificates;