export type Item = {
    description: string;
    license: null;
    longDescription: string | null;
    maintainers: any[];
    type?:
        | "string"
        | "array"
        | "number"
        | "boolean"
        | "set"
        | "function"
        | "Open Submodule Of (Attribute Set)"
        | "unspecified value"
        | {
              enum: string[];
          };
    platforms: any[];
    default?: any;
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
    type: any;
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
type NewsContent = {
    authors: string[];
    content: string;
    date: `${number}.${number}.${number}`;
    id: `${number}.${number}.${number}-${number}`;
    title: string;
};
export type TAppState = {
    searching: boolean;
    unreadLatest: boolean;
    previewedNews: null | NewsContent;
    query: string;
    diffSelecting: boolean;
    diffMode: boolean;
    // inferred from reading previous (untyped!) codebase
    diffBaseData: null | Record<string, Record<string, any>>;
    diffBaseVersion: string | null;
    currentNewsContent: null | NewsContent;
    newsArchive: `${string}.json`[];
    advancedScratchpad: boolean;
    searchMatchIndex: number;
    // TODO: better type stuff below
    data: null | {
        maintainers: Record<string, { name: string; role: string; [key: string]: string }>;
        options: TOptionsData;
        pkgs: TPkgsData;
    };
    versions: [];
    selectedVersion: null | "Latest commit";
    dark: boolean;
    accent: ColorString;
    reducedMotion: boolean;
    transparency: number;
    ghToken: string;
    geminiKey: string;
    customFont: string;
    customCSS: string;
    focusedRow: null | string;
    comboTimeout: number;
    currentMeta: null;
    favorites: string[];
    recents: string[];
    searchHistory: string[];
    commandHistory: [];
    scratchpadConfig: string;
    favsCollapsed: boolean;
    keybinds: {
        search: KeybindString;
        up: KeybindString;
        down: KeybindString;
        left: KeybindString;
        right: KeybindString;
        copyId: KeybindString;
        copyDesc: KeybindString;
        version: KeybindString;
        settings: KeybindString;
        about: KeybindString;
        top: "g g"; // this is double press g? gotta think about how to type that
        bottom: KeybindString;
        nextMatch: KeybindString;
        prevMatch: KeybindString;
    };
};
