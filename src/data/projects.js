const projects = [
  {
    id: "personal-information",
    title: "Personal Information",
    tagline: "Software Engineering Student",
    description:
      "Basic personal and contact details, including full name, professional email, phone number, location, LinkedIn profile, and GitHub account.",
    tags: ["Profile", "Contact"],
    color: "#EB3D4B",
    details: [
      { label: "Full name", value: "Nguyen Kim Hung" },
      { label: "Professional title", value: "Software Engineering Student" },
      { label: "Location", value: "Vietnam" },
      { label: "Email", value: "mocnhannausdc@gmail.com" },
      { label: "Phone", value: "0383461187" },
      { label: "LinkedIn", value: "Hùng Kim" },
      { label: "GitHub", value: "https://github.com/mocnhansitingz" },
    ],
    detailSections: [
      {
        type: "header",
        title: "About me",
        content:
          "I am a Software Engineering student who enjoys solving real-world problems through clean code, practical thinking, and continuous learning.",
      },
      {
        type: "cards",
        title: "Quick facts",
        items: [
          { label: "Name", value: "Nguyen Kim Hung" },
          { label: "Role", value: "Software Engineering Student" },
          { label: "Location", value: "Vietnam" },
          { label: "Email", value: "mocnhannausdc@gmail.com" },
          { label: "LinkedIn", value: "Hùng Kim" },
          { label: "GitHub", value: "mocnhansitingz" },
        ],
      },
    ],
  },
  {
    id: "professional-summary",
    title: "Professional Summary",
    tagline: "Software engineering overview",
    description:
      "A brief introduction to my background, career interests, personal strengths, working mindset, and professional goals as a Software Engineering student. Highlight my willingness to learn, adaptability, logical thinking, and passion for technology.",
    tags: ["Engineering", "Growth"],
    color: "#F7D038",
    details: [
      {
        label: "Profile",
        value:
          "Software Engineering student with a strong interest in building reliable, user-centered digital products and learning modern engineering practices.",
      },
      {
        label: "Strengths",
        value:
          "Logical thinking, problem solving, adaptability, collaboration, and a consistent drive to keep learning.",
      },
      {
        label: "Career focus",
        value:
          "Aspiring software engineer focused on building scalable systems, improving user experience, and contributing to meaningful projects.",
      },
    ],
    detailSections: [
      {
        type: "header",
        title: "Professional summary",
        content:
          "I am a Software Engineering student passionate about technology, software quality, and solving practical problems through thoughtful design and continuous improvement.",
      },
      {
        type: "list",
        title: "Key strengths",
        items: [
          "Willing to learn and adapt to new technologies quickly",
          "Strong analytical and logical thinking",
          "Able to work well in teams and communicate effectively",
          "Interested in building products that are useful, scalable, and maintainable",
          "Driven by curiosity, discipline, and problem-solving mindset",
        ],
      },
      {
        type: "cards",
        title: "Career interests",
        items: [
          { label: "Software", value: "Web development and software engineering" },
          { label: "Mindset", value: "Clean code and practical problem solving" },
          { label: "Goal", value: "Build valuable systems with quality and impact" },
        ],
      },
    ],
  },
  {
    id: "education",
    title: "Education",
    tagline: "Academic foundation",
    description:
      "My academic background, university, major in Software Engineering, study period, GPA, relevant coursework, and other educational achievements.",
    tags: ["Education", "Software Engineering"],
    color: "#5CC8F0",
    details: [
      { label: "Program", value: "Software Engineering" },
      { label: "University", value: "Your University Name" },
      { label: "Study period", value: "2021 - 2025" },
      { label: "GPA", value: "3.5 / 4.0" },
      { label: "Relevant coursework", value: "Algorithms, Data Structures, Web Development, Databases, Software Engineering" },
    ],
    detailSections: [
      {
        type: "header",
        title: "Education background",
        content:
          "My academic journey has provided a strong foundation in software engineering fundamentals, including programming, systems thinking, database design, and application development.",
      },
      {
        type: "timeline",
        title: "Education timeline",
        items: [
          {
            label: "2021 - 2025",
            value: "Software Engineering — Your University Name",
          },
          {
            label: "GPA",
            value: "3.5 / 4.0",
          },
          {
            label: "Core coursework",
            value: "Algorithms, Data Structures, Database Systems, Web Development, Object-Oriented Programming, Software Engineering Principles",
          },
        ],
      },
    ],
  },
  {
    id: "skills",
    title: "Skills",
    tagline: "Technical and professional strengths",
    description:
      "An overview of my technical and interpersonal abilities, including programming languages, frameworks, databases, development tools, problem-solving, teamwork, communication, and language proficiency.",
    tags: ["Tech", "Communication"],
    color: "#6BD44A",
    details: [
      { label: "Programming", value: "Java, JavaScript, TypeScript, C#, Python" },
      { label: "Frontend", value: "React, HTML, CSS, Tailwind" },
      { label: "Backend & Data", value: "Node.js, Express, SQL, MySQL, Firebase" },
      { label: "Tools", value: "Git, GitHub, VS Code, Postman, Figma" },
      { label: "Soft skills", value: "Teamwork, communication, problem-solving, time management" },
      { label: "Languages", value: "Vietnamese (native), English (working proficiency)" },
    ],
    detailSections: [
      {
        type: "header",
        title: "Skills overview",
        content:
          "I am developing a balanced set of technical and interpersonal skills that help me build quality software and work effectively with others.",
      },
      {
        type: "group",
        title: "Programming & frameworks",
        items: ["JavaScript", "TypeScript", "React", "Node.js", "HTML", "CSS", "Tailwind", "SQL"],
      },
      {
        type: "group",
        title: "Tools & workflow",
        items: ["Git", "GitHub", "VS Code", "Postman", "Figma", "Debugging", "Testing"],
      },
      {
        type: "group",
        title: "Professional strengths",
        items: ["Teamwork", "Communication", "Problem solving", "Adaptability", "Time management"],
      },
    ],
  },
  {
    id: "projects-experience",
    title: "Projects & Experience",
    tagline: "Selected software work",
    description:
      "A presentation of my academic projects, personal projects, teamwork, and practical experience. Highlight my responsibilities, technologies used, technical contributions, challenges solved, and project outcomes.",
    sourceLabel: "Source",
    sourceUrl: "https://github.com/mocnhansitingz",
    tags: ["Experience", "Portfolio"],
    color: "#F29BC1",
    details: [
      { label: "Project type", value: "Academic and personal software projects" },
      { label: "Responsibilities", value: "UI development, logic implementation, debugging, teamwork" },
      { label: "Focus areas", value: "Frontend, backend, user experience, system logic" },
      { label: "Outcome", value: "Built practical, functional projects that demonstrate learning and growth" },
    ],
    detailSections: [
      {
        type: "header",
        title: "Projects & experience",
        content:
          "Through academic and personal projects, I have developed hands-on experience in building software solutions, solving real problems, and collaborating with others.",
      },
      {
        type: "project",
        title: "Project 01: Personal portfolio website",
        items: [
          "Designed and implemented a personal portfolio to present my skills and projects",
          "Used React and modern UI techniques to create a responsive and engaging experience",
          "Focused on readability, visual consistency, and project storytelling",
        ],
      },
      {
        type: "project",
        title: "Project 02: Student management / academic dashboard",
        items: [
          "Built an application to organize and track student-related information",
          "Worked on features such as data display, filtering, and user interaction flows",
          "Improved understanding of CRUD logic, UI structure, and application organization",
        ],
      },
      {
        type: "project",
        title: "Project 03: Practical software learning projects",
        items: [
          "Worked on smaller projects to strengthen problem-solving, debugging, and implementation skills",
          "Explored frontend-backend integration, state handling, and user interaction design",
          "Applied new knowledge in real scenarios to improve technical confidence and quality",
        ],
      },
    ],
  },
  {
    id: "achievements-activities",
    title: "Achievements & Activities",
    tagline: "Extra value and initiative",
    description:
      "A summary of my certifications, awards, academic achievements, extracurricular activities, competitions, volunteering, and self-learning experiences that demonstrate my initiative and continuous personal development.",
    tags: ["Awards", "Activities"],
    color: "#B48CF2",
    details: [
      { label: "Certificates", value: "Programming, web, and technology-related learning certificates" },
      { label: "Recognition", value: "Academic achievements, competition participation, or project awards" },
      { label: "Activities", value: "Self-study, volunteering, workshops, and community involvement" },
      { label: "Impact", value: "Shows initiative, leadership, and a commitment to growth" },
    ],
    detailSections: [
      {
        type: "header",
        title: "Achievements",
        content:
          "I actively seek opportunities to learn, improve, and contribute beyond the classroom, which reflects both initiative and long-term personal growth.",
      },
      {
        type: "list",
        title: "Highlights",
        items: [
          "Completed technical courses, certifications, or self-learning programs",
          "Participated in academic or technical competitions",
          "Contributed to volunteering or mentoring activities",
          "Engaged in extracurricular activities that build teamwork and leadership skills",
        ],
      },
      {
        type: "cards",
        title: "Examples",
        items: [
          { label: "Learning", value: "Self-driven technology learning" },
          { label: "Community", value: "Volunteer and social contribution" },
          { label: "Growth", value: "Continuous personal development" },
        ],
      },
    ],
  },
  {
    id: "bmo-snake-game",
    title: "Snake Game",
    tagline: "Mini arcade challenge",
    description:
      "A quick arcade game hidden in BMO's cassette deck. Start the game, eat the fruit, and keep the snake alive as long as possible.",
    tags: ["Game", "Arcade"],
    kind: "game",
    color: "#F7D038",
    details: [
      { label: "Mode", value: "Arcade" },
      { label: "Goal", value: "Eat the fruit and avoid crashing" },
      { label: "Controls", value: "Arrow keys or WASD" },
      { label: "Status", value: "Ready to play" },
    ],
    detailSections: [
      {
        type: "header",
        title: "Mini game",
        content:
          "This extra cassette brings a playful break into the portfolio. It is a small built-in BMO-style arcade challenge that keeps the table interactive.",
      },
      {
        type: "cards",
        title: "Game overview",
        items: [
          { label: "Type", value: "Arcade mini game" },
          { label: "Objective", value: "Collect fruit and survive" },
          { label: "Controls", value: "Arrow keys / WASD" },
        ],
      },
    ],
  },
];

export default projects;
