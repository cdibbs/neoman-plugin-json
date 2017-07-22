export type UnionKeyToValue<U extends string> = {
  [K in U]: K
};

export class ParamsModel {
    op: Operation = Operations.setValue;
    type: TransformAsType = TransformAsTypes.useSource;
    ignoreInvalid: boolean = false;
}

export type Operation = "setValue" | "setKey" | "append" | "prepend" | "insertAfter" | "insertBefore";
export let Operations: UnionKeyToValue<Operation> = {
    "setValue": "setValue",
    "setKey": "setKey",
    "append": "append",
    "prepend": "prepend",
    "insertAfter": "insertAfter",
    "insertBefore": "insertBefore"
};

export type TransformAsType = "useDestination" | "useSource" | "string" | "boolean" | "number" | "object" | "array" | "null";
export let TransformAsTypes: UnionKeyToValue<TransformAsType> = { 
    "useDestination": "useDestination",
    "useSource": "useSource",
    "string": "string",
    "boolean": "boolean",
    "number": "number",
    "object": "object",
    "array": "array",
    "null": "null"
};