import * as json from './parsers/json';
import * as jsonPath from './parsers/json-path';
import { TraversalResult, JSONPointer } from './traversal-result';
import { ParamsModel, TransformAsTypes, Operations } from './types';

class JSONPlugin {
    pluginConfiguration: any;

    configure(pluginConfiguration: any) {
        this.pluginConfiguration = pluginConfiguration;
    }

    transform(path: string, content: string, subject: string, valOrFn: string | Function, params: any): string {
        /*let $ = c.load(content, this.pluginConfiguration);
        let $r = $(replace);

        if (typeof val === "string") {
            switch (params.type) {
                case "text": $r.text(val); break;
                case "attr": $r.attr(params.attr, val); break;
                case "addClass": $r.addClass(val); break;
                case "prop": $r.prop(params.prop, val); break;
                case "val": $r.val(val); break;
                case "removeAttr": $r.removeAttr(params.val); break;
                case "removeClass": $r.removeClass(params.val); break;
                default:
                    throw new Error(`Param type ${params.type} not understood.`);
            }
            return $.xml();
        } else {
            return val($r, path, content, replace, params);
        }
    */
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
            let meta = travResult.destination.meta;
            let startIndex = meta.range[0];
            let endIndex = meta.range[1];
            //console.log("range", meta, startIndex, endIndex, travResult.destination, travResult.parent)
            return content.substr(0, startIndex) + val + content.substr(endIndex);
        } else if (params.action === Operations.setKey) {
            if (travResult.destinationKey == null) {
                throw new Error(`Cannot set key. Destination "${travResult.subject}" is not a keyed object.`);
            }

            let meta = travResult.destinationKey.meta;
            let startIndex = meta.range[0];
            let endIndex = meta.range[1];
            //console.log("range", meta, startIndex, endIndex, travResult.destination, travResult.parent)
            return content.substr(0, startIndex) + val + content.substr(endIndex);
        } else if (params.action === Operations.remove) {
            return this.transform_remove(content, travResult);
        } else if (params.action === Operations.append) {
            // Appending to an array is straightforward and can be done with any value type
            // Appending to an object requires an input type of object
            // Appending to a string requires a string
            // Appending to anything else throws
            throw new Error("not implemented");
        } else if (params.action === Operations.prepend) {
            throw new Error("not implemented");
        } else if (params.action === Operations.insertAfter) {
            throw new Error("not implemented");
        } else if (params.action === Operations.insertBefore) {
            throw new Error("not implemented");
        }
    }

    protected transform_remove(content: string, travResult: TraversalResult): string {
        switch(travResult.parent.destination.type) {
            case "array":
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
            default:
            throw new Error("not implemented");
        }
    }

    protected getTransformValue(valOrFn: string | Function, subject: string, travResult: TraversalResult, params: ParamsModel): string {
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

        return <string>r;
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
        if (tr.destination.type === "object") {
            tr = this.traverseObject(tr, key, path, i);
        } else if (tr.destination.type === "array") {
            tr = this.traverseArray(tr, key, path, i);
        } else {
            let err = `Element at subpath "${this.buildComponentStr(path, i)}" is not an array or object, but a "${tr.destination.type}".\n`;
            throw new Error(err);
        }
      }
      return tr;
    }

    protected traverseArray(tr: TraversalResult, key: any, path: string[], i: number): TraversalResult {
        if (key >= 0 && key < (<Array<JSONPointer>>tr.destination.v).length) {
            let newTr = new TraversalResult();
            newTr.subject = this.buildComponentStr(path, i + 1);
            newTr.parent = tr;
            newTr.destination = tr.destination.v[key];
            newTr.destinationKey = null;
            return newTr;
        } else {
            throw new Error(`Element "${key}" at subpath "${this.buildComponentStr(path, i)}" does not exist.`);
        }
    }

    protected traverseObject(tr: TraversalResult, key: any, path: string[], i: number): TraversalResult {
        let found = false;
        for(var j=0; j<(<[JSONPointer]>tr.destination.v).length; j++) {
            let tn = tr.destination.v[j]
            if (tn.type === "member" && tn.v[0].v === key) {
                let newTr = new TraversalResult();
                newTr.subject = this.buildComponentStr(path, i + 1);
                newTr.destination = tn.v[1];
                newTr.destinationKey = tn.v[0];
                newTr.parent = tr;
                found = true;
                return newTr;
            }
        }
        
        if (! found) {
            throw new Error(`Element "${key}" at subpath "${this.buildComponentStr(path, i)}" does not exist.`);
        }
    }

    protected buildComponentStr(path: any, upTo: number) {
        return path.reduce((p: string, c: any, i: number) => i < upTo ? (p + "[" + (typeof(c[1]) === "string" ? `"${c[1]}"` : c[1]) + "]") : p, "$");
    }
}

export = JSONPlugin;
