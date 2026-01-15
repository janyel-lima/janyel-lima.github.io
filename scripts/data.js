window.skillLevels = {
  hard: {
    js: { label: 'skill_js', level: 'S', value: 5 },
    ts: { label: 'skill_ts', level: 'A', value: 4 },
    node: { label: 'skill_node', level: 'A', value: 4 },
    react: { label: 'skill_react', level: 'A', value: 4 },
    vue: { label: 'skill_vue', level: 'B', value: 3 },
    docker: { label: 'skill_docker', level: 'A', value: 4 },
    aws: { label: 'skill_aws', level: 'B', value: 3 },
    pg: { label: 'skill_pg', level: 'A', value: 4 },
    tailwind: { label: 'skill_tailwind', level: 'S', value: 5 },
    git: { label: 'skill_git', level: 'A', value: 4 },
  },

  soft: {
    problem_solving: { label: 'soft_problem_solving', level: 'S', value: 5 },
    system_thinking: { label: 'soft_system_thinking', level: 'S', value: 5 },
    communication: { label: 'soft_communication', level: 'B', value: 3 },
    autonomy: { label: 'soft_autonomy', level: 'A', value: 4 },
    leadership: { label: 'soft_leadership', level: 'B', value: 3 },
    adaptability: { label: 'soft_adaptability', level: 'A', value: 4 },
    critical_thinking: { label: 'soft_critical_thinking', level: 'A', value: 4 },
  }
}


const devStats = {
    name: "Icarus V. Tymaeus",
    startedCareer: "2021-01-04", 
    specialization: {
        "en": "Augmented Fullstack Pilot",
        "pt-br": "Piloto Fullstack Aumentado"
    },
    history: [
        {
            company: "Tech Forge Solutions",
            role: { "en": "Senior Fullstack Dev", "pt-br": "Dev Fullstack Sênior" },
            period: { "en": "2024 - Present", "pt-br": "2024 - Presente" },
            description: { 
                "en": "Leadership of tactical development operations and microservices architecture in high-load environments.", 
                "pt-br": "Liderança de operações táticas de desenvolvimento e arquitetura de microserviços em ambientes de alta carga." 
            },
            skills: ["Node.js", "AWS", "Kubernetes", "Microservices"]
        },
        {
            company: "Cyber Systems Lab",
            role: { "en": "Fullstack Engineer", "pt-br": "Engenheiro Fullstack" },
            period: { "en": "2022 - 2024", "pt-br": "2022 - 2024" },
            description: { 
                "en": "Core systems engineering and performance optimization for critical real-time applications.", 
                "pt-br": "Engenharia de sistemas core e otimização de performance para aplicações críticas em tempo real." 
            },
            skills: ["React", "TypeScript", "PostgreSQL", "Redis"]
        },
        {
            company: "Digital Vanguard",
            role: { "en": "Junior Developer", "pt-br": "Desenvolvedor Júnior" },
            period: { "en": "2021 - 2022", "pt-br": "2021 - 2022" },
            description: { 
                "en": "Initiation in front-end missions and maintenance of high-complexity legacy systems.", 
                "pt-br": "Iniciação em missões de front-end e manutenção de sistemas legados de alta complexidade." 
            },
            skills: ["JavaScript", "CSS3", "Git", "REST APIs"]
        }
    ]
};

const myData = {
    projects: [
        {
            title: "Sistema Grimoire",
            stack: ["Next.js", "Prisma", "Tailwind"],
            type: { "en": "Tactical E-commerce", "pt-br": "E-commerce Tático" },
            about: { 
                "en": "An advanced item marketplace with integrated checkout and real-time inventory system.", 
                "pt-br": "Um marketplace de itens avançados com checkout integrado e sistema de inventário em tempo real." 
            },
            images: ["images/grimoire-thumb.jpg", "images/grimoire-full.jpg"],
            team: [
                { 
                    name: "Edd", 
                    git: "https://github.com", 
                    linkedin: "https://linkedin.com", 
                    avatar_url: "images/team/edd.jpg", 
                    role: { "en": "Lead Dev", "pt-br": "Desenvolvedor Líder" } 
                }
            ]
        },
        {
            title: "Protocolo Aegis",
            stack: ["React Native", "Firebase"],
            type: { "en": "Mobile Security", "pt-br": "Segurança Mobile" },
            about: { 
                "en": "Mobile application for security monitoring and layered biometric authentication.", 
                "pt-br": "Aplicação móvel para monitoramento de segurança e autenticação biométrica em camadas." 
            },
            images: ["images/aegis-app.jpg"],
            team: [
                { 
                    name: "Edd", 
                    git: "https://github.com", 
                    linkedin: "https://linkedin.com", 
                    avatar_url: "images/team/edd.jpg", 
                    role: { "en": "Lead Dev", "pt-br": "Desenvolvedor Líder" } 
                }
            ]
        },
        {
            title: "Neural Network Dashboard",
            stack: ["Vue.js", "D3.js", "Python"],
            type: { "en": "Data Viz", "pt-br": "Visualização de Dados" },
            about: { 
                "en": "Control panel for visualizing neural data flows and AI performance metrics.", 
                "pt-br": "Painel de controle para visualização de fluxos de dados neurais e métricas de performance de IA." 
            },
            images: ["images/neural-dash.jpg"],
            team: [
                { 
                    name: "Edd", 
                    git: "https://github.com", 
                    linkedin: "https://linkedin.com", 
                    avatar_url: "images/team/edd.jpg", 
                    role: { "en": "Lead Dev", "pt-br": "Desenvolvedor Líder" } 
                }
            ]
        }
    ]
};


const skillIcons = {
  "JavaScript": "devicon-javascript-plain",
  "TypeScript": "devicon-typescript-plain",
  "Node.js": "devicon-nodejs-plain",
  "React": "devicon-react-original",
  "Vue.js": "devicon-vuejs-plain",
  "Next.js": "devicon-nextjs-plain",
  "React Native": "devicon-react-original",
  "Python": "devicon-python-plain",
  "AWS": "devicon-amazonwebservices-plain-wordmark",
  "PostgreSQL": "devicon-postgresql-plain",
  "Redis": "devicon-redis-plain",
  "Docker": "devicon-docker-plain",
  "Kubernetes": "devicon-kubernetes-plain",
  "Tailwind": "devicon-tailwindcss-plain",
  "Prisma": "devicon-prisma-original",
  "Firebase": "devicon-firebase-plain",
  "Git": "devicon-git-plain",
  "CSS3": "devicon-css3-plain",
  "D3.js": "devicon-d3js-plain",
  "REST APIs": "devicon-fastapi-plain", // proxy visual aceitável
}

const DEFAULT_ICON = "devicon-devicon-plain";





const educationLogs = {
  higher: [
    {
      title_key: 'edu_cs_title',
      provider_key: 'edu_cs_provider',
      url: 'https://www.universidade-exemplo.com'
    }
  ],

  courses: [
    {
      title_key: 'course_fullstack',
      provider_key: 'provider_rocketseat',
      url: 'https://www.rocketseat.com.br'
    },
    {
      title_key: 'course_docker',
      provider_key: 'provider_bootcamp',
      url: 'https://www.docker.com'
    }
  ]
}
