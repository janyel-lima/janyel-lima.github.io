window.skillLevels = {
  hard: {
    js: { label: 'skill_js', level: 'A', value: 4 },
    ts: { label: 'skill_ts', level: 'A', value: 4 },
    node: { label: 'skill_node', level: 'A', value: 4 },
    react: { label: 'skill_react', level: 'C', value: 2 },
    vue: { label: 'skill_vue', level: 'A', value: 4 },
    docker: { label: 'skill_docker', level: 'A', value: 4 },
    aws: { label: 'skill_aws', level: 'B', value: 3 },
    pg: { label: 'skill_pg', level: 'B', value: 3 },
    tailwind: { label: 'skill_tailwind', level: 'B', value: 3 },
    git: { label: 'skill_git', level: 'A', value: 4 },
    java: { label: 'skill_java', level: 'A', value: 4 },
    php: { label: 'skill_php', level: 'C', value: 2 },
    qgis: { label: 'skill_qgis', level: 'B', value: 3 },
    bpmn: { label: 'skill_bpmn', level: 'B', value: 3 },
    angular: { label: 'skill_angular', level: 'B', value: 3 },
    jsf: { label: 'skill_jsf', level: 'B', value: 3 },
    spring: { label: 'skill_spring', level: 'B', value: 3 },
    express: { label: 'skill_express', level: 'A', value: 4 },
    keycloak: { label: 'skill_keycloak', level: 'B', value: 3 },
    jira: { label: 'skill_jira', level: 'B', value: 3 },
    ia: { label: 'skill_ia', level: 'A', value: 4 },
    linux: { label: 'skill_linux', level: 'A', value: 4 },
  },

  soft: {
    problem_solving: { label: 'soft_problem_solving', level: 'A', value: 4 },
    system_thinking: { label: 'soft_system_thinking', level: 'S', value: 5 },
    communication: { label: 'soft_communication', level: 'B', value: 3 },
    autonomy: { label: 'soft_autonomy', level: 'A', value: 4 },
    leadership: { label: 'soft_leadership', level: 'C', value: 2 },
    adaptability: { label: 'soft_adaptability', level: 'S', value: 5 },
    critical_thinking: { label: 'soft_critical_thinking', level: 'A', value: 4 },
    emotional_intelligence: { label: 'soft_emotional_intelligence', level: 'B', value: 3 },
    teamwork: { label: 'soft_teamwork', level: 'A', value: 4 },
  }
}



const skillIcons = {
  // ───────────────
  // HARD SKILLS (DEVICON)
  // ───────────────
  skill_js:        { type: 'devicon', icon: 'devicon-javascript-plain' },
  skill_ts:        { type: 'devicon', icon: 'devicon-typescript-plain' },
  skill_node:      { type: 'devicon', icon: 'devicon-nodejs-plain' },
  skill_react:     { type: 'devicon', icon: 'devicon-react-original' },
  skill_vue:       { type: 'devicon', icon: 'devicon-vuejs-plain' },
  skill_angular:   { type: 'devicon', icon: 'devicon-angularjs-plain' },
  skill_java:      { type: 'devicon', icon: 'devicon-java-plain' },
  skill_spring:    { type: 'devicon', icon: 'devicon-spring-plain' },
  skill_php:       { type: 'devicon', icon: 'devicon-php-plain' },
  skill_docker:    { type: 'devicon', icon: 'devicon-docker-plain' },
  skill_express:   { type: 'devicon', icon: 'devicon-express-original' },
  skill_aws:       { type: 'devicon', icon: 'devicon-amazonwebservices-plain-wordmark' },
  skill_pg:        { type: 'devicon', icon: 'devicon-postgresql-plain' },
  skill_tailwind:  { type: 'devicon', icon: 'devicon-tailwindcss-plain' },
  skill_git:       { type: 'devicon', icon: 'devicon-git-plain' },
  skill_qgis:      { type: 'devicon', icon: 'devicon-googlecloud-plain' },
  skill_bpmn:      { type: 'devicon', icon: 'devicon-uml-plain' },
  skill_keycloak:  { type: 'devicon', icon: 'devicon-oauth-plain' },
  skill_chartjs:   { type: 'devicon', icon: 'devicon-chartjs-plain' },
  skill_jira:      { type: 'devicon', icon: 'devicon-jira-plain' },
  skill_linux:     { type: 'devicon', icon: 'devicon-linux-plain' },
  skill_ia:        { type: 'devicon', icon: 'devicon-tensorflow-original' },

  // ───────────────
  // SOFT SKILLS (LUCIDE)
  // ───────────────
  soft_problem_solving:        { type: 'lucide', icon: 'lightbulb' },
  soft_system_thinking:        { type: 'lucide', icon: 'brain-circuit' },
  soft_communication:          { type: 'lucide', icon: 'speech' },
  soft_autonomy:               { type: 'lucide', icon: 'rocket' },
  soft_leadership:             { type: 'lucide', icon: 'chess-king' },
  soft_adaptability:           { type: 'lucide', icon: 'puzzle' },
  soft_critical_thinking:      { type: 'lucide', icon: 'brain-cog' },
  soft_emotional_intelligence: { type: 'lucide', icon: 'heart-handshake' },
  soft_teamwork:               { type: 'lucide', icon: 'users' },
}


const DEFAULT_ICON = "devicon-devicon-plain"




const devStats = {
    name: "Janyel B. Lima",
    startedCareer: "2021-01-04", 
    specialization: {
        "en": "Fullstack Developer",
        "pt-br": "Desenvolvedor Fullstack"
    },
    social_links:{
        github: "https://github.com/janyel-lima",
        linkedin: "https://www.linkedin.com/in/janyel-lima/",
        email: "mailto:janyel.lima2809@outlook.com",
        whatsapp: "https://wa.me/5582999712833"

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
            skills: [
  { key: "powerbi" },
  { key: "excel" },
  { key: "bpmn" },
  { key: "java" },
  { key: "spring" },
  { key: "pg" },
  { key: "jsf" },
  { key: "php" },
  { key: "qgis" }
]

        },
        {
            company: "Mineração Vale Verde ",
            role: { "en": "IT Assistant", "pt-br": "Assistente de TI" },
            period: { "en": "2021 - 2021", "pt-br": "2021 - 2021" },
            description: { 
                "en": "During the operational training cycle, I executed administrative support routines, management and organization of critical files, and the construction of tactical data dashboards using Microsoft Power BI.", 
                "pt-br": "Durante o período de treinamento operacional, executei rotinas administrativas de suporte, gerenciamento e organização de arquivos críticos, além da construção de painéis táticos de dados utilizando Microsoft Power BI." 
            },
            skills: [
  { key: "java" },
  { key: "jsf" },
  { key: "spring" },
  { key: "pg" },
  { key: "docker" },
  { key: "aws" },
  { key: "js" },
  { key: "php" }
]
,
        },
        {
            company: "Mineração Vale Verde",
            role: { "en": "Apprentice", "pt-br": "Jovem Aprendiz" },
            period: { "en": "2019 - 2021", "pt-br": "2019 - 2021" },
            description: { 
                "en": "During the operational training cycle, I executed administrative support routines, management and organization of critical files, and the construction of tactical data dashboards using Microsoft Power BI.", 
                "pt-br": "Durante o período de treinamento operacional, executei rotinas administrativas de suporte, gerenciamento e organização de arquivos críticos, além da construção de painéis táticos de dados utilizando Microsoft Power BI." 
            },
            skills: [
  { key: "java" },
  { key: "jsf" },
  { key: "spring" },
  { key: "pg" },
  { key: "docker" },
  { key: "aws" },
  { key: "js" },
  { key: "php" }
]
,
        }
    ]
};

const myData = {
    projects: [
        {
            title: "SIGMIN - Sistema Integrado de Gestão de Mineração",
            stack: [
  { key: "java" },
  { key: "jsf" },
  { key: "spring" },
  { key: "pg" },
  { key: "docker" },
  { key: "aws" },
  { key: "js" },
  { key: "php" }
]
,
            type: { "en": "Integrated Management System", "pt-br": "Sistema Integrado de Gestão" },
            about: { 
                "en": "Integrated management system for mining operations, designed to unify multidisciplinary data collection through a tailored multimodular architecture, ensuring operational transparency, rapid adaptability to internal client requirements, system scalability, and critical real-time decision support.", 
                "pt-br": "Sistema integrado de gestão para operações de mineração, projetado para unificar a coleta de dados multidisciplinares por meio de uma arquitetura multimodular sob medida, garantindo transparência operacional, adaptação rápida às demandas do cliente interno, escalabilidade do sistema e suporte crítico à tomada de decisão em tempo real." 
            },
            images: ["img/sig-team.jpg"],
            team: [
                { 
                    name: "Deyvson Santos",  
                    linkedin: "https://br.linkedin.com/in/deyvson-santos-33b82723", 
                    avatar_url: "https://media.licdn.com/dms/image/v2/D4D03AQFjaRG43GiFcQ/profile-displayphoto-shrink_200_200/B4DZV7UeI3HYAY-/0/1741530720352?e=2147483647&v=beta&t=hNMWarps5ptia8bL7oAPU0fXJDC2NSilXPTRxQwluU0", 
                    role: { "en": "Process and Systems Supervisor", "pt-br": "Supervisor de Processos e Sistemas" } 
                },
                 { 
                    name: "Eric Lima",  
                    github: "https://github.com/ericcruzlima/", 
                    portfolio: "https://ericcruzlima.github.io/",
                    avatar_url: "https://raw.githubusercontent.com/ericcruzlima/ericcruzlima.github.io/refs/heads/main/photo_transparent.png", 
                    role: { "en": "Process and Systems Analyst", "pt-br": "Analista de Processos e Sistemas Pleno" } 
                },
                  { 
                    name: "Bruno Henrique",  
                    github: "https://github.com/bruhensant/", 
                    portfolio: "https://bruhensant.one/",
                    linkedin: "https://www.linkedin.com/in/bruno-henrique-santos-2b9675234/",
                    avatar_url: "https://avatars.githubusercontent.com/u/25781117?v=4", 
                    role: { "en": "IT Trainee", "pt-br": "Estagiário de TI" } 
                }
            ]
        },
        {
            title: "Planeja Mais - MVP",
             stack: [
  { key: "java" },
  { key: "jsf" },
  { key: "spring" },
  { key: "pg" },
  { key: "docker" },
  { key: "js" },
]
,
            type: { "en": "Project Management Platform", "pt-br": "Plataforma de Gestão de Projetos" },
            about: { 
                "en": "Minimum Operational Platform for project management in the public sector, engineered to encode and enforce the client’s strategic management doctrine. A functional command-and-control core, deployed as a proving ground for the future expansion into a full-scale, enterprise SaaS platform.", 
                "pt-br": "Plataforma mínima operacional de gestão de projetos para o setor público, projetada para codificar e executar a doutrina estratégica do cliente. Um núcleo funcional de comando e controle, desenvolvido como campo de prova para a expansão futura em uma plataforma SaaS completa e escalável. " 
            },
            images: ["images/aegis-app.jpg"],
            team: [
                { 
                    name: "Lázaro Gustavo Sombra", 
                    github: "https://github.com/gustavosombra1", 
                    avatar_url: "https://avatars.githubusercontent.com/u/107960686?v=4", 
                    role: { "en": "Trainee Developer", "pt-br": "Desenvolvedor Estagiário" } 
                }
            ]
        },
        {
            title: "Content Management System",
            stack: [
  { key: "vue" },
  { key: "ts" },
  { key: "express" },
  { key: "prisma" },
  { key: "docker" },
  { key: "pg" },
  { key: "keycloak" }
]
,
            type: { "en": "Paid Content Management System", "pt-br": "Sistema de Gerenciamento de Conteúdo Pago" },
            about: { 
                "en": "Proprietary content management and distribution platform with paid access control, automated financial validation, and internal policy enforcement.", 
                "pt-br": "Plataforma proprietária de gestão e distribuição de conteúdo com controle de acesso pago, validação financeira automatizada e aplicação de políticas internas." 
            },
            images: ["images/neural-dash.jpg"],
            team: [
                { 
                    name: "Eric Lima",  
                    github: "https://github.com/ericcruzlima/", 
                    portfolio: "https://ericcruzlima.github.io/",
                    avatar_url: "https://raw.githubusercontent.com/ericcruzlima/ericcruzlima.github.io/refs/heads/main/photo_transparent.png", 
                    role: { "en": "Chief Technology Officer", "pt-br": "Diretor de Tecnologia" } 
                }
            ]
        }
    ]
};






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
