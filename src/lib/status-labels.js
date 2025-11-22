export const APPLICATION_STATUS_LABELS = {
  NEW: "En Revisión",
  INTERVIEW: "En Entrevistas",
  TALENT_POOL: "Cartera / Pool",
  HIRED: "Contratado",
  REJECTED: "Descartado",
};

export function getApplicationStatusLabel(status) {
  if (!status) return "";
  return APPLICATION_STATUS_LABELS[status] || status;
}

export const JOB_STATUS_LABELS = {
  OPEN: "Activa",
  PAUSED: "Pausada",
  CLOSED: "Cerrada",
};

export function getJobStatusLabel(status) {
  if (!status) return "";
  return JOB_STATUS_LABELS[status] || status;
}