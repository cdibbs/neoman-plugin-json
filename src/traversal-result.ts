export class TraversalResult {
    subject: string;
    destination: JSONPointer;
    parent: JSONPointer;
}

export class JSONPointer {
    type: string;
    v: JSONPointer | JSONPointer[];
    meta: JisonMetaData;
}

export interface JisonMetaData {
    first_line: number;
    last_line: number;
    first_column: number;
    last_column: number;
}