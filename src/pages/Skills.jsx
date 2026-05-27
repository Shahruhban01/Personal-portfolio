import {
  Code2,
  Server,
  Database,
  MessageSquare,
  Brain,
  Cloud,
  Terminal,
  Wrench,
  Users,
  Network,
  ShieldCheck,
} from "lucide-react";

import { ScrollAnimation } from "@/components/ScrollAnimation";

import {
  JavaScriptLogo,
  NodeLogo,
  MongoDBLogo,
  VSCodeLogo,
  GitLogo,
  AWSLogo,
  RenderLogo,
  PostmanLogo,
  BashLogo,
  WindowsLogo,
  UbuntuLogo,
  LinuxLogo,
  ExpressLogo,
  JWTLogo,
} from "@/components/TechLogos";

const skills = [
  {
    category: "Programming Languages",

    icon: <Code2 className="w-6 h-6" />,

    items: [
      { name: "JavaScript", icon: <JavaScriptLogo /> },
      { name: "C", icon: <Code2 className="w-4 h-4" /> },
      { name: "Bash", icon: <BashLogo /> },
    ],
  },

  {
    category: "Backend Development",

    icon: <Server className="w-6 h-6" />,

    items: [
      { name: "Node.js", icon: <NodeLogo /> },
      { name: "Express.js", icon: <ExpressLogo /> },
      { name: "REST APIs", icon: <Network className="w-4 h-4" /> },
      { name: "WebSockets", icon: <MessageSquare className="w-4 h-4" /> },
    ],
  },

  {
    category: "Databases",

    icon: <Database className="w-6 h-6" />,

    items: [
      { name: "MongoDB", icon: <MongoDBLogo /> },
      { name: "MySQL", icon: <Database className="w-4 h-4" /> },
      { name: "Database Design", icon: <Database className="w-4 h-4" /> },
      { name: "Query Optimization", icon: <Wrench className="w-4 h-4" /> },
    ],
  },

  {
    category: "Authentication & Security",

    icon: <ShieldCheck className="w-6 h-6" />,

    items: [
      { name: "JWT", icon: <JWTLogo /> },
      { name: "Authentication", icon: <ShieldCheck className="w-4 h-4" /> },
      { name: "Authorization", icon: <ShieldCheck className="w-4 h-4" /> },
      { name: "Rate Limiting", icon: <Wrench className="w-4 h-4" /> },
    ],
  },

  {
    category: "Cloud & DevOps",

    icon: <Cloud className="w-6 h-6" />,

    items: [
      { name: "AWS", icon: <AWSLogo /> },
      { name: "EC2", icon: <Cloud className="w-4 h-4" /> },
      { name: "Render", icon: <RenderLogo /> },
      { name: "CI/CD", icon: <GitLogo /> },
    ],
  },

  {
    category: "Tools & Platforms",

    icon: <Wrench className="w-6 h-6" />,

    items: [
      { name: "Git", icon: <GitLogo /> },
      { name: "GitHub", icon: <GitLogo /> },
      { name: "Postman", icon: <PostmanLogo /> },
      { name: "VS Code", icon: <VSCodeLogo /> },
    ],
  },

  {
    category: "Operating Systems",

    icon: <Terminal className="w-6 h-6" />,

    items: [
      {
        name: "Windows",
        icon: <WindowsLogo className="w-4 h-4" />,
      },

      {
        name: "Ubuntu",
        icon: <UbuntuLogo className="w-4 h-4" />,
      },

      {
        name: "Linux",
        icon: <LinuxLogo className="w-4 h-4" />,
      },
    ],
  },

  {
  category: "Mobile Development",

  icon: <Code2 className="w-6 h-6" />,

  items: [
    { name: "Flutter", icon: <Code2 className="w-4 h-4" /> },
    { name: "Firebase", icon: <Cloud className="w-4 h-4" /> },
  ],
},

  {
    category: "Engineering Skills",

    icon: <Brain className="w-6 h-6" />,

    items: [
      {
        name: "System Design",
        icon: <Server className="w-4 h-4" />,
      },

      {
        name: "Scalable Systems",
        icon: <Network className="w-4 h-4" />,
      },

      {
        name: "Debugging",
        icon: <Wrench className="w-4 h-4" />,
      },

      {
        name: "Team Collaboration",
        icon: <Users className="w-4 h-4" />,
      },
    ],
  },
];

const Skills = () => {
  return (
    <div className="min-h-screen pt-20 px-4 max-w-6xl mx-auto pb-20">
      <ScrollAnimation>
        <h2 className="text-4xl font-bold mb-4 gradient-text">
          Technical Skills
        </h2>
      </ScrollAnimation>

      <ScrollAnimation>
        <p className="text-gray-400 mb-12 max-w-2xl">
          Technologies, tools, and backend engineering concepts
          I work with to build scalable and production-ready
          systems.
        </p>
      </ScrollAnimation>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {skills.map((skillGroup) => (
          <ScrollAnimation key={skillGroup.category}>
            <div className="bg-gray-800/50 p-6 rounded-lg backdrop-blur-sm hover:bg-gray-800/70 transition-all border border-white/5">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-white/10 rounded-lg">
                  {skillGroup.icon}
                </div>

                <h3 className="text-lg font-semibold">
                  {skillGroup.category}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {skillGroup.items.map((skill) => (
                  <div
                    key={skill.name}
                    className="bg-gray-700/50 px-4 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-white/10 transition-all group"
                  >
                    <div className="text-gray-400 group-hover:text-white transition-colors">
                      {skill.icon}
                    </div>

                    <span className="text-gray-400 group-hover:text-white transition-colors text-sm">
                      {skill.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollAnimation>
        ))}
      </div>
    </div>
  );
};

export default Skills;