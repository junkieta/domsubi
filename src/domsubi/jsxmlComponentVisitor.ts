import { jsxmlAttr } from "./jsxmlAttr";
import { jsxmlAttributes } from "./jsxmlAttributes";
import { jsxmlNode } from "./jsxmlNode";

export interface jsxmlComponentVisitor {
    visitNode(n:jsxmlNode) : void;
    visitAttributes(a:jsxmlAttributes) : void;    
    visitAttr(a:jsxmlAttr) : void;
    detach(): void;
}