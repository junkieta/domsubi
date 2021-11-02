export function f(args,pre) {
    const keys = Object.keys(args);
    Function(...keys,pre.textContent).apply(null, keys.map((k) => args[k]));
}
