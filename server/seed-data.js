export const DEFAULT_LABEL_COLORS = [
  '#61BD4F',
  '#F2D600',
  '#FF9F1A',
  '#EB5A46',
  '#C377E0',
  '#0079BF',
];

export const seedMembers = [
  ['Alice Johnson', 'alice@example.com', '#0079BF'],
  ['Bob Smith', 'bob@example.com', '#61BD4F'],
  ['Charlie Davis', 'charlie@example.com', '#EB5A46'],
  ['Diana Wilson', 'diana@example.com', '#C377E0'],
  ['Eve Martinez', 'eve@example.com', '#FF9F1A'],
];

export const seedBoards = [
  {
    title: 'Project Sprint Board',
    background: '#0079BF',
    labels: [
      ['bug', 'Bug', '#EB5A46'],
      ['feature', 'Feature', '#61BD4F'],
      ['urgent', 'Urgent', '#FF9F1A'],
      ['design', 'Design', '#C377E0'],
      ['docs', 'Documentation', '#0079BF'],
      ['enhance', 'Enhancement', '#F2D600'],
    ],
    lists: [
      ['Backlog', [
        {
          title: 'Research competitor products',
          description: 'Analyze top 5 competitors and document their key features, pricing models, and UX patterns.',
          labels: ['docs'],
          members: [1],
        },
        {
          title: 'Define project scope & requirements',
          description: 'Create a requirements document covering user stories and acceptance criteria.',
          labels: ['docs'],
        },
        {
          title: 'Write technical specification',
          description: 'Document the system architecture, API contracts, and core data models.',
          labels: ['docs'],
          members: [2],
        },
      ]],
      ['To Do', [
        {
          title: 'Design database schema',
          description: 'Create the data model, indexes, and migration strategy.',
          due: '2026-04-20',
          labels: ['feature', 'design'],
          members: [1, 2],
          checklistTitle: 'Schema Tasks',
          checklist: ['Define user tables', 'Define board/list/card tables', 'Add indexes', 'Write migrations'],
        },
        {
          title: 'Create UI wireframes',
          description: 'Design wireframes for board view, card details, and workspace landing.',
          due: '2026-04-22',
          labels: ['design'],
          members: [4],
        },
        {
          title: 'Set up CI/CD pipeline',
          description: 'Configure automated testing, linting, and deployment.',
          due: '2026-04-25',
          labels: ['feature'],
          members: [3],
          checklist: ['Configure GitHub Actions', 'Add test runner', 'Set up deployment'],
        },
      ]],
      ['In Progress', [
        {
          title: 'Build REST API endpoints',
          description: 'Implement CRUD for boards, lists, cards, labels, members, and search.',
          due: '2026-04-18',
          labels: ['feature', 'urgent'],
          members: [1, 3],
          checklist: ['Board CRUD', 'List CRUD', 'Card CRUD', 'Search & Filter', 'Drag & Drop reorder'],
        },
        {
          title: 'Implement drag-and-drop UI',
          description: 'Build the drag-and-drop interaction for lists and cards.',
          due: '2026-04-19',
          labels: ['feature', 'design'],
          members: [2],
        },
        {
          title: 'Fix card position bug on refresh',
          description: 'Investigate and fix position persistence after reload.',
          due: '2026-04-17',
          labels: ['bug', 'urgent'],
          members: [3],
        },
      ]],
      ['Review', [
        {
          title: 'Code review: Authentication module',
          description: 'Review OAuth implementation and session management.',
          labels: ['feature'],
          members: [2, 4],
        },
      ]],
      ['Done', [
        {
          title: 'Project kickoff meeting',
          description: 'Team kickoff complete, sprint goals agreed, initial owners assigned.',
          members: [1, 2, 3, 4],
        },
        {
          title: 'Set up development environment',
          description: 'Configured Node, tooling, and local development workflow.',
          labels: ['feature'],
          members: [3],
        },
      ]],
    ],
  },
  {
    title: 'Marketing Campaign',
    background: '#D29034',
    labels: [
      ['social', 'Social Media', '#61BD4F'],
      ['email', 'Email', '#0079BF'],
      ['content', 'Content', '#C377E0'],
      ['ads', 'Paid Ads', '#EB5A46'],
      ['analytics', 'Analytics', '#F2D600'],
    ],
    lists: [
      ['Ideas', [
        {
          title: 'Launch social media contest',
          description: 'Run a user-generated content contest across Instagram and Twitter.',
          labels: ['social'],
          members: [4],
        },
        {
          title: 'Partner with influencers',
          description: 'Reach out to 10 micro-influencers in the target niche.',
          labels: ['social'],
        },
      ]],
      ['Planning', [
        {
          title: 'Q2 email newsletter series',
          description: 'Design and schedule a 6-part email campaign.',
          due: '2026-04-30',
          labels: ['email', 'content'],
          members: [5],
          checklist: ['Week 1: Product intro', 'Week 2: Features deep dive', 'Week 3: Customer stories'],
        },
        {
          title: 'Google Ads campaign setup',
          description: 'Configure search campaigns targeting priority keywords.',
          due: '2026-04-28',
          labels: ['ads'],
          members: [5],
        },
      ]],
      ['Active', [
        {
          title: 'Blog content calendar',
          description: 'Publishing 2 blog posts per week on product insights and industry trends.',
          due: '2026-04-20',
          labels: ['content'],
          members: [4, 5],
        },
      ]],
      ['Completed', [
        {
          title: 'Brand guidelines document',
          description: 'Created a comprehensive brand guide with logo, palette, and voice.',
          labels: ['content'],
          members: [4],
        },
      ]],
    ],
  },
  {
    title: 'Product Roadmap',
    background: '#519839',
    labels: [
      ['core', 'Core', '#0079BF'],
      ['ui', 'UI/UX', '#C377E0'],
      ['perf', 'Performance', '#61BD4F'],
      ['security', 'Security', '#EB5A46'],
      ['infra', 'Infrastructure', '#FF9F1A'],
      ['research', 'Research', '#F2D600'],
    ],
    lists: [
      ['Q1 2026', [
        {
          title: 'User authentication v2',
          description: 'Implement OAuth 2.0 with Google and GitHub providers.',
          due: '2026-03-31',
          labels: ['core', 'security'],
        },
        {
          title: 'Dashboard redesign',
          description: 'Complete overhaul of the main dashboard with analytics widgets.',
          due: '2026-03-15',
          labels: ['ui'],
        },
      ]],
      ['Q2 2026', [
        {
          title: 'Real-time notifications',
          description: 'WebSocket-based notification system for live updates.',
          due: '2026-06-30',
          labels: ['core', 'infra'],
        },
        {
          title: 'Mobile app MVP',
          description: 'React Native mobile experience with core workflows.',
          due: '2026-06-30',
          labels: ['ui', 'core'],
        },
      ]],
      ['Q3 2026', [
        {
          title: 'AI-powered recommendations',
          description: 'Smart task suggestions and prioritization based on board context.',
          due: '2026-09-30',
          labels: ['research', 'perf'],
        },
      ]],
    ],
  },
];
