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
    private placeholder = new Comment('jshtml-placeholder')

    constructor(s: NodeSource) {
        this.source = s;
    }

    protected createVisitor<T extends jsxml>() {
        return new (this.constructor as jsxmlConstructor<T>).visitorConstructor()
    }

    map<T extends jsxml>(f: (s:NodeSource) => NodeSource) : T {
        return new (this.constructor as jsxmlConstructor<T>)(f(this.source));
    }

    wrap<T extends jsxml>(tag:string, attrs?: AttributesSource) : T {
        return new (this.constructor as jsxmlConstructor<T>)({ [tag]: this.source, $: attrs })
    }

    mount(n: Node) {
        new jsxmlNode(n, this.source).accept(this.createVisitor());
    }

    mountAsContents(n: Node) {
        const root = n.hasChildNodes()
            ? new jsxmlNode([n.firstChild,n.lastChild] as [Node,Node], this.source)
            : new jsxmlNode(n.appendChild(this.placeholder.cloneNode(false)), this.source)
        root.accept(this.createVisitor());
    }

    appendTo(n: Node) {
        this.mount(n.appendChild(this.placeholder.cloneNode(false)));
    }

    prependTo(n: Node) {
        this.mount(n.insertBefore(this.placeholder.cloneNode(false), n.firstChild));
    }


}

