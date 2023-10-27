export const processJson = () => {
  const transformStream = new TransformStream({
    transform(chunk, controller) {
      const lines = chunk.split("\n");
      lines.forEach((line: any) => {
        controller.enqueue(line);
      });
    },
  });

  return transformStream;
};
