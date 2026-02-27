// ============================================================
// SKILL LEVELS
// Cada entrada: { label: chave do i18n, level: rank, value: 1-5 }
// ============================================================
window.skillLevels = {

  // ── Hard Skills ────────────────────────────────────────────
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

  // ── Soft Skills ────────────────────────────────────────────
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
  },

};


// ============================================================
// SKILL ICONS
// type 'devicon' → classe CSS do Devicon
// type 'lucide'  → nome do ícone Lucide
// ============================================================
const skillIcons = {

  // ── Hard Skills (Devicon) ──────────────────────────────────
  skill_js: { type: 'devicon', icon: 'devicon-javascript-plain' },
  skill_ts: { type: 'devicon', icon: 'devicon-typescript-plain' },
  skill_node: { type: 'devicon', icon: 'devicon-nodejs-plain' },
  skill_react: { type: 'devicon', icon: 'devicon-react-original' },
  skill_vue: { type: 'devicon', icon: 'devicon-vuejs-plain' },
  skill_angular: { type: 'devicon', icon: 'devicon-angularjs-plain' },
  skill_java: { type: 'devicon', icon: 'devicon-java-plain' },
  skill_spring: { type: 'devicon', icon: 'devicon-spring-plain' },
  skill_php: { type: 'devicon', icon: 'devicon-php-plain' },
  skill_docker: { type: 'devicon', icon: 'devicon-docker-plain' },
  skill_express: { type: 'devicon', icon: 'devicon-express-original' },
  skill_aws: { type: 'devicon', icon: 'devicon-amazonwebservices-plain-wordmark' },
  skill_pg: { type: 'devicon', icon: 'devicon-postgresql-plain' },
  skill_tailwind: { type: 'devicon', icon: 'devicon-tailwindcss-plain' },
  skill_git: { type: 'devicon', icon: 'devicon-git-plain' },
  skill_qgis: { type: 'devicon', icon: 'devicon-googlecloud-plain' },
  skill_bpmn: { type: 'devicon', icon: 'devicon-uml-plain' },
  skill_keycloak: { type: 'devicon', icon: 'devicon-oauth-plain' },
  skill_chartjs: { type: 'devicon', icon: 'devicon-chartjs-plain' },
  skill_jira: { type: 'devicon', icon: 'devicon-jira-plain' },
  skill_linux: { type: 'devicon', icon: 'devicon-linux-plain' },
  skill_ia: { type: 'devicon', icon: 'devicon-tensorflow-original' },

  // ── Soft Skills (Lucide) ───────────────────────────────────
  soft_problem_solving: { type: 'lucide', icon: 'lightbulb' },
  soft_system_thinking: { type: 'lucide', icon: 'brain-circuit' },
  soft_communication: { type: 'lucide', icon: 'speech' },
  soft_autonomy: { type: 'lucide', icon: 'rocket' },
  soft_leadership: { type: 'lucide', icon: 'chess-king' },
  soft_adaptability: { type: 'lucide', icon: 'puzzle' },
  soft_critical_thinking: { type: 'lucide', icon: 'brain-cog' },
  soft_emotional_intelligence: { type: 'lucide', icon: 'heart-handshake' },
  soft_teamwork: { type: 'lucide', icon: 'users' },

};

// Ícone fallback quando a skill não tem mapeamento
const DEFAULT_ICON = 'devicon-devicon-plain';


// ============================================================
// DEV STATS
// Dados pessoais, redes sociais e histórico profissional
// ============================================================
const devStats = {

  name: 'Janyel B. Lima',
  startedCareer: '2021-01-04',

  specialization: {
    'en': 'Fullstack Developer',
    'pt-br': 'Desenvolvedor Fullstack',
  },

  // ── Redes Sociais ──────────────────────────────────────────
  social_links: {
    github: 'https://github.com/janyel-lima',
    linkedin: 'https://www.linkedin.com/in/janyel-lima/',
    email: 'mailto:janyel.lima2809@outlook.com',
    whatsapp: 'https://wa.me/5582999712833?text=Ol%C3%A1%2C%20Janyel%21%20Vim%20atrav%C3%A9s%20do%20seu%20portf%C3%B3lio%2C%20gostaria%20de%20agendar%20uma%20conversa%21%20Creio%20ter%20um%20desafio%20para%20voc%C3%AA%21',
  },

  // ── Histórico Profissional ─────────────────────────────────
  history: [

    // ── ANDHE (2025) ─────────────────────────────────────────
    {
      id: 'fullstack-developer-andhe-2024',
      company: 'ANDHE - Academia Nacional de Desenvolvimento Humano e Ecológico',
      role: {
        'en': 'Fullstack Developer (CTO Office)',
        'pt-br': 'Desenvolvedor Fullstack (Gabinete do CTO)',
      },
      period: {
        'en': '2025 - 2025',
        'pt-br': '2025 - 2025',
      },
      description: {
        'en': 'Direct execution under the CTO\'s guidance, acting as the spearhead for strategic demands and critical operations.\n\nBuilding and evolving corporate systems:\n- Fullstack development focused on stability, clarity, and scalability\n- Implementing and maintaining integrations across systems and services\n- Structuring data routines to support business decision-making\n\nArchitecture and sustainability:\n- Designing services and modules with long-term growth in mind\n- Standardizing delivery practices, versioning, and environments\n- Supporting higher-load environments and maintenance routines\n\nResults-driven execution:\n- Fast delivery of high-impact features\n- Direct communication with leadership and technical stakeholders\n- Strong commitment to consistency, performance, and reliability.',
        'pt-br': 'Execução direta sob orientação do CTO, atuando como ponta de entrega para demandas estratégicas e operações críticas.\n\nConstrução e evolução de sistemas corporativos:\n- Desenvolvimento de soluções fullstack com foco em estabilidade, clareza e escalabilidade\n- Implementação e manutenção de integrações entre sistemas e serviços\n- Organização de bases e rotinas de dados para suportar decisões de negócio\n\nArquitetura e sustentação:\n- Estruturação de serviços e módulos com visão de crescimento\n- Padronização de entregas, versionamento e ambientes\n- Suporte a ambientes de maior carga e rotinas de manutenção\n\nAtuação orientada a resultado:\n- Priorização e entrega rápida de funcionalidades com impacto real\n- Comunicação direta com liderança e stakeholders técnicos\n- Compromisso com consistência, performance e confiabilidade.',
      },
      skills: [
        { key: 'skill_powerbi', type: 'devicon' },
        { key: 'skill_excel', type: 'devicon' },
        { key: 'skill_bpmn', type: 'devicon' },
        { key: 'skill_java', type: 'devicon' },
        { key: 'skill_spring', type: 'devicon' },
        { key: 'skill_pg', type: 'devicon' },
        { key: 'skill_jsf', type: 'devicon' },
        { key: 'skill_php', type: 'devicon' },
        { key: 'skill_qgis', type: 'devicon' },
      ],
    },

    // ── Freelancer (2023–2024) ────────────────────────────────
    {
      id: 'fullstack-developer-2024',
      company: 'Autonomous',
      role: {
        'en': 'Freelancer Fullstack Developer',
        'pt-br': 'Desenvolvedor Fullstack Freelancer',
      },
      period: {
        'en': '2023 - 2024',
        'pt-br': '2023 - 2024',
      },
      description: {
        'en': 'On-demand development for clients and independent projects, focused on delivering working products from zero to deployment.\n\nEnd-to-end delivery:\n- Requirements gathering and turning needs into practical solutions\n- Fullstack development with a complete view of the user flow\n- Production deployment, adjustments, and post-delivery support\n\nSystems and data:\n- Building APIs and operational dashboards\n- Structuring databases and reports for daily use\n- Automating routines and improving internal processes\n\nExecution profile:\n- Full autonomy, technical ownership, and consistent delivery\n- Ability to adapt technologies to the problem\n- Focus on clarity, quality, and efficiency.',
        'pt-br': 'Desenvolvimento de soluções sob demanda para clientes e projetos independentes, com foco em entregar produto funcional do zero ao deploy.\n\nEntrega end-to-end:\n- Levantamento de requisitos e tradução de necessidades em solução prática\n- Desenvolvimento fullstack com visão completa do fluxo do usuário\n- Deploy, ajustes de produção e suporte pós-entrega\n\nSistemas e dados:\n- Construção de APIs e painéis de acompanhamento\n- Estruturação de bancos e relatórios para uso operacional\n- Automação de rotinas e melhoria de processos internos\n\nPerfil de execução:\n- Autonomia total, responsabilidade técnica e consistência de entrega\n- Capacidade de adaptar tecnologias conforme o problema\n- Foco em clareza, qualidade e eficiência.',
      },
      skills: [
        { key: 'skill_powerbi', type: 'devicon' },
        { key: 'skill_excel', type: 'devicon' },
        { key: 'skill_bpmn', type: 'devicon' },
        { key: 'skill_java', type: 'devicon' },
        { key: 'skill_spring', type: 'devicon' },
        { key: 'skill_pg', type: 'devicon' },
        { key: 'skill_jsf', type: 'devicon' },
        { key: 'skill_php', type: 'devicon' },
        { key: 'skill_qgis', type: 'devicon' },
      ],
    },

    // ── Planejare Consultoria (2023) ──────────────────────────
    {
      id: 'fullstack-developer-planejare-2023',
      company: 'Planejare Consultoria',
      role: {
        'en': 'Fullstack Developer',
        'pt-br': 'Desenvolvedor Fullstack',
      },
      period: {
        'en': '2023 - 2023',
        'pt-br': '2023 - 2023',
      },
      description: {
        'en': 'System development for a consulting environment, focused on building process-driven and operational management solutions.\n\nCorporate solutions:\n- Implementing features focused on workflow and productivity\n- Integrating modules and standardizing system routines\n- Supporting data structuring for reporting and monitoring\n\nOrganization and delivery:\n- Active participation across the full cycle: demand, development, validation, and delivery\n- Continuous improvements based on real-world feedback\n- Strong commitment to reliability and usability\n\nPractical execution:\n- Business-oriented development, not just code\n- Consistent delivery under short deadlines\n- Clear communication with teams and stakeholders.',
        'pt-br': 'Desenvolvimento de sistemas para consultoria, atuando na construção de soluções orientadas a processos, operação e gestão.\n\nSoluções corporativas:\n- Implementação de funcionalidades com foco em fluxo de trabalho e produtividade\n- Integração entre módulos e padronização de rotinas do sistema\n- Apoio na estruturação de dados para relatórios e acompanhamento\n\nOrganização e entrega:\n- Participação ativa no ciclo completo: demanda, desenvolvimento, validação e entrega\n- Correções, ajustes e evolução contínua conforme feedback do uso real\n- Compromisso com confiabilidade e usabilidade\n\nAtuação prática:\n- Desenvolvimento com visão de negócio, não só código\n- Entrega consistente em prazos curtos\n- Apoio a times e stakeholders com comunicação objetiva.',
      },
      skills: [
        { key: 'skill_powerbi', type: 'devicon' },
        { key: 'skill_excel', type: 'devicon' },
        { key: 'skill_bpmn', type: 'devicon' },
        { key: 'skill_java', type: 'devicon' },
        { key: 'skill_spring', type: 'devicon' },
        { key: 'skill_pg', type: 'devicon' },
        { key: 'skill_jsf', type: 'devicon' },
        { key: 'skill_php', type: 'devicon' },
        { key: 'skill_qgis', type: 'devicon' },
      ],
    },

    // ── Automining (2023) ─────────────────────────────────────
    {
      id: 'fullstack-developer-automining-2023',
      company: 'Automining',
      role: {
        'en': 'Fullstack Developer',
        'pt-br': 'Desenvolvedor Fullstack',
      },
      period: {
        'en': '2023 - 2023',
        'pt-br': '2023 - 2023',
      },
      description: {
        'en': 'Development of operational and management solutions in the mining context, focused on systems that support real daily routines.\n\nOperational systems:\n- Developing and maintaining critical system features\n- Structuring routines and modules with reliability in mind\n- Bridging technical teams and business needs\n\nData and reporting:\n- Supporting dashboards and monitoring reports\n- Organizing data for traceability and decision-making\n- Continuous improvement based on field usage\n\nDelivery and ownership:\n- Working on high-impact, short-deadline demands\n- Strong focus on production stability\n- Hands-on, solution-oriented profile.',
        'pt-br': 'Atuação no desenvolvimento de soluções voltadas à operação e gestão no contexto de mineração, com foco em sistemas que suportam rotina real.\n\nSistemas operacionais:\n- Desenvolvimento e manutenção de funcionalidades críticas do sistema\n- Estruturação de rotinas e módulos com foco em confiabilidade\n- Integração entre áreas técnicas e necessidades do negócio\n\nDados e relatórios:\n- Apoio na construção de painéis e relatórios de acompanhamento\n- Organização de dados para rastreabilidade e tomada de decisão\n- Evolução contínua com base em uso de campo\n\nEntrega e responsabilidade:\n- Participação em demandas de alto impacto e curto prazo\n- Compromisso com estabilidade em produção\n- Perfil hands-on e orientado a solução.',
      },
      skills: [
        { key: 'skill_powerbi', type: 'devicon' },
        { key: 'skill_excel', type: 'devicon' },
        { key: 'skill_bpmn', type: 'devicon' },
        { key: 'skill_java', type: 'devicon' },
        { key: 'skill_spring', type: 'devicon' },
        { key: 'skill_pg', type: 'devicon' },
        { key: 'skill_jsf', type: 'devicon' },
        { key: 'skill_php', type: 'devicon' },
        { key: 'skill_qgis', type: 'devicon' },
      ],
    },

    // ── Mineração Vale Verde — Analista (2021–2022) ───────────
    {
      id: 'vale-verde-process-system-analyst-2022',
      company: 'Mineração Vale Verde',
      role: {
        'en': 'Junior Process and System Analyst',
        'pt-br': 'Analista de Processos e Sistemas Junior',
      },
      period: {
        'en': '2021 - 2022',
        'pt-br': '2021 - 2023',
      },
      description: {
        'en': 'High-performance corporate systems:\n- Development and deployment of BPMN engines (Camunda, Spring, PrimeFaces, Java 11)\n- Building RESTful APIs\n- Orchestrating Docker containers\n- Managing PostgreSQL and configuring Linux servers on AWS\n\nData intelligence & reporting:\n- Advanced dashboards and reports with JasperReports, Excel, and Power BI\n- Mastering Power Query, DAX, M, and PowerPivot\n\nAgile work: SCRUM/Kanban using Asana\nDelivering robust, scalable, results-driven systems.',
        'pt-br': 'Sistemas corporativos de alta performance:\n- Desenvolvimento e deploy de BPMN engines (Camunda, Spring, PrimeFaces, Java 11)\n- Criação de APIs RESTful\n- Orquestração de containers Docker\n- Gestão de PostgreSQL e configuração de Linux Server na AWS\n\nInteligência de dados e relatórios:\n- Dashboards e relatórios avançados com JasperReports, Excel e Power BI\n- Domínio de Power Query, DAX, M e PowerPivot\n\nMetodologias ágeis: SCRUM/Kanban com Asana\nEntrega de sistemas robustos, escaláveis e orientados a resultados.',
      },
      skills: [
        { key: 'skill_powerbi', type: 'devicon' },
        { key: 'skill_excel', type: 'devicon' },
        { key: 'skill_bpmn', type: 'devicon' },
        { key: 'skill_java', type: 'devicon' },
        { key: 'skill_spring', type: 'devicon' },
        { key: 'skill_pg', type: 'devicon' },
        { key: 'skill_jsf', type: 'devicon' },
        { key: 'skill_php', type: 'devicon' },
        { key: 'skill_qgis', type: 'devicon' },
      ],
    },

    // ── Mineração Vale Verde — Assistente de TI (2021) ────────
    {
      id: 'vale-verde-it-assistant-2021',
      company: 'Mineração Vale Verde',
      role: {
        'en': 'IT Assistant',
        'pt-br': 'Assistente de TI',
      },
      period: {
        'en': '2021 - 2021',
        'pt-br': '2021 - 2021',
      },
      description: {
        'en': 'During my tenure, I developed and maintained internal systems to meet corporate needs using Java, Spring Framework, and JSF. I took full ownership of a performance evaluation system, delivering it from development to successful deployment and use, inside the SIGMIN project.',
        'pt-br': 'Durante minha atuação, desenvolvi e mantive sistemas internos para atender demandas corporativas usando Java, Spring Framework e JSF. Assumi o desenvolvimento completo de um sistema de avaliação de desempenho, desde a implementação até a entrega e uso efetivo, dentro do projeto SIGMIN.',
      },
      skills: [
        { key: 'skill_java', type: 'devicon' },
        { key: 'skill_jsf', type: 'devicon' },
        { key: 'skill_spring', type: 'devicon' },
        { key: 'skill_pg', type: 'devicon' },
        { key: 'skill_docker', type: 'devicon' },
        { key: 'skill_aws', type: 'devicon' },
        { key: 'skill_js', type: 'devicon' },
        { key: 'skill_php', type: 'devicon' },
      ],
    },

    // ── Mineração Vale Verde — Jovem Aprendiz (2019–2021) ─────
    {
      id: 'vale-verde-apprentice-2019-2021',
      company: 'Mineração Vale Verde',
      role: {
        'en': 'Apprentice',
        'pt-br': 'Jovem Aprendiz',
      },
      period: {
        'en': '2019 - 2021',
        'pt-br': '2019 - 2021',
      },
      description: {
        'en': 'During the operational training cycle, I executed administrative support routines, management and organization of critical files, and the construction of tactical data dashboards using Microsoft Power BI.',
        'pt-br': 'Durante o período de treinamento operacional, executei rotinas administrativas de suporte, gerenciamento e organização de arquivos críticos, além da construção de painéis táticos de dados utilizando Microsoft Power BI.',
      },
      skills: [
        { key: 'skill_java', type: 'devicon' },
        { key: 'skill_jsf', type: 'devicon' },
        { key: 'skill_spring', type: 'devicon' },
        { key: 'skill_pg', type: 'devicon' },
        { key: 'skill_docker', type: 'devicon' },
        { key: 'skill_aws', type: 'devicon' },
        { key: 'skill_js', type: 'devicon' },
        { key: 'skill_php', type: 'devicon' },
      ],
    },

  ],

};


// ============================================================
// MY DATA — Projetos
// ============================================================
const myData = {

  projects: [

    // ── SIGMIN ───────────────────────────────────────────────
    {
      title: 'SIGMIN - Sistema Integrado de Gestão de Mineração',
      type: {
        'en': 'Integrated Management System',
        'pt-br': 'Sistema Integrado de Gestão',
      },
      about: {
        'en': 'Integrated management system for mining operations, designed to unify multidisciplinary data collection through a tailored multimodular architecture, ensuring operational transparency, rapid adaptability to internal client requirements, system scalability, and critical real-time decision support.',
        'pt-br': 'Sistema integrado de gestão para operações de mineração, projetado para unificar a coleta de dados multidisciplinares por meio de uma arquitetura multimodular sob medida, garantindo transparência operacional, adaptação rápida às demandas do cliente interno, escalabilidade do sistema e suporte crítico à tomada de decisão em tempo real.',
      },
      images: ['img/sigmin.png'],
      stack: [
        { key: 'skill_java', type: 'devicon' },
        { key: 'skill_jsf', type: 'devicon' },
        { key: 'skill_spring', type: 'devicon' },
        { key: 'skill_pg', type: 'devicon' },
        { key: 'skill_docker', type: 'devicon' },
        { key: 'skill_aws', type: 'devicon' },
        { key: 'skill_js', type: 'devicon' },
        { key: 'skill_php', type: 'devicon' },
      ],
      team: [
        {
          name: 'Deyvson Santos',
          linkedin: 'https://br.linkedin.com/in/deyvson-santos-33b82723',
          avatar_url: 'https://media.licdn.com/dms/image/v2/D4D03AQFjaRG43GiFcQ/profile-displayphoto-shrink_200_200/B4DZV7UeI3HYAY-/0/1741530720352?e=2147483647&v=beta&t=hNMWarps5ptia8bL7oAPU0fXJDC2NSilXPTRxQwluU0',
          role: {
            'en': 'Process and Systems Supervisor',
            'pt-br': 'Supervisor de Processos e Sistemas',
          },
        },
        {
          name: 'Eric Lima',
          github: 'https://github.com/ericcruzlima/',
          portfolio: 'https://ericcruzlima.github.io/',
          avatar_url: 'https://raw.githubusercontent.com/ericcruzlima/ericcruzlima.github.io/refs/heads/main/photo_transparent.png',
          role: {
            'en': 'Process and Systems Analyst',
            'pt-br': 'Analista de Processos e Sistemas Pleno',
          },
        },
        {
          name: 'Bruno Henrique',
          github: 'https://github.com/bruhensant/',
          portfolio: 'https://bruhensant.one/',
          linkedin: 'https://www.linkedin.com/in/bruno-henrique-santos-2b9675234/',
          avatar_url: 'https://avatars.githubusercontent.com/u/25781117?v=4',
          role: {
            'en': 'IT Trainee',
            'pt-br': 'Estagiário de TI',
          },
        },
      ],
    },

    // ── Planeja Mais ─────────────────────────────────────────
    {
      title: 'Planeja Mais - MVP',
      type: {
        'en': 'Project Management Platform',
        'pt-br': 'Plataforma de Gestão de Projetos',
      },
      about: {
        'en': 'Minimum Operational Platform for project management in the public sector, engineered to encode and enforce the client\'s strategic management doctrine. A functional command-and-control core, deployed as a proving ground for the future expansion into a full-scale, enterprise SaaS platform.',
        'pt-br': 'Plataforma mínima operacional de gestão de projetos para o setor público, projetada para codificar e executar a doutrina estratégica do cliente. Um núcleo funcional de comando e controle, desenvolvido como campo de prova para a expansão futura em uma plataforma SaaS completa e escalável.',
      },
      images: ['img/planejamais.png'],
      stack: [
        { key: 'skill_java', type: 'devicon' },
        { key: 'skill_jsf', type: 'devicon' },
        { key: 'skill_spring', type: 'devicon' },
        { key: 'skill_pg', type: 'devicon' },
        { key: 'skill_docker', type: 'devicon' },
        { key: 'skill_js', type: 'devicon' },
      ],
      team: [
        {
          name: 'Lázaro Gustavo Sombra',
          github: 'https://github.com/gustavosombra1',
          avatar_url: 'https://avatars.githubusercontent.com/u/107960686?v=4',
          role: {
            'en': 'Trainee Developer',
            'pt-br': 'Desenvolvedor Estagiário',
          },
        },
      ],
    },

    // ── Mais Vida ────────────────────────────────────────────
    {
      title: 'Mais Vida - MVP',
      type: {
        'en': 'Healthcare Management Platform',
        'pt-br': 'Plataforma de Gestão de Saúde',
      },
      about: {
        'en': 'Operational queue and appointment management platform for medical clinics, designed to orchestrate patient flow end-to-end. Includes self-service check-in via kiosk, real-time queue display (current, last called, and next), appointment control, and generation of the Occupational Health Certificate—delivering a reliable command layer for daily clinical operations.',
        'pt-br': 'Plataforma operacional de gestão de filas e consultas para clínicas médicas, projetada para orquestrar o fluxo de pacientes de ponta a ponta. Inclui autoatendimento via totem de entrada, exibição em tempo real da fila (atual, último chamado e próximo), controle de consultas e geração do Atestado de Saúde Ocupacional — entregando uma camada confiável de comando para as rotinas clínicas.',
      },
      images: ['img/maisvida.png'],
      stack: [
        { key: 'skill_java', type: 'devicon' },
        { key: 'skill_jsf', type: 'devicon' },
        { key: 'skill_spring', type: 'devicon' },
        { key: 'skill_pg', type: 'devicon' },
        { key: 'skill_docker', type: 'devicon' },
        { key: 'skill_js', type: 'devicon' },
      ],
      team: [],
    },

    // ── Content Manager (NDA) ────────────────────────────────
    {
      title: 'Content Manager - NDA',
      type: {
        'en': 'Content Management',
        'pt-br': 'Gerenciamento de Conteúdo',
      },
      about: {
        'en': 'Proprietary content management and distribution platform with paid access control, automated financial validation, and internal policy enforcement. Developed under a formal Non-Disclosure Agreement (NDA), with details intentionally omitted to respect confidentiality terms.',
        'pt-br': 'Plataforma proprietária de gerenciamento e distribuição de conteúdo com controle de acesso pago, validação financeira automatizada e aplicação de políticas internas. Desenvolvida sob um Acordo de Confidencialidade (NDA) formal, com detalhes intencionalmente omitidos em respeito aos termos de confidencialidade.',
      },
      images: ['img/nda.png'],
      stack: [],
      team: [
        {
          name: 'Eric Lima',
          github: 'https://github.com/ericcruzlima/',
          portfolio: 'https://ericcruzlima.github.io/',
          avatar_url: 'https://raw.githubusercontent.com/ericcruzlima/ericcruzlima.github.io/refs/heads/main/photo_transparent.png',
          role: {
            'en': 'Chief Technology Officer',
            'pt-br': 'Diretor de Tecnologia',
          },
        },
      ],
    },

  ],

};


// ============================================================
// EDUCATION LOGS — Formação e Cursos
// Os campos title_key e provider_key referenciam chaves do i18n
// ============================================================
const educationLogs = {

  // ── Ensino Superior ──────────────────────────────────────
  higher: [
    {
      title_key: 'edu_cs_title',
      provider_key: 'edu_cs_provider',
      url: 'https://www.anhanguera.com/',
      icon: 'graduation-cap',
      hours: null,
      cert: null,
    },
    {
      title_key: 'edu_cs_title_uneal',
      provider_key: 'edu_cs_provider_uneal',
      url: 'https://uneal.edu.br/',
      icon: 'book-open-check',
      hours: null,
      cert: null,
    },
  ],

  // ── Cursos e Certificações ────────────────────────────────
  courses: [
    {
      title_key: 'course_green_belt',
      provider_key: 'provider_setec',
      url: 'https://www.setecconsulting.com.br/',
      icon: 'trending-up',
      hours: 80,
      cert: 'green-belt-lean-six-sigma.pdf',
    },
    {
      title_key: 'course_js_alura',
      provider_key: 'provider_alura',
      url: 'https://www.alura.com.br/',
      icon: 'braces',
      hours: 40,
      cert: 'alura-javascript.pdf',
    },
    {
      title_key: 'course_dashboard',
      provider_key: 'provider_datab',
      url: 'https://www.datab.com.br/',
      icon: 'bar-chart-2',
      hours: 8,
      cert: 'datab-dashboard-powerbi.pdf',
    },
    {
      title_key: 'course_bpmn_dheka',
      provider_key: 'provider_dheka',
      url: 'https://www.dheka.com.br/',
      icon: 'workflow',
      hours: 16,
      cert: 'dheka-bpmn.pdf',
    },
  ],

  // ── Idiomas ───────────────────────────────────────────────
  languages: [
    {
      title_key: 'lang_pt_br',
      provider_key: 'lang_level_native',
      proficiency: 5,
      proficiency_key: 'lang_native',
      flag: '🇧🇷',
      icon: 'message-circle',
      url: '#',
      hours: null,
      cert: null,
    },
    {
      title_key: 'lang_en',
      provider_key: 'lang_level_advanced',
      proficiency: 4,
      proficiency_key: 'lang_advanced',
      flag: '🇺🇸',
      icon: 'globe',
      url: '#',
      hours: null,
      cert: null,
    },
    {
      title_key: 'lang_ja',
      provider_key: 'lang_level_beginner',
      proficiency: 1,
      proficiency_key: 'lang_beginner',
      flag: '🇯🇵',
      icon: 'languages',
      url: '#',
      hours: null,
      cert: null,
    },
  ],

};
