export function after(task: () => unknown): void {
  setImmediate(() => {
    Promise.resolve()
      .then(task)
      .catch((error) => {
        console.error("[after]", error instanceof Error ? error.message : "failed");
      });
  });
}
