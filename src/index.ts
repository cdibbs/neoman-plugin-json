import * as json from './parsers/json';
import * as jsonPath from './parsers/json-path';
import { TraversalResult, JSONPointer, JisonMetaData } from './traversal-result';
import { ParamsModel, TransformAsTypes, Operations } from './types';

class JSONPlugin {
    pluginConfiguration: any;

    configure(pluginConfiguration: any) {
        this.pluginConfiguration = pluginConfiguration;
    }

    transform(path: string, content: string, subject: string, valOrFn: string | Function, params: any): string {
        let obj: any;

        try {
            obj = json.parse(content);
        } catch(err) {
            throw new Error("Not valid JSON: " + (err && err.message) || err);
        }

        let paramsWithDefaults = Object.assign(new ParamsModel(), params);
        let travResult = this.traverse(obj, subject);
        let trans = this.applyTransform(content, subject, travResult, valOrFn, paramsWithDefaults);
        return trans;
    }

    protected applyTransform(content: string, subject: string, travResult: TraversalResult, valOrFn: string | Function, params: ParamsModel): string {
        let val = this.getTransformValue(valOrFn, subject, travResult, params);

        if (params.action === Operations.set) {
            return this.transform_set(content, val, travResult);
        } else if (params.action === Operations.setKey) {
            return this.transform_setKey(content, val, travResult);
        } else if (params.action === Operations.remove) {
            return this.transform_remove(content, travResult);
        } else if (params.action === Operations.append) {
            // Appending to an array is straightforward and can be done with any value type
            // Appending to an object requires an input type of object
            // Appending to a string requires a string
            // Appending to anything else throws
            return this.transform_append(content, val, travResult);
        } else if (params.action === Operations.prepend) {
            return this.transform_prepend(content, val, travResult);
        } else if (params.action === Operations.insertAfter) {
            return this.transform_insertAfter(content, val, travResult);
        } else if (params.action === Operations.insertBefore) {
            return this.transform_insertBefore(content, val, travResult);
        }
    }

    protected coerseString(val: any): string {
        return val;
    }

    protected insertString(content: string, val: string, startIndex: number, endIndex: number): string {
        return content.substr(0, startIndex) + val + content.substr(endIndex);
    }

    protected transform_set(content: string, val: string, travResult: TraversalResult): string {
        let dest = this.getRealDestination(travResult.destination);
        let meta = dest.meta;
        let startIndex = meta.range[0];
        let endIndex = meta.range[1];
        return this.insertString(content, val, startIndex, endIndex);
    }

    protected transform_setKey(content: string, val: string, travResult: TraversalResult): string {
        if (travResult.destination.type !== "member") {
            throw new Error(`Cannot set key. Destination "${travResult.subject}" is not a keyed object.`);
        }

        let meta = travResult.destination.v[0].meta;
        let startIndex = meta.range[0];
        let endIndex = meta.range[1];
        return this.insertString(content, val, startIndex, endIndex);
    }

    protected transform_insertBefore(content: string, val: string, travResult: TraversalResult): string {
        let dest = this.getRealDestination(travResult.destination);
        let parentDest = this.getRealDestination(travResult.parent.destination);
        //console.log(dest, travResult.parent, parentDest);
        switch(parentDest.type) {
            case "object":
                throw new Error("not implemented");
            case "array":
                if (parentDest.v[0] === dest)
                    return this.transform_prepend(content, val, travResult.parent);
                
                let postfill: string;
                if (dest.meta.rightEl) {
                    let after = dest.meta.range[1];
                    let nextElBound = dest.meta.rightEl.range[0];
                    postfill = content.substr(after, nextElBound - after);
                } else {
                    let after = dest.meta.leftSep.range[0];
                    let curElBound = dest.meta.range[0];
                    postfill = content.substr(after, curElBound - after);
                }
                let startIndex: number, endIndex: number;
                endIndex = startIndex = dest.meta.range[0];
                return this.insertString(content, this.coerseString(val) + postfill, startIndex, endIndex);
            default:
                console.log(JSON.stringify(dest, null, 2));
                throw new Error(`not implemented for ${parentDest.type}`);
        }
    }

    protected transform_insertAfter(content: string, val: string, travResult: TraversalResult): string {
        let dest = this.getRealDestination(travResult.destination);
        let parentDest = this.getRealDestination(travResult.parent.destination);
        //console.log(dest, travResult.parent, parentDest);
        switch(parentDest.type) {
            case "object":
                throw new Error("not implemented");
            case "array":
                if (parentDest.v[(<Array<JSONPointer>>parentDest.v).length - 1] === dest)
                    return this.transform_append(content, val, travResult.parent);
                
                let prefill: string;
                if (dest.meta.leftSep) {
                    let firstBound = dest.meta.leftSep.range[0];
                    let nextElBound = dest.meta.range[0];
                    prefill = content.substr(firstBound, nextElBound - firstBound);
                } else {
                    let after = dest.meta.range[1];
                    let curElBound = dest.meta.rightEl.range[0];
                    prefill = content.substr(after, curElBound - after);
                }
                let startIndex: number, endIndex: number;
                endIndex = startIndex = dest.meta.range[1];
                return this.insertString(content, prefill + this.coerseString(val), startIndex, endIndex);
            default:
                console.log(JSON.stringify(dest, null, 2));
                throw new Error(`not implemented for ${parentDest.type}`);
        }
    }


    protected transform_append(content: string, val: string, travResult: TraversalResult): string {
        let dest = this.getRealDestination(travResult.destination);
        switch(dest.type) {
            case "object":
                throw new Error("not implemented");
            case "array":
                let startIndex: number, endIndex: number;
                let arr = <Array<JSONPointer>>dest.v;
                if (arr.length > 0) {
                    let meta = dest.meta;
                    let lastChild = arr[arr.length - 1];
                    let filler = content.substr(lastChild.meta.leftSep.range[0], lastChild.meta.range[0] - lastChild.meta.leftSep.range[0]);
                    endIndex = startIndex = lastChild.meta.range[1];
                    return this.insertString(content, filler + this.coerseString(val), startIndex, endIndex);
                } else {
                    let meta = dest.meta;
                    startIndex = meta.range[0]+1;
                    endIndex = meta.range[1]-1;
                }
                return this.insertString(content, val, startIndex, endIndex);
            default:
                console.log(JSON.stringify(dest, null, 2));
                throw new Error("not implemented");
        }
    }

    protected transform_prepend(content: string, val: string, travResult: TraversalResult): string {
        let dest = this.getRealDestination(travResult.destination);
        switch(dest.type) {
            case "object":
                throw new Error("not implemented");
            case "array":
                let startIndex: number, endIndex: number;
                let arr = <Array<JSONPointer>>dest.v;
                if (arr.length > 0) {
                    let meta = dest.meta;
                    let firstChild = arr[0];
                    let filler = content.substr(firstChild.meta.range[1], firstChild.meta.rightEl.range[0] - firstChild.meta.range[1]);
                    endIndex = startIndex = firstChild.meta.range[0];
                    return this.insertString(content, this.coerseString(val) + filler, startIndex, endIndex);
                } else {
                    let meta = dest.meta;
                    startIndex = meta.range[0]+1;
                    endIndex = meta.range[1]-1;
                }
                return this.insertString(content, val, startIndex, endIndex);
            default:
                console.log(JSON.stringify(dest, null, 2));
                throw new Error("not implemented");
        }
    }

    protected transform_remove(content: string, travResult: TraversalResult): string {
        switch(travResult.parent.destination.type) {
            case "array":
            case "member": // object -> member -> (key: val)
                let meta = travResult.destination.meta;
                let startIndex, endIndex;
                if (meta.leftSep) {
                    startIndex = meta.leftSep.range[0];
                    endIndex = meta.range[1];
                } else {
                    startIndex = meta.range[0];
                    endIndex = meta.rightEl.range[0];
                }
                return content.substr(0, startIndex) + content.substr(endIndex);
            case "object":
            default:
                throw new Error(`Trying to remove from unknown parent type ${travResult.parent.destination.type}.`);
        }
    }

    protected getTransformValue(valOrFn: string | Function, subject: string, travResult: TraversalResult, params: ParamsModel): any {
        let r = valOrFn;
        if (typeof valOrFn === "function") {
            r = valOrFn(subject, travResult);
        }

        if (params.type === TransformAsTypes.useSource) {
            switch (typeof r) {
                case "string":
                    r = this.makeStringString(<string>r);
                    break;
                case "number":
                    r = this.makeNumberString(r);
                    break;
            }
        } else if (params.type === TransformAsTypes.string) {
            r = this.makeStringString(<string>r);
        } else if (params.type === TransformAsTypes.number) {
            r = this.makeNumberString(r);
        } else if (params.type === TransformAsTypes.array || params.type === TransformAsTypes.object) {
            throw new Error("unimplemented");
        } else if (params.type === TransformAsTypes.boolean) {
            throw new Error("unimplemented");
        } else if (params.type === TransformAsTypes.null) {
            r = "null";
        } else {
            throw new Error("unimplemented");
        }

        return r;
    }

    protected makeStringString(r: string): string {
        return "\"" + r.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }
    
    protected makeNumberString(r: any): string {
        return "" + r;
    }

    protected traverse(metajson: any, subject: string): TraversalResult {
      let tr = new TraversalResult();
      tr.subject = "$";
      tr.parent = null;
      tr.destination = metajson;
      let ast = jsonPath.parse(subject);
      let path = ast[1];
      for (var i=0; i<path.length; i++) {
        let key = path[i][1];
        let type = tr.destination.type;
        if (type === "member") {
            type = tr.destination.v[1].type;
        }

        if (type === "object") {
            tr = this.traverseObject(tr, key, path, i);
        } else if (type === "array") {
            tr = this.traverseArray(tr, key, path, i);
        } else {
            let err = `Element at subpath "${this.buildComponentStr(path, i)}" is not an array or object, but a "${tr.destination.type}".\n`;
            throw new Error(err);
        }
      }
      return tr;
    }

    protected traverseArray(tr: TraversalResult, key: any, path: string[], i: number): TraversalResult {
        let dest: JSONPointer = this.getRealDestination(tr.destination);
        if (key >= 0 && key < (<Array<JSONPointer>>dest.v).length) {
            let newTr = new TraversalResult();
            newTr.subject = this.buildComponentStr(path, i + 1);
            newTr.parent = tr;
            newTr.destination = dest.v[key];
            //newTr.destinationKey = null;
            return newTr;
        } else {
            throw new Error(`Element "${key}" at subpath "${this.buildComponentStr(path, i)}" does not exist.`);
        }
    }

    protected traverseObject(tr: TraversalResult, key: any, path: string[], i: number): TraversalResult {
        let found = false;
        let dest: JSONPointer = this.getRealDestination(tr.destination);
        for(var j=0; j<(<[JSONPointer]>dest.v).length; j++) {
            let tn = dest.v[j]
            if (tn.type === "member" && tn.v[0].v === key) {
                let newTr = new TraversalResult();
                newTr.subject = this.buildComponentStr(path, i + 1);
                newTr.destination = tn;
                //newTr.destinationKey = tn.v[0];
                //newTr
                newTr.parent = tr;
                found = true;
                return newTr;
            }
        }
        
        if (! found) {
            throw new Error(`Element "${key}" at subpath "${this.buildComponentStr(path, i)}" does not exist.`);
        }
    }

    protected getRealDestination(dest: JSONPointer): JSONPointer {
        if (dest.type === "member") {
            return dest.v[1];
        }

        return dest;
    }

    protected buildComponentStr(path: any, upTo: number) {
        return path.reduce((p: string, c: any, i: number) => i < upTo ? (p + "[" + (typeof(c[1]) === "string" ? `"${c[1]}"` : c[1]) + "]") : p, "$");
    }
}

export = JSONPlugin;
