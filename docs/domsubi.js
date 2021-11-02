import { StreamSink, Operational, Cell, TimerSystem, TimerSystemImpl, Transaction, CellLoop } from './sodiumjs';

class jsxmlComponent {
    constructor(source, parent) {
        this.parent = parent;
        this.source = source;
    }
    nest(newValue) {
        return Object.assign(this.migrate(newValue), { parent: this });
    }
    isAncestorOf(that) {
        for (let ctx = that.parent; ctx; ctx = ctx.parent)
            if (ctx === this)
                return true;
        return false;
    }
}

class jsxmlAttr extends jsxmlComponent {
    constructor(element, name, source, old_source, parent) {
        super(source instanceof StreamSink ? source.send.bind(source) : source, parent);
        this.element = element;
        this.name = name;
        this.prevValue = old_source;
    }
    migrate(v) {
        return new jsxmlAttr(this.element, this.name, v, this.source, this.parent);
    }
    accept(visitor) {
        visitor.visitAttr(this);
    }
}

class jsxmlAttributes extends jsxmlComponent {
    constructor(elm, source, prev, parent) {
        super(source, parent);
        this.element = elm;
        this.prevValues = prev;
    }
    migrate(newValue) {
        return new jsxmlAttributes(this.element, newValue, this.source, this.parent);
    }
    accept(visitor) {
        visitor.visitAttributes(this);
    }
}

class jsxmlNode extends jsxmlComponent {
    constructor(ref, source, parent) {
        super(source, parent);
        this.reference = Array.isArray(ref)
            ? ref
            : ref.nodeType === ref.DOCUMENT_FRAGMENT_NODE
                ? [ref.firstChild, ref.lastChild]
                : [ref];
    }
    migrate(source) {
        return new jsxmlNode(this.reference, source, this.parent);
    }
    accept(visitor) {
        visitor.visitNode(this);
    }
}

class jsxmlVisitor {
    constructor() {
        this._binding = new Map();
        this._updates = [];
        this._lineage = [];
    }
    get context() {
        return this._lineage[this._lineage.length - 1];
    }
    incarnate(c) {
        const cell = c.source;
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
    enqueue(i) {
        if (this._updates.push(i) === 1)
            requestAnimationFrame(() => this.dequeue());
    }
    dequeue() {
        const u = this._updates;
        while (u.length) {
            u.splice(0)
                .filter(([a], i, q) => q.every(([b]) => a === b || !b.isAncestorOf(a)))
                .forEach(([ctx, v]) => {
                this.garbageCollect(ctx);
                ctx.nest(v).accept(this);
            });
        }
    }
    garbageCollect(ctx) {
        Array.from(this._binding.keys())
            .filter((that) => ctx.isAncestorOf(that))
            .forEach((that) => {
            this._binding.get(that) ?? (void 0);
            this._binding.delete(that);
        });
    }
    buildNode(source, parent) {
        if (source instanceof Cell)
            this.incarnate(new jsxmlNode(parent.appendChild(new Comment('')), source, this.context));
        else if (source instanceof Node)
            parent.append(source);
        else if (Object(source) !== source)
            parent.append(new Text(source === undefined || source === null ? '' : source + ''));
        else if (Array.isArray(source))
            source.forEach((s) => this.buildNode(s, parent));
        else
            this.buildElement(source, parent);
    }
    buildElement(source, p) {
        const tag = Object.keys(source).find((k) => k !== '$');
        const attrs = source.$;
        const children = source[tag];
        const elm = p.ownerDocument.createElement(tag);
        p.append(elm);
        if (children != null)
            this.buildNode(children, elm);
        if (Object(attrs) === attrs)
            this.visitAttributes(new jsxmlAttributes(elm, attrs, undefined, this.context));
    }
    visitNode(o) {
        const ref = o.reference.slice(0);
        const n = ref[0];
        const doc = n.ownerDocument;
        const df = doc.createDocumentFragment();
        this.buildNode(o.source, df);
        // リファレンス更新
        o.reference.splice(0, 2, ...(df.childNodes.length === 2 ? [df.firstChild, df.lastChild] : [df.firstChild]));
        // DOM更新(Document接続済み)
        if (ref.every((n) => n.isConnected)) {
            const r = new Range();
            if (ref.length === 2) {
                r.setStartBefore(n);
                r.setEndAfter(ref[1]);
            }
            else {
                r.selectNode(n);
            }
            const o = r.endOffset;
            r.insertNode(df);
            r.setStart(r.startContainer, r.startOffset + r.endOffset - o);
            r.deleteContents();
        }
        // DOM更新(Document接続なし)
        else {
            const parent = n.parentNode;
            if (!parent)
                return;
            if (!ref[1]) {
                parent.replaceChild(df, n);
            }
            else {
                parent.insertBefore(df, n);
                while (n.nextSibling && n.nextSibling !== ref[1])
                    parent.removeChild(n.nextSibling);
                parent.removeChild(n);
                parent.removeChild(ref[1]);
            }
        }
    }
    visitAttributes(attrs) {
        const source = attrs.source;
        if (source instanceof Cell) {
            this.incarnate(attrs);
        }
        else {
            const elm = attrs.element;
            const prev = attrs.prevValues || {};
            Object.keys(Object.assign({}, attrs.source, attrs.prevValues))
                .map((k) => new jsxmlAttr(elm, k, source[k], prev[k]))
                .forEach((attr) => this.visitAttr(attr));
        }
    }
    visitAttr(attr) {
        const { element, name, source, prevValue } = attr;
        if (source instanceof Cell) {
            this.incarnate(attr);
        }
        else if (/^on./.test(name)) {
            if (validateEventListenable(prevValue))
                element.removeEventListener(name.slice(2), prevValue, false);
            if (validateEventListenable(source))
                element.addEventListener(name.slice(2), source, false);
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
function validateEventListenable(value) {
    return !!(value) && (typeof value === "function" || typeof value.handleEvent === 'function');
}
function deepSample(c) {
    const v = c.sample();
    return v instanceof Cell ? deepSample(v) : v;
}

class jsxml$1 {
    constructor(s) {
        this._visitor = jsxmlVisitor;
        this.source = s;
    }
    wrapAsElement(tag, attrs) {
        return new this.constructor({ [tag]: this.source, $: attrs });
    }
    mount(n) {
        const root = new jsxmlNode(n, this.source);
        const visitor = new this._visitor();
        root.accept(visitor);
    }
    mountAsContents(n) {
        const root = n.hasChildNodes()
            ? new jsxmlNode([n.firstChild, n.lastChild], this.source)
            : new jsxmlNode(n.appendChild(new Comment('jsxml-placeholder')), this.source);
        const visitor = new this._visitor();
        root.accept(visitor);
    }
}

class jshtmlInlineStyleRule extends jsxmlComponent {
    constructor(element, cssprop, source, parent) {
        super(source, parent);
        this.element = element;
        this.cssprop = cssprop;
    }
    accept(visitor) {
        visitor.visitStyle(this);
    }
    migrate(v) {
        return new jshtmlInlineStyleRule(this.element, this.cssprop, v, this.parent);
    }
}

class jshtmlDatasetValue extends jsxmlComponent {
    constructor(element, dataname, source, parent) {
        super(source, parent);
        this.element = element;
        this.dataname = dataname;
    }
    accept(visitor) {
        visitor.visitDataset(this);
    }
    migrate(v) {
        return new jshtmlDatasetValue(this.element, this.dataname, v, this.parent);
    }
}

class jshtmlVisitor extends jsxmlVisitor {
    buildNode(source, parent) {
        // HTMLTemplateElementだけはcontentをcloneしてビルド
        return super.buildNode(source instanceof HTMLTemplateElement ? source.content.cloneNode(true) : source, parent);
    }
    /**
     * インラインstyleとdatasetに対応する
     */
    visitAttr(attr) {
        const { element, name, source } = attr;
        const isHtmlSpecialized = element instanceof HTMLElement &&
            (name === 'style' || name === 'dataset') &&
            Object(source) === source;
        if (!isHtmlSpecialized)
            super.visitAttr(attr);
        else
            Object.keys(Object.assign({}, source, attr.prevValue))
                .forEach(name === 'style'
                ? (k) => this.visitStyle(new jshtmlInlineStyleRule(element, k, source[k], attr))
                : (k) => this.visitDataset(new jshtmlDatasetValue(element, k, source[k], attr)));
    }
    visitStyle(style) {
        const v = style.source;
        if (v instanceof Cell) {
            this.incarnate(style);
        }
        else {
            const s = style.element.style;
            const n = camelToHyphenSeparated(style.cssprop);
            if (v === null || v === undefined)
                s.removeProperty(n);
            else
                s.setProperty(n, v + '');
        }
    }
    visitDataset(data) {
        const v = data.source;
        if (v instanceof Cell)
            this.incarnate(data);
        else
            data.element.dataset[hyphenSeparatedToCamelize(data.dataname)] = v == null ? '' : v;
    }
}
function camelToHyphenSeparated(str) {
    return str.replace(/[A-Z]/g, (s) => '-' + s.toLowerCase());
}
function hyphenSeparatedToCamelize(str) {
    return str.replace(/-[a-z]/g, (s) => s.charAt(1).toUpperCase());
}

class jshtml$1 extends jsxml$1 {
    constructor() {
        super(...arguments);
        this._visitor = jshtmlVisitor;
    }
    defineAs(tag, super_ = HTMLElement) {
        var _a;
        const mount = (e) => this.mountAsContents(e.attachShadow({ mode: "closed" }));
        const elm_class = (_a = class extends super_ {
                constructor(...args) {
                    super(...args);
                    mount(this);
                }
            },
            _a.tag = tag,
            _a);
        customElements.define(tag, elm_class);
        return elm_class;
    }
}

/**
 * MilisecondTimerSystemImplを参考に、requestAnimationFrame() を組み込むために作成
 */
class AnimationFrameTimerImpl extends TimerSystemImpl {
    constructor() {
        super(...arguments);
        this.now = Date.now.bind(Date);
    }
    setTimer(t, callback) {
        return this.now() < t
            ? clearTimeout.bind(null, setTimeout(callback, t))
            : cancelAnimationFrame.bind(null, requestAnimationFrame(callback));
    }
}
class AnimationFrameTimerSystem extends TimerSystem {
    constructor() {
        super(new AnimationFrameTimerImpl());
    }
}

/**
 * sodium公式でも使用される時間Stream。一定時間毎に時刻を送信する。
 */
function periodic(sys, ms) {
    return Transaction.run(() => {
        const oAlarm = new CellLoop();
        const sAlarm = sys.at(oAlarm);
        oAlarm.loop(sAlarm.map((t) => t + ms).hold(sys.time.sample() + ms));
        return sAlarm;
    });
}
/**
 * 現在時刻から指定ミリ秒が経過するまで、0~1の範囲をサンプリングするStream
 */
function duration(sys, ms) {
    const start_t = sys.time.sample();
    const end_t = start_t + ms;
    return Transaction.run(() => {
        const oAlarm = new CellLoop();
        const sAlarm = sys.at(oAlarm);
        oAlarm.loop(sAlarm
            .snapshot(sys.time, (t, now) => now < end_t ? now : t === end_t ? null : end_t)
            .hold(start_t));
        const sResult = sAlarm.map((t) => {
            const _t = t - start_t;
            return _t ? Math.min(_t / end_t - start_t, 1) : _t;
        });
        return Object.assign(sResult, { end: Operational.defer(sResult.filter((t) => t === 1)) });
    });
}

/**
 * ターゲットのイベントをStream化する。
 */
const events = (t) => {
    const map = {};
    const send = (e) => map[e.type].send(e);
    return new Proxy(map, {
        get: (o, p) => {
            if (typeof p === 'symbol' || o.hasOwnProperty(p))
                return Reflect.get(o, p);
            t.addEventListener(p, send);
            return (o[p] = new StreamSink());
        }
    });
};
/**
 * ターゲットの変異をStream化する。
 */
const mutations = (n, init) => {
    const sink = new StreamSink();
    const observer = new MutationObserver(sink.send.bind(sink));
    observer.observe(n, init);
    return Operational.split(sink);
};
/**
 * ターゲットの属性をCell化する。
 */
const attributes = (e, filter) => {
    const sAttrChanges = mutations(e, { attributes: true, attributeFilter: filter });
    return new Proxy({}, {
        get: (o, p) => {
            if (typeof p === 'string' && !o.hasOwnProperty(p))
                Reflect.set(o, p, sAttrChanges
                    .filter((r) => r.attributeName === p)
                    .map((r) => e.getAttribute(p) || '')
                    .hold(e.hasAttribute(p) ? e.getAttribute(p) || '' : ''));
            return Reflect.get(o, p);
        }
    });
};
/**
 * jshtml記法のノードをElementにラップする
 */
const wrap = (tag, attrs) => attrs
    ? (content) => ({ [tag]: content, $: attrs })
    : (content) => ({ [tag]: content });
// jsxml, jshtmlは純粋関数としても活用できるようにProxyをかます
const proxy_handler = {
    apply(target, b, c) { return new target(c[0]); }
};
const jsxml = new Proxy(jsxml$1, proxy_handler);
const jshtml = new Proxy(jshtml$1, proxy_handler);

export { AnimationFrameTimerSystem, attributes, duration, events, jshtml, jshtmlVisitor, jsxml, jsxmlVisitor, mutations, periodic, wrap };
//# sourceMappingURL=domsubi.js.map
