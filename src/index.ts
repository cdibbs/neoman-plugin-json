import * as json from './parsers/json';
import * as jsonPath from './parsers/json-path';
import { TraversalResult } from './traversal-result';

class JSONPlugin {
    pluginConfiguration: any;

    configure(pluginConfiguration: any) {
        this.pluginConfiguration = pluginConfiguration;
    }

    transform(path: string, content: string, subject: string, val: string | Function, params: any): string {
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
    let obj = json.parse(content);
    let result = this.traverse(obj, subject);

        try {
        console.log("JSON!", JSON.stringify(json.parse(content), null, 4));
        return content;
        } catch(ex) {
            console.log(ex);
        }
    }

    traverse(json: any, subject: string): TraversalResult {
      let tr = new TraversalResult();
      tr.subject = subject;
      tr.parent = null;
      tr.result = json;
      let ast = jsonPath.parse(subject);
      let path = ast[1];
      for (var i=0; i<path.length; i++) {
        let key = path[i][1];
        if (tr.result.hasOwnProperty(key)) {
          tr.parent = tr.result;
          tr.result = tr.result[key];
        }
      }
      return tr;
    }
}

export = JSONPlugin;
