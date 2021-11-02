import { jsxmlComponent } from "./jsxmlComponent";
import { jsxmlVisitor } from "./jsxmlVisitor";
import { DOMSource } from "./types";

export class jsxmlAttributes extends jsxmlComponent {

    public element: Element;
    prevValues?: DOMSource;

    constructor(elm: Element, source: DOMSource, prev?: DOMSource, parent?: jsxmlComponent) {
        super(source, parent);
        this.element = elm;
        this.prevValues = prev;
    }

    migrate(newValue: DOMSource) {
        return new jsxmlAttributes(this.element, newValue, this.source, this.parent);
    }

    accept(visitor: jsxmlVisitor): void {
        visitor.visitAttributes(this);
    }

}
