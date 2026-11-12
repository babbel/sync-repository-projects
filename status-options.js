const DefaultColor = 'GRAY';

const parseStatusOptions = (input) => input
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line !== '')
  .map((line) => {
    const [name, color = DefaultColor] = line.split(':').map((part) => part.trim());

    return { name, color: color.toUpperCase() };
  });

export { parseStatusOptions };
