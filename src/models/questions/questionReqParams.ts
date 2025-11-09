export interface QuestionReqParams {
  page_number: number;
  page_size: number;
  sub_topic_id?: string;
  name?: string;
  type?: string;
  hidden?: string; // "true" | "false" | undefined
}
