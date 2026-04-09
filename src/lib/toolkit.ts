import type { TAppState } from "./types";

/**
 *
 * @param {TAppState} state
 * @param {string} key
 * @returns New state. `false` if removed, `true` if added.
 */
export function toggleFavorite(state: TAppState, key: string): boolean {
    const prev = state.favorites.includes(key);
    if (prev)
        localStorage.setItem("favorites", JSON.stringify(state.favorites.filter((v) => v != key)));
    else localStorage.setItem("favorites", JSON.stringify([key, ...state.favorites]));
    state.favorites = JSON.parse(localStorage.getItem("favorites")!);
    return !prev;
}
export function addToScratchpad(a: any) {
    alert("my lazy ass still has to do this");
    return "noop";
}
export function copyToClipboard(a: any) {
    alert("my lazy ass still has to do this");
    return "noop";
}
export function queryFavorites(state: TAppState, key: string) {
    return state.favorites.includes(key);
}
