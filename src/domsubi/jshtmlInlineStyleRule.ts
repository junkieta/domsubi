import { jsxmlComponent } from "./jsxmlComponent";
import { jshtmlVisitor } from "./jshtmlVisitor";
import { DOMSource, DOMStringSource } from "./types";

export class jshtmlInlineStyleRule extends jsxmlComponent {
    element: HTMLElement
    cssprop: string;

    constructor(element: HTMLElement, cssprop: string, source: DOMStringSource, parent?: jsxmlComponent) {
        super(source, parent);
        this.element = element;
        this.cssprop = cssprop;
    }

    accept(visitor: jshtmlVisitor): void {
        visitor.visitStyle(this)
    }

    migrate(v:DOMSource) {
        return new jshtmlInlineStyleRule(this.element, this.cssprop, v, this.parent);
    }


}
