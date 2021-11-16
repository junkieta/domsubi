import { jsxmlComponent } from "./jsxmlComponent";
import { jsxmlAttr } from "./jsxmlAttr";
import { Cell, Operational } from "sodiumjs";
import { jsxmlAttributes } from "./jsxmlAttributes";
import { jsxmlNode } from "./jsxmlNode";
import { DOMSource, ElementSource, AttributesSource, AttrValue } from "./types";
import { jsxmlComponentVisitor } from "./jsxmlComponentVisitor";

type UPDATE_INFO = [jsxmlComponent, DOMSource, DOMSource];

export class jsxmlVisitor implements jsxmlComponentVisitor {

    /**
     * ガベージコレクションの管理用。
     */
    private _binding : Map<jsxmlComponent, Function>;

    /**
     * componentの入れ子状況
     */
    private _lineage: jsxmlComponent[] = [];
    
    /**
     * listenで取得する更新情報の格納場所。requestAnimationFrameで一括処理する。
     */
    private _updates: UPDATE_INFO[] = [];

    constructor() {
        this._binding = new Map();
    }

    get context() {
        return this._lineage[this._lineage.length - 1];
    }

    visitCell(c: jsxmlComponent) {
        const cell = c.source as Cell<DOMSource>;
        this._binding.set(c, Operational.updates(cell).listen((v) => this.enqueue([c, v, deepSample(cell)])));
        this._lineage.push(c);
        c.nest(cell.sample()).accept(this);
        this._lineage.pop();
    }

    enqueue(i: UPDATE_INFO) {
        if (this._updates.push(i) === 1) requestAnimationFrame(() => this.dequeue());
    }

    dequeue() {
        this._updates.splice(0)
            .filter(([a], i, q) => q.every(([b]) => a === b || !b.isAncestorOf(a)))
            .forEach(([ctx, v]) => {
                this.garbageCollect(ctx);
                ctx.nest(v).accept(this);
            });
    }

    garbageCollect(ctx: jsxmlComponent) {
        Array.from(this._binding.keys())
            .filter((that) => ctx.isAncestorOf(that))
            .forEach((that) => {
                this._binding.get(that)!(void 0);
                this._binding.delete(that)
            })
    }

    buildNode(s: DOMSource, p: ParentNode) {
        if (s instanceof Cell)
            this.visitCell(new jsxmlNode(p.appendChild(new Comment('jsxml-placeholder')), s, this.context));
        else if (s instanceof Node)
            p.append(s);
        else if (Object(s) !== s)
            p.append(new Text(s === undefined || s === null ? '' : s + ''));
        else if (Array.isArray(s))
            s.forEach((s) => this.buildNode(s, p));
        else
            this.buildElement(s as ElementSource, p);
    }

    buildElement(source: ElementSource, p: ParentNode) {
        const tag = Object.keys(source).find((k) => k !== '$') as keyof HTMLElementTagNameMap;
        const attrs = source.$ as AttributesSource;
        const children = source[tag];
        const elm = (p.ownerDocument as Document).createElement(tag);
        p.append(elm);
        if (children != null)
            this.buildNode(children, elm);
        if (Object(attrs) === attrs)
            this.visitAttributes(new jsxmlAttributes(elm, attrs, undefined, this.context));
    }

    visitNode(o: jsxmlNode): void {
        const [a,b] = o.reference.slice(0);
        const doc = a.ownerDocument as Document;
        const df = doc.createDocumentFragment();

        this.buildNode(o.source, df);
        // リファレンス更新
        o.reference.splice(0,2, ...(df.childNodes.length === 2 ? [df.firstChild,df.lastChild] : [df.firstChild]) as Node[]);

        if(!b) a.parentNode!.replaceChild(df, a);

        // DOM更新(Document接続済み)
        else if (a.isConnected) {
            const r = new Range();
            r.setStartBefore(a);
            r.setEndAfter(b);
            const o = r.endOffset;
            r.insertNode(df);
            r.setStart(r.startContainer, r.startOffset + r.endOffset - o);
            r.deleteContents();
        }

        // DOM更新(Document接続なし)
        else {
            const parent = a.parentNode; if (!parent) return;
            parent.insertBefore(df, a);
            while (a.nextSibling && a.nextSibling !== b) parent.removeChild(a.nextSibling);
            parent.removeChild(a);
            parent.removeChild(b);
        }

        
    }

    visitAttributes(attrs: jsxmlAttributes) {
        const source = attrs.source;
        if (source instanceof Cell) {
            this.visitCell(attrs);
        } else {
            type V = { [key: string]: AttrValue; };
            const elm = attrs.element;
            const prev = attrs.prevValues || {};
            Object.keys(Object.assign({}, attrs.source, attrs.prevValues))
                .map((k) => new jsxmlAttr(elm, k, (source as V)[k], (prev as V)[k]))
                .forEach((attr) => this.visitAttr(attr));
        }
    }

    visitAttr(attr: jsxmlAttr) {
        const { element, name, source, prevValue } = attr;

        if (source instanceof Cell) {
            this.visitCell(attr);
        }

        else if (/^on./.test(name)) {
            if (validateEventListenable(prevValue))
                element.removeEventListener(name.slice(2), <EventListenerOrEventListenerObject>prevValue, false);
            if (validateEventListenable(source))
                element.addEventListener(name.slice(2), <EventListenerOrEventListenerObject>source, false);
        }

        else if (source == null || source == '')
            element.removeAttribute(name);

        else if (Object(source) !== source)
            element.setAttribute(name, "" + source);

        else if (/^class(List)?$/.test(name))
            element.className = Array.isArray(source)
                ? source.filter(Boolean).join(" ")
                : '' + source;

    }

    detach() {
        Array.from(this._binding.values()).forEach((v) => v());
        this._binding.clear();
    }

}


/**
 * 引数がイベントリスナか判定する
 * @param value
 */
function validateEventListenable(value: unknown): boolean {
    return !!(value) && (typeof value === "function" || typeof (<EventListenerObject>value).handleEvent === 'function');
}

function deepSample<V>(v: V | Cell<V>): V {
    return v instanceof Cell ? deepSample(v.sample()) : v;
}
