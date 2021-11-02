import { jsxmlComponent } from "./jsxmlComponent";
import { jsxmlAttr } from "./jsxmlAttr";
import { Cell, Operational } from "sodiumjs";
import { jsxmlAttributes } from "./jsxmlAttributes";
import { jsxmlNode } from "./jsxmlNode";
import { DOMSource, ElementSource, AttributesSource, AttrValue } from "./types";
import { jsxmlComponentVisitor } from "./jsxmlComponentVisitor";
import { jsxml } from "./jsxml";

type UPDATE_INFO = [jsxmlComponent, DOMSource, DOMSource];

export class jsxmlVisitor implements jsxmlComponentVisitor {

    private _lineage: jsxmlComponent[];
    private _binding: Map<jsxmlComponent, Function>;
    private _updates: UPDATE_INFO[];

    get context() {
        return this._lineage[this._lineage.length - 1];
    }

    constructor() {
        this._binding = new Map();
        this._updates = [];
        this._lineage = [];
    }

    incarnate(c: jsxmlComponent) {
        const cell = c.source as Cell<DOMSource>;
        this._binding.set(c, Operational.updates(cell).listen((v) => this.enqueue([c, v, deepSample(cell)])));
        this._lineage.push(c);
        c.nest(cell.sample()).accept(this);
        this._lineage.pop();
    }

    /* sodiumのガベージコレクションと整合性がとれるならアップデートイベントをmergeしてから更新にしたいが...
    end() {
        const merged = Array.from(this._bindings.keys())
            .map((c) => Operational.updates((c.source as Cell<DOMSource>)).mapTo([c]))
            .reduce((a,b) =>
                a.merge(b, (a,[b]) => a.some((a) => a.isAncestorOf(b))
                    ? a
                    : a.filter((a) => !b.isAncestorOf(a)).concat(b)))
            .once();
        
        Operational
            .defer(merged)
            .listen((updated) => {
                updated.forEach((c) => this.garbageCollect(c));
                updated.forEach((c) => c.accept(this))
            });
    }
    */

    enqueue(i: UPDATE_INFO) {
        if (this._updates.push(i) === 1) requestAnimationFrame(() => this.dequeue());
    }

    dequeue() {
        const u = this._updates;
        while (u.length) {
            u.splice(0)
                .filter(([a], i, q) => q.every(([b]) => a === b || !b.isAncestorOf(a)))
                .forEach(([ctx, v]) => {
                    this.garbageCollect(ctx);
                    ctx.nest(v).accept(this);
                })
        }
    }

    garbageCollect(ctx: jsxmlComponent) {
        Array.from(this._binding.keys())
            .filter((that) => ctx.isAncestorOf(that))
            .forEach((that) => {
                this._binding.get(that) ?? (void 0);
                this._binding.delete(that)
            })
    }

    buildNode(source: DOMSource, parent: ParentNode) {
        if (source instanceof jsxml)
            this.buildNode(source.source, parent);
        else if (source instanceof Cell)
            this.incarnate(new jsxmlNode(parent.appendChild(new Comment('')), source, this.context));
        else if (source instanceof Node)
            parent.append(source);
        else if (Object(source) !== source)
            parent.append(new Text(source === undefined || source === null ? '' : source + ''));
        else if (Array.isArray(source))
            source.forEach((s) => this.buildNode(s, parent));
        else
            this.buildElement(source as ElementSource, parent);
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
        const ref = o.reference.slice(0);
        const n = ref[0];
        const doc = n.ownerDocument as Document;
        const df = doc.createDocumentFragment();
        this.buildNode(o.source, df);
        // リファレンス更新
        o.reference.splice(0,2, ...(df.childNodes.length === 2 ? [df.firstChild,df.lastChild] : [df.firstChild]) as Node[]);
        // DOM更新(Document接続済み)
        if (ref.every((n) => n.isConnected)) {
            const r = new Range();
            if(ref.length === 2) {
                r.setStartBefore(n);
                r.setEndAfter(ref[1]);
            } else {
                r.selectNode(n)
            }
            const o = r.endOffset;
            r.insertNode(df);
            r.setStart(r.startContainer, r.startOffset + r.endOffset - o);
            r.deleteContents();
        }
        // DOM更新(Document接続なし)
        else {
            const parent = n.parentNode;
            if (!parent) return;
            if (!ref[1]) {
                parent.replaceChild(df, n);
            } else {
                parent.insertBefore(df, n);
                while (n.nextSibling && n.nextSibling !== ref[1]) parent.removeChild(n.nextSibling);
                parent.removeChild(n);
                parent.removeChild(ref[1]);
            }
        }

        
    }

    visitAttributes(attrs: jsxmlAttributes) {
        const source = attrs.source;
        if (source instanceof Cell) {
            this.incarnate(attrs);
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
            this.incarnate(attr);
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

}


/**
 * 引数がイベントリスナか判定する
 * @param value
 */
function validateEventListenable(value: unknown): boolean {
    return !!(value) && (typeof value === "function" || typeof (<EventListenerObject>value).handleEvent === 'function');
}

function deepSample<V>(c: Cell<V> | Cell<Cell<V>>): V {
    const v = c.sample();
    return v instanceof Cell ? deepSample(v) : v;
}
