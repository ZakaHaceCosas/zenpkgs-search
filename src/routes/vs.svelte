<script lang="ts">
    import type { TreeRow, Obj, TAppState } from "$lib/types";
    import { onMount } from "svelte";
    const escapeHTML = (str: string) => {
        if (!str) return "";
        return str
            .toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };
    const isMatch = (key: string, str: string) => {
        return key.toLowerCase().includes(str.toLowerCase());
    };
    function buildVisibleTree(data: Record<string, Obj>, expanded: Set<string>): TreeRow[] {
        const result: TreeRow[] = [];

        function walk(obj: Record<string, Obj>, depth = 0, path: string[] = []) {
            console.log("Walking", obj);
            for (const [key, value] of Object.entries(obj)) {
                const fullKey = [...path, key].join(".");

                const hasChildren = !!value.sub;
                const isExpanded = expanded.has(fullKey);

                result.push({
                    key: fullKey,
                    item: value.meta,
                    depth,
                    hasChildren,
                    type: (hasChildren ? "options" : JSON.stringify(value.meta?.type))!,
                    expanded: isExpanded,
                    isMatch: appState.query ? isMatch(key, appState.query) : false
                });

                if (hasChildren && isExpanded) {
                    walk(value.sub!, depth + 1, [...path, key]);
                }
            }
        }

        walk(data);
        return result;
    }

    let {
        data,
        rowHeight = 28,
        appState
    } = $props<{
        data: Record<string, Obj>;
        rowHeight?: number;
        appState: TAppState;
    }>();

    let expanded = new Set<string>();
    let rows: TreeRow[] = $state([]);

    // virtual scroll state
    let container: HTMLDivElement;
    let scrollTop = $state(0);
    let viewportHeight = $state(0);

    const buffer = 30;

    // rebuild rows when expanded changes
    function rebuild() {
        rows = buildVisibleTree(data, expanded);
    }

    function toggle(key: string) {
        if (expanded.has(key)) {
            expanded.delete(key);
        } else {
            expanded.add(key);
        }
        rebuild();
    }

    function select(target: TreeRow) {
        appState.focusedRow = {
            path: target.key,
            type: target.type
        };

        const stored = localStorage.getItem("recents");
        let recents = [];
        try {
            recents = stored ? (JSON.parse(stored).recents ?? []) : [];
        } catch (e) {
            recents = [];
        }
        recents.push({
            path: target.key,
            type: target.type
        });
        localStorage.setItem("recents", JSON.stringify({ recents }));
    }

    let startIndex = $derived(Math.max(0, Math.floor(scrollTop / rowHeight) - buffer));
    let endIndex = $derived(
        Math.min(rows.length, Math.ceil((scrollTop + viewportHeight) / rowHeight) + buffer)
    );
    let visibleRows = $derived(rows.slice(startIndex, endIndex));

    function handleScroll() {
        scrollTop = container.scrollTop;
    }

    onMount(() => {
        viewportHeight = container.clientHeight;
        rebuild();
    });
</script>

<div class="tree-root virtual-container" bind:this={container} onscroll={handleScroll}>
    <div class="virtual-viewport tree-node-wrapper" style="height: {rows.length * rowHeight}px">
        {#each visibleRows as row, i}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div
                class="virtual-row tree-row"
                style="top: {(startIndex + i) *
                    rowHeight}px; height: {rowHeight}px; padding-left: {row.depth * 16}px"
                class:selected={appState.focusedRow?.path === row.key &&
                    appState.focusedRow?.type === row.type}
                class:search-leaf-match={row.isMatch}
                onclick={() => {
                    select(row);
                    row.hasChildren && toggle(row.key);
                }}
            >
                <div class="row-icon expanded">
                    {row.hasChildren ? (row.expanded ? "▼" : "▶") : "●"}
                </div>

                <div class="row-label">
                    <span class="label">
                        {@html row.isMatch
                            ? row.key
                                  .split(".")
                                  .at(-1)!
                                  .replace(new RegExp(appState.query, "i"), (m) => `<b>${m}</b>`)
                            : escapeHTML(row.key.split(".").at(-1)!)}
                    </span>
                </div>
            </div>
        {/each}
    </div>
</div>

<style>
    .virtual-container {
        overflow-y: auto;
        height: 100%;
        position: relative;
    }

    .virtual-viewport {
        position: relative;
    }

    .virtual-row {
        position: absolute;
        width: 100%;
    }
</style>
