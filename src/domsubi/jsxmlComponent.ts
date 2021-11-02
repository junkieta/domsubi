import { jsxmlComponentVisitor } from "./jsxmlComponentVisitor";
import { DOMSource } from "./types";


export abstract class jsxmlComponent {

    abstract accept(visitor: jsxmlComponentVisitor): void;
    abstract migrate(newValue: DOMSource) : jsxmlComponent;

    source: DOMSource
    parent?: jsxmlComponent

    constructor(source: DOMSource, parent?: jsxmlComponent) {
        this.parent = parent;
        this.source = source;
    }

    nest(newValue: DOMSource) : jsxmlComponent {
        return Object.assign(this.migrate(newValue), { parent: this })
    }

    isAncestorOf<C extends jsxmlComponent>(that: C) {
        for(let ctx = that.parent; ctx; ctx = ctx.parent) if(ctx === this) return true;
        return false;
    }

}
