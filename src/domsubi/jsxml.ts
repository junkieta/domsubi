import { jsxmlVisitor } from "./jsxmlVisitor";
import { jsxmlNode } from "./jsxmlNode";
import { NodeSource, AttributesSource } from "./types";
import { jsxmlComponentVisitor } from "./jsxmlComponentVisitor";

interface jsxmlVisitorConstructor {
    new(): jsxmlComponentVisitor
}

interface jsxmlConstructor<T extends jsxml> {
    visitorConstructor: jsxmlVisitorConstructor
    new(s:NodeSource) : T
}

export class jsxml {

    protected static visitorConstructor : jsxmlVisitorConstructor = jsxmlVisitor;

    source: NodeSource

    constructor(s: NodeSource) {
        this.source = s;
    }

    map(f: (s:NodeSource) => NodeSource) {
        return new (this.constructor as jsxmlConstructor<typeof this>)(f(this.source));
    }

    wrap(tag:string, attrs?: AttributesSource) {
        return new (this.constructor as jsxmlConstructor<typeof this>)({ [tag]: this.source, $: attrs })
    }

    protected _mount(n: jsxmlNode) {
        const v = new (this.constructor as jsxmlConstructor<typeof this>).visitorConstructor()
        n.accept(v);
        return v.detach.bind(v)
    }

    mount(n: Node) {
        return this._mount(new jsxmlNode(n, this.source))
    }

    mountAsContents(n: Node) {
        return this._mount(n.hasChildNodes()
            ? new jsxmlNode([n.firstChild,n.lastChild] as [Node,Node], this.source)
            : new jsxmlNode(n.appendChild(new Comment('jsxml-placeholder')), this.source))
    }

    appendTo(n: Node) {
        return this.mount(n.appendChild(new Comment('jsxml-placeholder')));
    }

    prependTo(n: Node) {
        return this.mount(n.insertBefore(new Comment('jsxml-placeholder'), n.firstChild));
    }


}

