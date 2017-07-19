import * as json from './parsers/json';
import * as jsonPath from './parsers/json-path';
import { TraversalResult } from './traversal-result';

class XmlPlugin {
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
    let traverser = this.traverse(subject);

        try {
        console.log("JSON!", JSON.stringify(json.parse(content), null, 4));
        return content;
        } catch(ex) {
            console.log(ex);
        }
    }

    traverse(subject: string): TraversalResult {
        let ast = jsonPath.parse(subject);
        console.log(ast);
        return new TraversalResult();
    }
}

export = XmlPlugin;
