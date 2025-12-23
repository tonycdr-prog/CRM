export async function assign(jobId: string) {
  return {
    jobId,
    chosenEngineerId: "eng_1",
    breakdown: {
      travel: 0.3,
      skills: 0.4,
      familiarity: 0.2,
      load: 0.1,
      sla: 0.0,
    },
  };
}

export async function simulate(_input: unknown) {
  return { ranked: [] as unknown[] };
}
