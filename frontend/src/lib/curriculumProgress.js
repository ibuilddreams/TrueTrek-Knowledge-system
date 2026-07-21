/**
 * Curriculum tier progress helpers shared by Curriculum and related views.
 */
export function getTierRequirementText(tierId, status, isLoggedIn) {
  if (status === "Completed") {
    return "All requirements solved. Compliance certified.";
  }

  if (!isLoggedIn) {
    return "Sign in to Student Portal to audit and unlock";
  }

  switch (tierId) {
    case "tier-1":
      return "Solve Drill-2 (Financial Literacy) to complete";
    case "tier-2":
      return "Solve Drill-1 (Corporate Structure) to complete";
    case "tier-3":
      return "Solve Drill-2 (Financial Literacy) to unlock and complete";
    case "tier-4":
      return "Solve Drill-2 & Drill-3 (Compliance Frameworks) to unlock and complete";
    case "tier-5":
      return "Solve Drill-3 (Compliance Dynamics) to complete";
    case "tier-6":
      return "Solve Drill-1 & Drill-2 to complete";
    case "tier-7":
      return "Solve Drill-3 to complete";
    case "tier-8":
      if (status === "Locked") {
        return "Solve Drill-3 to unlock";
      }
      return "In progress. Submit core assignment in drill environment";
    case "tier-9":
      if (status === "Locked") {
        return "Solve all 3 core Drills to unlock";
      }
      return "In progress. Run final risk simulation";
    case "tier-v1":
      return "Solve Trade Drill-4 (Subcontractor & Safety Compliance) to complete";
    case "tier-v2":
      return "In progress. Submit custom industrial bid in student sandbox";
    case "tier-v3":
      return "In progress. Complete CRM dispatch field optimization test";
    default:
      return "Academic compliance check required";
  }
}

export function getTierStatus(tierId, isLoggedIn, drillCompletedList = []) {
  if (!isLoggedIn) {
    if (tierId === "tier-1" || tierId === "tier-1b" || tierId === "tier-1c") {
      return "In Progress";
    }
    return "Locked";
  }

  switch (tierId) {
    case "tier-1b":
    case "tier-1c":
      return "Completed";
    case "tier-1":
      return drillCompletedList.includes("drill-2") ? "Completed" : "In Progress";
    case "tier-2":
      return drillCompletedList.includes("drill-1") ? "Completed" : "In Progress";
    case "tier-3":
      return drillCompletedList.includes("drill-2") ? "Completed" : "Locked";
    case "tier-4":
      return drillCompletedList.includes("drill-2") &&
        drillCompletedList.includes("drill-3")
        ? "Completed"
        : "Locked";
    case "tier-5":
      return drillCompletedList.includes("drill-3") ? "Completed" : "In Progress";
    case "tier-6":
      return drillCompletedList.includes("drill-1") &&
        drillCompletedList.includes("drill-2")
        ? "Completed"
        : "In Progress";
    case "tier-7":
      return drillCompletedList.includes("drill-3") ? "Completed" : "In Progress";
    case "tier-8":
      return drillCompletedList.includes("drill-3") ? "In Progress" : "Locked";
    case "tier-9":
      return drillCompletedList.length >= 3 ? "In Progress" : "Locked";
    case "tier-v1":
      return drillCompletedList.includes("drill-4") ? "Completed" : "In Progress";
    case "tier-v2":
      return drillCompletedList.includes("drill-4") ? "In Progress" : "Locked";
    case "tier-v3":
      return drillCompletedList.includes("drill-4") ? "In Progress" : "Locked";
    default:
      return "Locked";
  }
}
