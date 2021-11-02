import { jsxmlComponent } from "./jsxmlComponent";
import { jsxmlComponentVisitor } from "./jsxmlComponentVisitor";
import { NodeSource } from "./types";

export class jsxmlNode extends jsxmlComponent {

    reference: [Node] | [Node,Node];

    constructor(ref: Node | [Node] | [Node,Node], source: NodeSource, parent?: jsxmlComponent) {
        super(source, parent);
        this.reference = Array.isArray(ref)
            ? ref
            : ref.nodeType === ref.DOCUMENT_FRAGMENT_NODE
            ? [ref.firstChild, ref.lastChild] as [Node,Node]
            : [ref];
    }

    migrate(source: NodeSource) {
        return new jsxmlNode(this.reference, source, this.parent);
    }

    accept(visitor: jsxmlComponentVisitor): void {
        visitor.visitNode(this);
    }

}
