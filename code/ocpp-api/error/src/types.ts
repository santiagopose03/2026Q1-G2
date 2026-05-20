type UniqueId = string;
type ErrorCode = string;
type ErrorDesc = string;
type ErrorDetails = object;

export type CallError = [4, UniqueId, ErrorCode, ErrorDesc, ErrorDetails];
