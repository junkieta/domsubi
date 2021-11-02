import { jsxmlComponent } from "./jsxmlComponent";
import { jshtmlVisitor } from "./jshtmlVisitor";
import { DOMSource, DOMStringSource } from "./types";

export class jshtmlDatasetValue extends jsxmlComponent {

    element: HTMLElement;
    dataname: string;

    constructor(element: HTMLElement, dataname: string, source: DOMStringSource, parent?: jsxmlComponent) {
        super(source, parent);
        this.element = element;
        this.dataname = dataname;
    }

    accept(visitor: jshtmlVisitor): void {
        visitor.visitDataset(this);
    }

    migrate(v: DOMSource) {
        return new jshtmlDatasetValue(this.element, this.dataname, v, this.parent);
    }

}
