export type HelpTopicId = "clientside" | "controls" | "coverage" | "workflow";

export interface HelpTopic {
  id: HelpTopicId;
  title: string;
  paragraphs: readonly string[];
}
