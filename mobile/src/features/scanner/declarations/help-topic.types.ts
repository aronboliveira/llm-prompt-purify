export type HelpTopicId =
  | "clientside"
  | "controls"
  | "country"
  | "coverage"
  | "workflow";

export interface HelpTopic {
  id: HelpTopicId;
  title: string;
  paragraphs: readonly string[];
}
