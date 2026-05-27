import { Github, ExternalLink } from "lucide-react";
import { ScrollAnimation } from "@/components/ScrollAnimation";
import project1 from "@/assets/projects_img/project-1.png";
import project2 from "@/assets/projects_img/project-2.png";
import project3 from "@/assets/projects_img/project-3.png";
import project4 from "@/assets/projects_img/project-4.png";

const projects = [
  {
    title: "WOW'S | Real-Time Live Streaming Platform",

    description:
      "Scalable real-time social entertainment platform built with Flutter and a custom AWS-powered backend infrastructure. Engineered live broadcasting, virtual gifting, real-time comments, audio streaming, VIP systems, coin economy, and Firebase-to-custom-backend migration architecture for high concurrency and operational scalability.",

    image: project4,

    github: "",

    live: "",

    tags: [
      "Flutter",
      "PHP",
      "MySQL",
      "AWS S3",
      "REST APIs",
      "Agora RTC",
      "Firebase Migration",
      "GetX",
      "SVGA",
      "Lottie",
      "Real-Time Systems",
      "WebSockets",
    ],
  },

  {
    title: "piCloud | Cloud Storage & File Management System",

    description:
      "Distributed cloud storage and secure file management platform focused on scalable uploads, access control, media handling, storage optimization, and real-time file operations. Engineered backend APIs, cloud infrastructure integration, authentication workflows, and scalable file orchestration systems.",

    image: project3,

    github: "",

    live: "",

    tags: [
      "Node.js",
      "Express.js",
      "MongoDB",
      "AWS",
      "Cloud Storage",
      "REST APIs",
      "Authentication",
      "File Management",
      "Scalable Systems",
    ],
  },

  {
    title: "Private Queue & Operations Management Platform",

    description:
      "Advanced real-time queue orchestration and operations management system designed for service-based businesses. Engineered deterministic queue behavior, dynamic wait-time calculations, concurrency-safe scheduling, RBAC infrastructure, operational safeguards, offline recovery handling, and adaptive real-time workflow synchronization.",

    image: project2,

    github: "",

    live: "",

    tags: [
      "Node.js",
      "Express.js",
      "MongoDB",
      "MySQL",
      "WebSockets",
      "Queue Engine",
      "RBAC",
      "System Design",
      "Real-Time Architecture",
      "Scalable Backend",
    ],
  },
  {
  title: "Many More Projects on GitHub",

  description:
    "I have worked on many additional backend systems, automation tools, APIs, real-time applications, experimental architectures, and utility projects. You can explore all repositories, contributions, and ongoing work directly on my GitHub profile.",

  image: project1,

  github: "https://github.com/shahruhban01",

  live: "https://github.com/shahruhban01",

  tags: [
    "Open Source",
    "Backend Systems",
    "APIs",
    "Automation",
    "Real-Time Apps",
    "Cloud Projects",
  ],
},

];

const Projects = () => {
  return (
    <div className="min-h-screen pt-20 px-4 max-w-6xl mx-auto pb-20">
      <ScrollAnimation>
        <h2 className="text-4xl font-bold mb-12 gradient-text">
          Featured Projects
        </h2>
      </ScrollAnimation>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((project) => (
          <ScrollAnimation key={project.title}>
            <div className="bg-gray-800/50 rounded-lg overflow-hidden backdrop-blur-sm h-full flex flex-col">
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
                <p className="text-gray-400 mb-4 flex-grow">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-sm bg-purple-500/20 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex space-x-4">
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors"
                  >
                    <Github className="w-4 h-4" />
                    <span>Code</span>
                  </a>
                  <a
                    href={project.live}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Live</span>
                  </a>
                </div>
              </div>
            </div>
          </ScrollAnimation>
        ))}
      </div>
    </div>
  );
};

export default Projects;
