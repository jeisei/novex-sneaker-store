export function createLifecycle() {
  let controller;
  let cleanup;
  let generation = 0;

  function clear() {
    generation += 1;
    controller?.abort();
    cleanup?.();
    cleanup = undefined;
  }

  return {
    async mount(mountView, onError) {
      clear();
      controller = new AbortController();
      const signal = controller.signal;
      const current = generation;
      try {
        const dispose = await mountView(signal);
        if (current !== generation) dispose?.();
        else cleanup = dispose;
      } catch (error) {
        if (current === generation && !signal.aborted) onError(error);
      }
    },
    dispose: clear,
  };
}
