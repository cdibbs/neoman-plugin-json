export type UnionKeyToValue<U extends string> = {
  [K in U]: K
};

export class ParamsModel {
    action: Operation = Operations.set;
    type: TransformAsType = TransformAsTypes.useSource;
    ignoreInvalid: boolean = false;
}

export type Operation = "set" | "setKey" | "append" | "prepend" | "insertAfter" | "insertBefore";
export let Operations: UnionKeyToValue<Operation> = {
    "set": "set",
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