export type CommandContext = {
  openPalette: () => void;
  closePalette: () => void;
};

export type Command = {
  id: string;
  name: string;
  shortcut?: string;
  handler: (context: CommandContext) => void | Promise<void>;
};
