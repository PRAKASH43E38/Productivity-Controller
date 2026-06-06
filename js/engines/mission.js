// mission.js — AI Mission recommendation engine (Rule-Based)

function generateMissions() {
  const missions = { today: [], week: [], month: [] };
  const topics = Storage.get('px_topics') || {};

  // Today: Find first incomplete topic per subject (up to 3)
  for (const [subjectId, subject] of Object.entries(ROADMAP)) {
    const firstPending = subject.topics.findIndex((_, i) => !topics[`${subjectId}_${i}`]);
    if (firstPending !== -1 && missions.today.length < 3) {
      missions.today.push(`Complete: "${subject.topics[firstPending]}" in ${subject.label}`);
    }
  }

  // Week: Find subjects under 50%
  const weakSubjects = Object.keys(ROADMAP).filter(id => getSubjectPct(id) < 50);
  weakSubjects.slice(0, 2).forEach(id => {
    missions.week.push(`Focus on ${ROADMAP[id].label} — currently below 50%`);
  });

  // Week: CodeTantra check
  const ct = Storage.get('px_codetantra') || { current: 0 };
  if (ct.current < 100) {
    let nextMilestone = 100;
    const MILESTONES = [
      { pct: 40, label: "Foundation" },
      { pct: 55, label: "Intermediate" },
      { pct: 80, label: "Advanced" },
      { pct: 100, label: "Complete" }
    ];
    for (const milestone of MILESTONES) {
      if (ct.current < milestone.pct) {
        nextMilestone = milestone.pct;
        break;
      }
    }
    missions.week.push(`Push CodeTantra from ${ct.current}% toward the ${nextMilestone}% milestone`);
  }

  // Month: Subjects under 80%
  const monthTargets = Object.keys(ROADMAP).filter(id => getSubjectPct(id) < 80);
  monthTargets.slice(0, 3).forEach(id => {
    missions.month.push(`Fully master and complete the ${ROADMAP[id].label} module (target > 80%)`);
  });

  // Add default placeholders if lists are empty (highly consistent UX)
  if (missions.today.length === 0) {
    missions.today.push("All learning subjects completed! Keep up the review.");
  }
  if (missions.week.length === 0) {
    missions.week.push("You are in a great learning position. Build more projects this week!");
  }
  if (missions.month.length === 0) {
    missions.month.push("Maintain perfect habit streaks and keep practicing ML model tuning.");
  }

  return missions;
}
