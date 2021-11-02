import { StreamSink } from "sodiumjs";
import { jsxmlComponent } from "./jsxmlComponent";
import { jsxmlComponentVisitor } from "./jsxmlComponentVisitor";
import { AttrValue, DOMSource } from "./types";

export class jsxmlAttr extends jsxmlComponent {

    public element: Element;
    public name: string;
    public prevValue?: AttrValue;

    constructor(element: Element, name: string, source: AttrValue, old_source?: AttrValue, parent?: jsxmlComponent) {
        super(source instanceof StreamSink ? source.send.bind(source) : source, parent)
        this.element = element;
        this.name = name;
        this.prevValue = old_source;
    }

    migrate(v: DOMSource) {
        return new jsxmlAttr(this.element, this.name, v, this.source, this.parent);
    }

    accept(visitor: jsxmlComponentVisitor): void {
        visitor.visitAttr(this);
    }

}
