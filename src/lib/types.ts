export type Item = {
    description: string;
    license: null;
    longDescription: string | null;
    maintainers: any[];
    platforms: any[];
};

export type Obj = {
    meta?: Item;
    sub?: Record<string, Obj>;
};

export type TOptionsData = Record<string, Obj>;
export type TPkgsData = Record<string, Obj>;
export type TreeRow = {
    key: string;
    item?: Item;
    depth: number;
    type: string;
    hasChildren: boolean;
    expanded: boolean;
    isMatch: boolean;
};
/**
 * M for Modal, I for Item, P for popovers
 */
export type VisibleType = ["MAbout", "MSettings", "PMenu", "ILoader", "IScratchpad"][number];
export const ColorStrings = [
    "blue",
    "teal",
    "green",
    "yellow",
    "orange",
    "red",
    "pink",
    "purple",
    "slate"
] as const;
export type ColorString = (typeof ColorStrings)[number];
// TODO: do this properly
export type KeyString =
    | ","
    | "Ctrl"
    | "f"
    | "ArrowUp"
    | "ArrowDown"
    | "ArrowLeft"
    | "ArrowRight"
    | "c"
    | "Shift"
    | "."
    | "g"
    | "a";
export type KeybindString =
    | KeyString
    | `${KeyString}+${KeyString}`
    | `${KeyString}+${KeyString}+${KeyString}`;
