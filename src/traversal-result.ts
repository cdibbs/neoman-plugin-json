export class TraversalResult {
    subject: string;
    destination: JSONPointer;
    //destinationKey: JSONPointer;
    parent: TraversalResult;
}

export class JSONPointer {
    type: string;
    v: JSONPointer | JSONPointer[];
    meta: JisonMetaData;
}

export interface JisonMetaData {
    // While Jison provides the following, they are not useful. Stick with range.
    /*first_line: number;
    last_line: number;
    first_column: number;
    last_column: number; */
    
    range: [number, number];
    leftSep: JisonMetaData;
    rightEl: JisonMetaData;
}