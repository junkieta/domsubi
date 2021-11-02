import { Cell } from "sodiumjs";
import { jsxmlAttr } from "./jsxmlAttr";
import { jshtmlInlineStyleRule } from "./jshtmlInlineStyleRule";
import { jshtmlDatasetValue } from "./jshtmlDataset";
import { jsxmlVisitor } from "./jsxmlVisitor";
import { NodeSource } from "./types";

export class jshtmlVisitor extends jsxmlVisitor {

    buildNode(source: NodeSource, parent: ParentNode) {
        // HTMLTemplateElementだけはcontentをcloneしてビルド
        return super.buildNode(source instanceof HTMLTemplateElement ? source.content.cloneNode(true) : source, parent);
    }

    /**
     * インラインstyleとdatasetに対応する
     */
    visitAttr(attr: jsxmlAttr) {
        const { element, name } = attr;
        const v = attr.source as { [key: string]: string; };
        const isHtmlSpecialized = element instanceof HTMLElement &&
            (name === 'style' || name === 'dataset') &&
            Object(v) === v;
        if (!isHtmlSpecialized) return super.visitAttr(attr);

        const keys = Object.keys(Object.assign({}, v, attr.prevValue));
        if(name === 'style')
            keys.forEach((k) => this.visitStyle(new jshtmlInlineStyleRule(element, k, v[k], attr)));
        else
            keys.forEach((k) => this.visitDataset(new jshtmlDatasetValue(element, k, v[k], attr)));
    }

    visitStyle(style: jshtmlInlineStyleRule) {
        const {source,element,cssprop} = style;
        if(source instanceof Cell)
            this.incarnate(style)
        else if(source === null || source === undefined)
            // 簡略構文がtypescriptではサポートされていないので、強引な型処理でチェックを通す
            element.style[cssprop as "color"] = source === null || source === undefined ? '' : '' + source;
    }

    visitDataset(data: jshtmlDatasetValue) {
        const {source,dataname,element} = data;
        if (source instanceof Cell)
            this.incarnate(data);
        else if(source === null || source === undefined)
            delete element.dataset[hyphenSeparatedToCamelize(dataname)];
        else
            element.dataset[hyphenSeparatedToCamelize(dataname)] = <string>source;
    }

}

/**
 * キャメルケース -> ハイフン区切り変換
 * CSSStyleDeclaraion::setProperty and removeProperty を使う場合は必要
function camelToHyphenSeparated(str: string) {
    return str.replace(/[A-Z]/g, (s: string) => '-' + s.toLowerCase());
}
 */

/**
 * ハイフン区切り -> キャメルケース変換
 * datasetの名称処理に使用
 */
function hyphenSeparatedToCamelize(str: string) {
    return str.replace(/-[a-z]/g, (s: string) => s.charAt(1).toUpperCase());
}
