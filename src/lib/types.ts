export type TItem = {
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

export type TObj = {
    meta?: TItem;
    sub?: Record<string, TObj>;
};
export type TOptionsData = Record<string, TObj>;
export type TPkgsData = Record<string, TObj>;
export type TTreeRow = {
    key: string;
    item?: TItem;
    depth: number;
    type: any;
    hasChildren: boolean;
    expanded: boolean;
    isMatch: boolean;
};
/**
 * M for Modal, I for Item, P for popovers
 */
export type TVisibleType = ["MAbout", "MSettings", "PMenu", "ILoader", "IScratchpad"][number];
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
export type TColorString = (typeof ColorStrings)[number];
// TODO: do this properly
export type TKeyString =
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
export type TKeybindString =
    | TKeyString
    | `${TKeyString}+${TKeyString}`
    | `${TKeyString}+${TKeyString}+${TKeyString}`;
export type TMaintainer = { name: string; role: string; [key: string]: string };
type TNewsContent = {
    authors: string[];
    content: string;
    date: `${number}.${number}.${number}`;
    id: `${number}.${number}.${number}-${number}`;
    title: string;
};
export type TAppState = {
    searching: boolean;
    unreadLatest: boolean;
    previewedNews: null | TNewsContent;
    query: string;
    diffSelecting: boolean;
    diffMode: boolean;
    // inferred from reading previous (untyped!) codebase
    diffBaseData: null | Record<string, Record<string, any>>;
    diffBaseVersion: string | null;
    currentNewsContent: null | TNewsContent;
    newsArchive: `${string}.json`[];
    advancedScratchpad: boolean;
    searchMatchIndex: number;
    data: null | {
        maintainers: Record<string, TMaintainer>;
        options: TOptionsData;
        pkgs: TPkgsData;
    };
    versions: [];
    selectedVersion: null | "Latest commit";
    dark: boolean;
    accent: TColorString;
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
        search: TKeybindString;
        up: TKeybindString;
        down: TKeybindString;
        left: TKeybindString;
        right: TKeybindString;
        copyId: TKeybindString;
        copyDesc: TKeybindString;
        version: TKeybindString;
        settings: TKeybindString;
        about: TKeybindString;
        top: "g g"; // this is double press g? gotta think about how to type that
        bottom: TKeybindString;
        nextMatch: TKeybindString;
        prevMatch: TKeybindString;
    };
};
