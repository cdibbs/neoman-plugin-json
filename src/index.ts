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
                    break;
            }
        } else if (params.type === "string") {
            r = this.makeStringString(<string>r);
        } else if (params.type === "number") {
            r = this.makeNumberString(r);
        }

        let meta = travResult.destination.meta;
        let startIndex = meta.range[0];
        let endIndex = meta.range[1];

        return content.substr(0, startIndex) + r + content.substr(endIndex);
    }

    protected makeStringString(r: string): string {
        return "\"" + r.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }
    
    protected makeNumberString(r: any): string {
        return "" + r;
    }

    protected traverse(json: any, subject: string): TraversalResult {
      let tr = new TraversalResult();
      tr.subject = subject;
      tr.parent = null;
      tr.destination = json;
      let ast = jsonPath.parse(subject);
      let path = ast[1];
      for (var i=0; i<path.length; i++) {
        let key = path[i][1];
        if (tr.destination.type === "object") {
            for(var j=0; j<(<[JSONPointer]>tr.destination.v).length; j++) {
                let tn = tr.destination.v[j]
                if (tn.type === "member" && tn.v[0].v === key) {
                    tr.parent = tr.destination;
                    tr.destination = tn.v[1];
                }
            }
        } else if (tr.destination.type === "array") {
            tr.parent = tr.destination;
            tr.destination = tr.destination.v[key];
        } else {
            let err = `Element at subpath ${this.buildComponentStr(path, i)} (while traversing to ${key}) is not an array or object, but a ${tr.destination.type}.\n`;
            throw new Error(err);
        }
      }
      return tr;
    }

    protected buildComponentStr(path: any, upTo: number) {
        return path.reduce((p: string, c: any, i: number) => i < upTo ? (p + "[" + (typeof(c[1]) === "string" ? `"${c[1]}"` : c[1]) + "]") : p, "$");
    }
}

export = JSONPlugin;
