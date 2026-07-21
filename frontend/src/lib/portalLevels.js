/** XP → level mapping used by the student portal. */
export function getUserLevelDetails(xp) {
  if (xp < 300) {
    return {
      level: 1,
      name: "Simulated Recruit",
      nextThreshold: 300,
      prevThreshold: 0,
    };
  }
  if (xp < 800) {
    return {
      level: 2,
      name: "Strategic Analyst",
      nextThreshold: 800,
      prevThreshold: 300,
    };
  }
  if (xp < 1500) {
    return {
      level: 3,
      name: "Portfolio Scholar",
      nextThreshold: 1500,
      prevThreshold: 800,
    };
  }
  if (xp < 2500) {
    return {
      level: 4,
      name: "NIL Tactician",
      nextThreshold: 2500,
      prevThreshold: 1500,
    };
  }
  return {
    level: 5,
    name: "Generational Legacy Steward",
    nextThreshold: 5000,
    prevThreshold: 2500,
  };
}
